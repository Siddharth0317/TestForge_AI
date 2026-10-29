from typing import Dict, Optional
from pydantic import BaseModel, Field


class RequirementClassificationRequest(BaseModel):
    text: str = Field(..., min_length=5, max_length=4000, description="Requirement text to classify")
    requirement_id: Optional[str] = Field(None, description="Optional traceability identifier")


class RequirementClassificationResponse(BaseModel):
    category: str = Field(..., description="Predicted requirement taxonomy category")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Prediction confidence score")
    model_version: str = Field(..., description="Model artifact and version identifier")
    is_uncertain: bool = Field(False, description="Flag indicating uncertainty if confidence is below threshold")
    probabilities: Dict[str, float] = Field(default_factory=dict, description="Class-wise probability distribution")
    requirement_id: Optional[str] = Field(None, description="Traceability requirement ID if supplied")
