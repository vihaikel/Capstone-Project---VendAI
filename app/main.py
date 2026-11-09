from fastapi import FastAPI
from app.schemas import (
    RecommendationRequest,
    RecommendationResponse,
)

app = FastAPI()


@app.post(
    "/recommend",
    response_model=RecommendationResponse
)
def recommend(request: RecommendationRequest):
    # Nanti diganti dengan pemanggilan model ranking.
    return {
        "recommendations": [
            {
                "vendor": "Vendor A",
                "score": 0.91,
                "rank": 1
            }
        ]
    }