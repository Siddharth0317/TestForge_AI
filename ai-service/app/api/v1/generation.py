import logging
from fastapi import APIRouter, Header, HTTPException, status
from app.core.config import settings
from app.llm.schemas import GenerateTestCasesRequest, GenerateTestCasesResponse
from app.llm.generator import TestCaseGenerator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/test-cases", tags=["generation"])
generator = TestCaseGenerator()


@router.post("/generate", response_model=GenerateTestCasesResponse)
async def generate_test_cases(
    payload: GenerateTestCasesRequest,
    x_internal_service_key: str = Header(None, alias="X-Internal-Service-Key")
):
    """
    Internal endpoint to generate structured candidate test cases for a requirement.
    Requires internal service key authentication.
    """
    if not x_internal_service_key or x_internal_service_key != settings.INTERNAL_SERVICE_KEY:
        logger.warning("Unauthorized generation request: invalid or missing internal service key")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal service key"
        )

    response = await generator.generate_test_cases(payload)
    return response
