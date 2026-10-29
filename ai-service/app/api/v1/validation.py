import logging
from fastapi import APIRouter, Header, HTTPException, status
from app.core.config import settings
from app.llm.schemas import ValidateTestCasesRequest, ValidateTestCasesResponse
from app.validation.validator import TestCaseValidator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/test-cases", tags=["validation"])
validator = TestCaseValidator()


@router.post("/validate", response_model=ValidateTestCasesResponse)
async def validate_test_cases(
    payload: ValidateTestCasesRequest,
    x_internal_service_key: str = Header(None, alias="X-Internal-Service-Key")
):
    """
    Internal endpoint to perform deterministic schema, traceability, and semantic
    validation on candidate test cases.
    Requires internal service key authentication.
    """
    if not x_internal_service_key or x_internal_service_key != settings.INTERNAL_SERVICE_KEY:
        logger.warning("Unauthorized validation request: invalid or missing internal service key")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal service key"
        )

    results = validator.validate_batch(
        candidates=payload.candidate_test_cases,
        requirement_text=payload.requirement_text
    )

    return ValidateTestCasesResponse(validation_results=results)

