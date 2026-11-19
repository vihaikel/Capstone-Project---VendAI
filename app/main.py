import logging
from fastapi import FastAPI, status, HTTPException
from app.schemas import RiskRequest, RiskResponse, GenerativeRequest, GenerativeResponse
from app.services.rank_load import risk_predict
from app.services.gen_ai import generate_explaination

app = FastAPI(
    title="VendAI API",
    description="API untuk rekomendasi vendor",
    version="0.2.0"
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is running"}

@app.post("/risk_analysis", response_model = RiskResponse)
def risk_analysis(request: RiskRequest):
    try:
        result = risk_predict(request.model_dump())
        return result

    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Risk model belum tersedia.")
    
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_442_UNPROCESSABLE_ENTITY, detail=str(ve))

@app.post("/generate_explanation", response_model = GenerativeResponse)
def generate_explanation(request: GenerativeRequest):
    try:
        supplier_data = [supplier.model_dump(exclude_none=True) for supplier in request.supplier]
        procurement_data = request.procurement_request.model_dump(exclude_none=True)
        result = generate_explaination(supplier_data=supplier_data, procurement_request=procurement_data, question=request.question)
        return result
    
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))

    except Exception:
        logger.exception("Gemini gagal menghasilkan penjelasan")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Gagal menghasilkan penjelasan. Silakan coba lagi nanti.")