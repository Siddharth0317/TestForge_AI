from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import verify_internal_key
from app.nlp.schemas import RequirementAnalysisRequest, RequirementAnalysisResponse
from app.nlp.normalizer import NormalizationError
from app.nlp.pipeline import RequirementAnalysisPipeline

router = APIRouter(
    prefix="/internal/v1/requirements",
    tags=["Requirements Analysis"],
    dependencies=[Depends(verify_internal_key)]
)

pipeline = RequirementAnalysisPipeline()

@router.post(
    "/analyze",
    response_model=RequirementAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze requirement text deterministically using spaCy"
)
async def analyze_requirement(request: RequirementAnalysisRequest):
    """
    Analyzes raw requirement text:
    - Performs safe whitespace, unicode, and control-character normalization
    - Extracts linguistic candidates (actors, actions, entities, conditions, constraints, outcomes, negations)
    - Detects ambiguity signals (subjective terms, non-normative modals, unbounded quantifiers, missing outcomes)
    - Returns structured analysis with character-level evidence spans
    """
    try:
        return pipeline.analyze(request)
    except NormalizationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Requirement analysis processing failed: {str(e)}"
        )
