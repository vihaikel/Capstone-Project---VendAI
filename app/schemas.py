from pydantic import BaseModel, Field, ConfigDict
from typing import Literal, Any

# Request frontend
class RiskRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    Financial_Stability_Score: float | None = Field(default=None, ge=0, le=100)
    On_Time_Delivery_Rate: float | None = Field(default=None, ge=0, le=100)
    Defect_Rate: float | None = Field(default=None, ge=0, le=10)
    Lead_Time_Days: float | None = Field(default=None, ge=1)
    Alternative_Suppliers_Available: float | None = Field(default=None, ge=0, le=10)
    Contract_Length_Months: int | None = Field(default=None, ge=0)
    Environmental_Compliance: int | None = Field(default=None, ge=0, le=100)
    Previous_Disruptions: float | None = Field(default=None, ge=0, le=10)

class RiskResponse(BaseModel):
    Risk_Score: float
    Operasional_Buruk: bool
    Teknis_Buruk: bool
    Kriteria_Teknis_Gagal: str
    Risk_Tier: Literal['Rendah', 'Sedang', 'Tinggi']

class VendorExplaination(BaseModel):
    Supplier_ID: str
    Rank: int | None = None
    Risk_Score: float | None = None
    risk_analysis: RiskResponse | None = None
    Attributes: dict[str, Any] | None = None

class GenerativeRequest(BaseModel):
    supplier: list[VendorExplaination] = Field(min_length=1)
    question: str | None = None

class GenerativeResponse(BaseModel):
    explanation: str
    model: str