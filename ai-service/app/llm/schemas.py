from typing import List, Dict, Any, Optional
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict, field_validator


class ScenarioType(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    BOUNDARY = "boundary"
    AUTHORIZATION = "authorization"
    ERROR_HANDLING = "error_handling"
    STATE_TRANSITION = "state_transition"


class RequirementCategory(str, Enum):
    AUTHENTICATION = "authentication"
    VALIDATION = "validation"
    BUSINESS_LOGIC = "business_logic"
    SECURITY = "security"
    ERROR_HANDLING = "error_handling"
    DATA_INTEGRITY = "data_integrity"


class ActionType(str, Enum):
    NAVIGATE = "navigate"
    CLICK = "click"
    ENTER_TEXT = "enter_text"
    SELECT_OPTION = "select_option"
    WAIT_FOR_VISIBLE = "wait_for_visible"
    ASSERT_TEXT = "assert_text"
    ASSERT_VISIBLE = "assert_visible"
    ASSERT_URL = "assert_url"


class Priority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AutomationStatus(str, Enum):
    REQUIRES_CONFIGURATION = "requires_configuration"
    EXECUTABLE = "executable"
    UNSUPPORTED = "unsupported"


class ReviewStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    NEEDS_CHANGES = "needs_changes"


class TestStep(BaseModel):
    step_number: int = Field(..., ge=1, description="1-based step order")
    action: ActionType = Field(..., description="Allowlisted browser action")
    target_ref: str = Field(..., min_length=1, max_length=100, description="Named locator reference")
    value_ref: Optional[str] = Field(default=None, max_length=500, description="Input value or expected string")

    model_config = ConfigDict(extra="ignore")


class SourceEvidence(BaseModel):
    requirement_span: str = Field(..., min_length=1, max_length=1000, description="Exact phrase from requirement")

    model_config = ConfigDict(extra="ignore")


class CandidateTestCase(BaseModel):
    schema_version: str = Field(default="1.0", description="Contract version")
    test_case_id: Optional[str] = Field(default=None, description="Client or system ID")
    requirement_id: str = Field(..., min_length=1, description="Referenced requirement ID")
    requirement_version: int = Field(default=1, ge=1, description="Referenced requirement version")
    title: str = Field(..., min_length=3, max_length=200, description="Descriptive test case title")
    category: RequirementCategory = Field(default=RequirementCategory.BUSINESS_LOGIC, description="Domain classification")
    scenario_type: ScenarioType = Field(..., description="Test scenario archetype")
    preconditions: List[str] = Field(default_factory=list, description="Prerequisite conditions")
    test_data: Dict[str, Any] = Field(default_factory=dict, description="Test data parameters without raw secrets")
    steps: List[TestStep] = Field(..., min_length=1, description="Ordered test steps")
    expected_result: str = Field(..., min_length=3, max_length=1000, description="Verifiable outcome")
    priority: Priority = Field(default=Priority.MEDIUM, description="Execution priority")
    automation_status: AutomationStatus = Field(default=AutomationStatus.REQUIRES_CONFIGURATION)
    assumptions: List[str] = Field(default_factory=list, description="Unsupported assumptions made by the model")
    source_evidence: List[SourceEvidence] = Field(default_factory=list, description="Evidence spans from requirement")
    review_status: ReviewStatus = Field(default=ReviewStatus.PENDING)

    model_config = ConfigDict(extra="ignore")


class TokenUsage(BaseModel):
    prompt_tokens: int = Field(default=0, ge=0)
    completion_tokens: int = Field(default=0, ge=0)
    total_tokens: int = Field(default=0, ge=0)


class GenerateTestCasesRequest(BaseModel):
    requirement_id: str = Field(..., min_length=1)
    requirement_version: int = Field(default=1, ge=1)
    requirement_text: str = Field(..., min_length=5, max_length=4000)
    nlp_analysis: Optional[Dict[str, Any]] = None
    ml_category: Optional[str] = None
    scenario_types: Optional[List[ScenarioType]] = None
    provider_override: Optional[str] = None
    max_cases: int = Field(default=4, ge=1, le=10)

    model_config = ConfigDict(extra="ignore")


class GenerateTestCasesResponse(BaseModel):
    job_id: str
    requirement_id: str
    requirement_version: int
    status: str = Field(..., description="Job status: completed, failed")
    provider: str
    model: str
    prompt_template_version: str
    schema_version: str = "1.0"
    candidates: List[CandidateTestCase] = Field(default_factory=list)
    token_usage: TokenUsage = Field(default_factory=TokenUsage)
    duration_ms: float = 0.0
    error_code: Optional[str] = None
    error_summary: Optional[str] = None
