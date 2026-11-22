import logging
from typing import Literal
import psycopg
from fastapi import FastAPI, status, HTTPException
from google.genai.errors import ServerError
from app.schemas import (
    RiskRequest, RiskResponse, 
    GenerativeRequest, GenerativeResponse, 
    RecommendationRequest, RecommendationResponse,
    ProcurementFlowRequest, ProcurementFlowResponse)
from app.services.risk_prediction import risk_predict
from app.services.gen_ai import generate_explaination
from app.services.ranking import get_recommendations
from fastapi.middleware.cors import CORSMiddleware
from app.db import query

app = FastAPI(
    title="VendAI API",
    description="API untuk rekomendasi vendor",
    version="0.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],   
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is running"}

# ============ DATA VENDOR DARI DATABASE ============
# 1 baris = vendor x item, digabung dengan skor risiko & konfigurasi ranking aktif.
CATALOG_SQL = """
SELECT i.item_id, v.supplier_id, v.vendor_type, i.main_category::text AS main_category,
       i.sub_category, i.item_description, i.unit::text AS unit,
       i.unit_price_idr::float AS unit_price_idr, i.moq,
       i.capacity_per_week::float AS capacity_per_week, i.capacity_per_month::float AS capacity_per_month,
       COALESCE(v.lead_time_days, (rc.tech_medians->>'Lead_Time_Days')::numeric)::float AS lead_time_days,
       v.on_time_delivery_rate::float AS on_time_delivery_rate, v.defect_rate::float AS defect_rate,
       s.risk_score::float AS risk_score, s.risk_tier::text AS risk_tier, s.kriteria_teknis_gagal,
       rc.weight_risk::float AS w_risk, rc.weight_price::float AS w_price,
       rc.weight_lead_time::float AS w_lead, rc.excluded_tiers::text[] AS excluded_tiers
FROM vendor_items i
JOIN vendors v USING (supplier_id)
JOIN vendor_risk_scores s USING (supplier_id)
JOIN ranking_configs rc ON rc.is_active AND rc.model_version_id = s.model_version_id
"""
OUTPUT_COLS = """item_id, supplier_id, vendor_type, main_category, sub_category, item_description, unit,
       unit_price_idr, moq, capacity_per_week, lead_time_days, on_time_delivery_rate, defect_rate,
       risk_score, risk_tier, kriteria_teknis_gagal"""
SORTS = {"score": "risk_score", "price": "unit_price_idr", "lead_time": "lead_time_days"}


def db(sql, params=None):
    try:
        return query(sql, params)
    except (ConnectionError, psycopg.OperationalError) as e:
        logger.exception("Database tidak dapat diakses")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Database tidak tersedia: {e}")


@app.get("/categories")
def categories():
    return db("SELECT DISTINCT main_category::text, sub_category, unit::text FROM vendor_items ORDER BY 1, 2")


@app.get("/vendors")
def vendors(main_category: str | None = None, q: str | None = None,
            sort: Literal["score", "price", "lead_time"] = "score", limit: int = 50, offset: int = 0):
    rows = db(f"""
        SELECT {OUTPUT_COLS}, count(*) OVER () AS total FROM ({CATALOG_SQL}) c
        WHERE (%(cat)s::text IS NULL OR main_category = %(cat)s)
          AND (%(q)s::text IS NULL OR supplier_id ILIKE %(q)s OR item_description ILIKE %(q)s)
        ORDER BY {SORTS[sort]}, item_id
        LIMIT %(limit)s OFFSET %(offset)s""",
        {"cat": main_category, "q": f"%{q}%" if q else None,
         "limit": min(max(limit, 1), 200), "offset": max(offset, 0)})
    total = rows[0].pop("total") if rows else 0
    for r in rows[1:]:
        r.pop("total")
    return {"total": total, "items": rows}


@app.post("/recommend")
def recommend(req: RecommendRequest):
    # Port rank_vendors (notebooks/06_ranking.ipynb): filter lalu skor
    # w_risk*(1-risk) + w_price*inv_minmax(harga) + w_lead*inv_minmax(lead time)
    return db(f"""
        WITH c AS (
            SELECT * FROM ({CATALOG_SQL}) c
            WHERE main_category = %(main)s AND sub_category = %(sub)s
              AND moq <= %(q)s AND unit_price_idr * %(q)s <= %(budget)s
              AND risk_tier <> ALL(excluded_tiers)
              AND (%(vt)s::text IS NULL OR vendor_type = %(vt)s)
              AND CASE WHEN %(deadline)s::int IS NULL THEN %(q)s <= capacity_per_month
                       ELSE %(deadline)s - lead_time_days >= 0
                        AND %(q)s <= capacity_per_week * (%(deadline)s - lead_time_days) / 7 END
        ), scored AS (
            SELECT *, unit_price_idr * %(q)s AS total_price,
                   w_risk * (1 - risk_score)
                 + w_price * CASE WHEN max(unit_price_idr) OVER () = min(unit_price_idr) OVER () THEN 1
                     ELSE (max(unit_price_idr) OVER () - unit_price_idr)
                        / (max(unit_price_idr) OVER () - min(unit_price_idr) OVER ()) END
                 + w_lead * CASE WHEN max(lead_time_days) OVER () = min(lead_time_days) OVER () THEN 1
                     ELSE (max(lead_time_days) OVER () - lead_time_days)
                        / (max(lead_time_days) OVER () - min(lead_time_days) OVER ()) END AS score
            FROM c
        )
        SELECT row_number() OVER (ORDER BY score DESC, item_id) AS rank, {OUTPUT_COLS}, total_price, score
        FROM scored ORDER BY score DESC, item_id LIMIT %(top_k)s""",
        {"main": req.main_category, "sub": req.sub_category, "q": req.quantity, "budget": req.budget,
         "vt": req.vendor_type, "deadline": req.deadline_days, "top_k": req.top_k})

@app.post("/risk_analysis", response_model = RiskResponse)
def risk_analysis(request: RiskRequest):
    try:
        result = risk_predict(request.model_dump())
        return result

    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Risk model belum tersedia.")
    
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))

