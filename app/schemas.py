from pydantic import BaseModel, Field, ConfigDict
from typing import Literal

# Request frontend
class RecommendationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    min_financial_stability: float | None = Field(
        default=None, ge=0, le=100
    )

    min_on_time_delivery: float | None = Field(
        default=None, ge=0, le=100
    )

    max_defect_rate: float | None = Field(
        default=None, ge=0, le=10
    )

    max_geopolitical_risk: float | None = Field(
        default=None, ge=0, le=100
    )

    max_lead_time_days: float | None = Field(
        default=None, ge=0
    )

    min_alternative_suppliers: int | None = Field(
        default=None, ge=0
    )

    min_contract_length_months: int | None = Field(
        default=None, ge=0
    )

    min_environmental_compliance: float | None = Field(
        default=None, ge=0, le=100
    )

    max_previous_disruptions: int | None = Field(
        default=None, ge=0
    )

    risk_level: Literal[0, 1] | None = None

    top_n: int = Field(default=10, ge=1, le=100)

# Satu hasil rekomendasi vendor
class VendorRecomendation(BaseModel):
    supplier_id: str
    score: float
    rank: int
    risk_level: Literal[0,1]

# Response backend
class RecommendationResponse(BaseModel):
    total_recommendations: int
    recommendations: list[VendorRecomendation]