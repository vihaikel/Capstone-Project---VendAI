from pydantic import BaseModel, Field


# Input dari frontend React
class RecommendationRequest(BaseModel):
    budget: float = Field(
        gt=0,
        description="Anggaran maksimum untuk vendor"
    )

    min_sla: float = Field(
        ge=0,
        le=100,
        description="SLA minimum yang diinginkan dalam persen"
    )


# Informasi setiap vendor hasil ranking
class VendorRecommendation(BaseModel):
    vendor: str
    score: float
    rank: int


# Response endpoint rekomendasi
class RecommendationResponse(BaseModel):
    recommendations: list[VendorRecommendation]
