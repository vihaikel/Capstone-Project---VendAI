from pydantic import BaseModel, Field, ConfigDict
from typing import Literal, Any

# Request frontend
class RiskRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)

    Supplier_ID: str | None = None
    Financial_Stability_Score: float | None = Field(default=None, ge=0, le=100)
    On_Time_Delivery_Rate: float | None = Field(default=None, ge=0, le=100)
    Defect_Rate: float | None = Field(default=None, ge=0, le=10)
    Lead_Time_Days: float | None = Field(default=None, ge=1)
    Alternative_Suppliers_Available: float | None = Field(default=None, ge=0, le=10)
    Contract_Length_Months: int | None = Field(default=None, ge=0)
    Environmental_Compliance: int | None = Field(default=None, ge=0, le=100)
    Previous_Disruptions: float | None = Field(default=None, ge=0, le=10)

class RiskResponse(BaseModel):
    Supplier_ID: str | None = None
    Risk_Score: float
    Operasional_Buruk: bool
    Teknis_Buruk: bool
    Kriteria_Teknis_Gagal: str | None = None
    Risk_Tier: Literal['Rendah', 'Sedang', 'Tinggi']

class ProcurementRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, allow_inf_nan=False)
    main_category: str = Field(min_length=1)
    sub_category: str = Field(min_length=1)
    quantity: float = Field(gt=0)
    budget: float = Field(gt=0)
    deadline_days: int | None = Field(default=None, gt=3)

class VendorExplaination(BaseModel):
    Rank: int
    Supplier_ID: str

    Vendor_Type: str | None = None
    Main_Category: str | None = None
    Sub_Category: str | None = None
    Item_Description: str | None = None
    Unit: str | None = None

    Unit_Price_IDR: float | None = None
    MOQ: float | None = None
    Total_Price: float | None = None

    Capacity_Per_Week: float | None = None
    Capacity_Per_Month: float | None = None
    Lead_Time_Days: float | None = None

    Risk_Score: float | None = None
    Operasional_Buruk: bool | None = None
    Teknis_Buruk: bool | None = None
    Kriteria_Teknis_Gagal: str | None = None
    Risk_Tier: Literal["Rendah", "Sedang", "Tinggi"] | None = None

    Score: float | None = None

class GenerativeRequest(BaseModel):
    procurement_request: ProcurementRequest
    supplier: list[VendorExplaination] = Field(min_length=1)
    question: str | None = None

class GenerativeResponse(BaseModel):
    explanation: str
    model: str

class RecommendationRequest(ProcurementRequest):
    vendor_type: str | None = None
    top_k: int = Field(default=5, ge=1, le=10)

class RecommendationResponse(BaseModel):
    total: int
    suppliers: list[VendorExplaination]

class ProcurementFlowRequest(RecommendationRequest):
    question: str | None = None

class ProcurementFlowResponse(BaseModel):
    total: int
    suppliers: list[VendorExplaination]
    explanation: str | None = None
    model: str | None = None
    explanation_status: Literal[
        "success",
        "unavailable",
        "failed",
        "no_recommendations"
    ]