# Response Penjelasan Gemini
@app.post("/generate_explanation", response_model = GenerativeResponse)
def generate_explanation(request: GenerativeRequest):
    try:
        supplier_data = [supplier.model_dump(exclude_none=True) for supplier in request.supplier]
        procurement_data = request.procurement_request.model_dump(exclude_none=True)
        result = generate_explaination(supplier_data=supplier_data, procurement_request=procurement_data, question=request.question)
        return result
    
    except RuntimeError as re:
        logger.exception("Gemini tidak menghasilkan jawaban")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Model gagal menghasilkan jawaban")

    except ServerError:
        logger.exception("Gemini sedang tidak tersedia")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Gemini sedang tidak tersedia. Silakan coba lagi nanti.")
    
    except Exception:
        logger.exception("Gemini gagal menghasilkan penjelasan")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Gagal menghasilkan penjelasan. Silakan coba lagi nanti.")

# Response Rekomendasi Vendor
@app.post("/recommendations", response_model = RecommendationResponse)
def recommendations(request: RecommendationRequest):
    try:
        result = get_recommendations(
            main_category=request.main_category,
            sub_category=request.sub_category,
            quantity=request.quantity,
            budget=request.budget,
            deadline_days=request.deadline_days,
            vendor_type=request.vendor_type,
            top_k=request.top_k,
        )
        result = result.astype(object).where(result.notna(), None)
        suppliers = result.to_dict(orient="records")

        return {"total": len(suppliers), "suppliers": suppliers}

    except FileNotFoundError as e:
        logger.exception("File data ranking tidak ditemukan")
        raise HTTPException(status_code=503, detail="Data supplier atau konfigurasi ranking belum tersedia.")

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    except Exception:
        logger.exception("Gagal menjalankan ranking supplier")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan saat memproses rekomendasi supplier.")

# Response Procurement Flow (dari user)
@app.post("/procurement", response_model = ProcurementFlowResponse)
def procurement(request: ProcurementFlowRequest):
    # Tahap 1: Ranking supplier
    try:
        result = get_recommendations(
            main_category=request.main_category,
            sub_category=request.sub_category,
            quantity=request.quantity,
            budget=request.budget,
            deadline_days=request.deadline_days,
            vendor_type=request.vendor_type,
            top_k=request.top_k,
        )

        result = result.astype(object).where(result.notna(), None)
        suppliers = result.to_dict(orient="records")

    except FileNotFoundError:
        logger.exception("Data supplier atau konfigurasi ranking tidak ditemukan")
        raise HTTPException(status_code=503, detail="Data supplier atau konfigurasi ranking belum tersedia.")

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    except Exception:
        logger.exception("Gagal menjalankan ranking supplier")
        raise HTTPException(status_code=500, detail="Gagal memproses ranking supplier.")

    # Jika tidak ada supplier yang memenuhi kriteria
    if not suppliers:
        return {
            "total": 0,
            "suppliers": [],
            "explanation": None,
            "model": None,
            "explanation_status": "no_recommendations"
        }

    # Tahap 2: Generate explanation menggunakan Gemini
    procurement_data = request.model_dump(exclude={"question"}, exclude_none=True)

    try:
        explanation_result = generate_explaination(
            supplier_data=suppliers,
            procurement_request=procurement_data,
            question=request.question
        )

        return {
            "total": len(suppliers),
            "suppliers": suppliers,
            "explanation": explanation_result["explanation"],
            "model": explanation_result["model"],
            "explanation_status": "success"
        }

    except ServerError:
        logger.exception("Gemini sedang tidak tersedia")
        explanation_status = "unavailable"

    except Exception:
        logger.exception("Gagal menghasilkan penjelasan Gemini")
        explanation_status = "failed"

    # Ranking tetap dikembalikan meskipun Gemini gagal
    return {
        "total": len(suppliers),
        "suppliers": suppliers,
        "explanation": None,
        "model": None,
        "explanation_status": explanation_status
    }