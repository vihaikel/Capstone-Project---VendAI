from fastapi import FastAPI
from app.schemas import (
    RecommendationRequest,
    RecommendationResponse,
    VendorRecomendation
)

app = FastAPI(
    title="VendAI API",
    description="API untuk rekomendasi vendor",
    version="0.1.0"
)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is running"}

@app.post(
    "/recommend",
    response_model=RecommendationResponse
)
def recommend(request: RecommendationRequest):
    # Nanti diganti dengan pemanggilan model ranking
    # Ini masih dummy response

    rekomendasi = [
        VendorRecomendation(
            supplier_id="Vend_001",
            score=0.91,
            rank=1,
            risk_level=0
        ),
        VendorRecomendation(
            supplier_id="Vend_002",
            score=0.84,
            rank=2,
            risk_level=1
        ),
    ]
    return RecommendationResponse(
        total_recommendations=len(rekomendasi),
        recommendations=rekomendasi
    )