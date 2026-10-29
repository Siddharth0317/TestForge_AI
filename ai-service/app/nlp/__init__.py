"""
NLP Requirement Analysis module for TestForge AI.
Provides deterministic text normalization, linguistic candidate extraction,
and ambiguity detection.
"""
from app.nlp.schemas import (
    AmbiguityFinding,
    EvidenceSpan,
    NLPAnalysisResult,
    RequirementAnalysisRequest,
    RequirementAnalysisResponse,
)
from app.nlp.normalizer import RequirementNormalizer, NormalizationError
from app.nlp.extractor import LinguisticCandidateExtractor
from app.nlp.ambiguity import AmbiguityDetector
from app.nlp.pipeline import RequirementAnalysisPipeline

__all__ = [
    "AmbiguityFinding",
    "EvidenceSpan",
    "NLPAnalysisResult",
    "RequirementAnalysisRequest",
    "RequirementAnalysisResponse",
    "RequirementNormalizer",
    "NormalizationError",
    "LinguisticCandidateExtractor",
    "AmbiguityDetector",
    "RequirementAnalysisPipeline",
]

