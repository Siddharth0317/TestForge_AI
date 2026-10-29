import json
from pathlib import Path
from typing import Dict, Any, Optional
import joblib

from app.nlp.normalizer import RequirementNormalizer
from app.ml.schemas import RequirementClassificationResponse

CURRENT_DIR = Path(__file__).resolve().parent
ARTIFACTS_DIR = CURRENT_DIR / "artifacts"


class RequirementClassifier:
    """
    Deterministic inference service for requirement taxonomy classification.
    Conforms to Spec.md Section 9.4 and Phase 4.
    """
    UNCERTAINTY_THRESHOLD = 0.20  # Mark uncertain if top class confidence is below 20% (barely above uniform random 16.7%)

    def __init__(self, artifacts_dir: Path = None):
        self.artifacts_dir = artifacts_dir or ARTIFACTS_DIR
        self.model = None
        self.metadata: Dict[str, Any] = {}
        self.version = "v1.0.0-baseline"
        self._load_model()

    def _load_model(self):
        """Loads trained model pipeline and metadata if available."""
        model_path = self.artifacts_dir / "model.joblib"
        metadata_path = self.artifacts_dir / "model_metadata.json"

        if model_path.exists() and metadata_path.exists():
            try:
                self.model = joblib.load(model_path)
                with open(metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                self.version = self.metadata.get("version", "v1.0.0-baseline")
            except Exception as e:
                self.model = None
                self.version = "unassessed-load-failed"
        else:
            self.model = None
            self.version = "unassessed-no-artifact"

    def predict(
        self,
        raw_text: str,
        requirement_id: Optional[str] = None
    ) -> RequirementClassificationResponse:
        """
        Classifies input requirement text into one of the taxonomy categories.
        Uses identical text normalization as the training pipeline to prevent distribution drift.
        """
        # Normalize text using standard pipeline normalizer
        _, normalized_text = RequirementNormalizer.normalize(raw_text)

        # Fallback if model artifact is not loaded
        if self.model is None:
            return RequirementClassificationResponse(
                category="general_requirement",
                confidence=0.0,
                model_version=self.version,
                is_uncertain=True,
                probabilities={},
                requirement_id=requirement_id
            )

        # Compute class probabilities
        probas = self.model.predict_proba([normalized_text])[0]
        classes = self.model.classes_

        class_probabilities = {
            cls_name: float(round(prob, 4))
            for cls_name, prob in zip(classes, probas)
        }

        # Identify top predicted class and confidence
        sorted_classes = sorted(class_probabilities.items(), key=lambda x: x[1], reverse=True)
        top_category, top_confidence = sorted_classes[0]

        # Determine uncertainty: low confidence or ambiguous margin between top 2 classes
        is_uncertain = False
        if top_confidence < self.UNCERTAINTY_THRESHOLD:
            is_uncertain = True
        elif len(sorted_classes) > 1:
            margin = top_confidence - sorted_classes[1][1]
            if margin < 0.05:  # Margin less than 5% between top 2 classes
                is_uncertain = True

        return RequirementClassificationResponse(
            category=top_category,
            confidence=top_confidence,
            model_version=self.version,
            is_uncertain=is_uncertain,
            probabilities=class_probabilities,
            requirement_id=requirement_id
        )
