from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import verify_internal_key
from app.ml.schemas import (
    RequirementClassificationRequest,
    RequirementClassificationResponse,
)
from app.ml.classifier import RequirementClassifier
from app.nlp.normalizer import NormalizationError

router = APIRouter(
    prefix="/internal/v1/classifier",
    tags=["Requirement Classification"],
    dependencies=[Depends(verify_internal_key)]
)

classifier = RequirementClassifier()


@router.post(
    "/predict",
    response_model=RequirementClassificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict requirement category using reproducible TF-IDF + Logistic Regression model"
)
async def predict_requirement_category(request: RequirementClassificationRequest):
    """
    Inference endpoint for requirement taxonomy classification.
    Uses identical normalization pipeline as model training.
    """
    try:
        return classifier.predict(request.text, request.requirement_id)
    except NormalizationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Classification inference failed: {str(e)}"
        )

