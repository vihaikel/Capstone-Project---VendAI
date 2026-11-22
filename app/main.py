import logging
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

app = FastAPI(
    title="VendAI API",
    description="API untuk rekomendasi vendor",
    version="0.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin=["http:??localhost:5173"],
    allow_credentials=True,
    all_methods=["*"],
    allow_headres=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is running"}

# Response Perhitungan Risk Analysis
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