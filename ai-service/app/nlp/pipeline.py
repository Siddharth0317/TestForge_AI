from typing import Optional
from app.nlp.normalizer import RequirementNormalizer, NormalizationError
from app.nlp.extractor import LinguisticCandidateExtractor
from app.nlp.ambiguity import AmbiguityDetector
from app.nlp.schemas import (
    RequirementAnalysisRequest,
    RequirementAnalysisResponse,
)


class RequirementAnalysisPipeline:
    """
    Main deterministic requirement analysis pipeline conforming to Spec.md Section 9 and Phase 3.
    Integrates normalization, linguistic extraction (spaCy), ambiguity/quality heuristics,
    and evidence spans tracing back to original text.
    """
    VERSION = "spacy-3.8-rule-v1"

    def __init__(self, extractor: Optional[LinguisticCandidateExtractor] = None):
        self.extractor = extractor or LinguisticCandidateExtractor()

    def analyze(self, request: RequirementAnalysisRequest) -> RequirementAnalysisResponse:
        """
        Executes full analysis pipeline:
        1. Normalization & boundary validation
        2. spaCy linguistic parsing
        3. Candidate extraction (actors, actions, entities, conditions, constraints, outcomes, negations)
        4. Quality and ambiguity detection
        5. Traceable response assembly
        """
        # 1. Safe normalization and input size/format validation
        _, normalized_text = RequirementNormalizer.normalize(request.text)

        # 2. Linguistic processing with spaCy
        doc = self.extractor.process(normalized_text)

        # 3. Deterministic candidate extraction
        (
            actors,
            actions,
            entities,
            conditions,
            constraints,
            outcomes,
            negations,
            evidence_spans,
        ) = self.extractor.extract_all(doc, normalized_text)

        # 4. Ambiguity and quality checks
        ambiguity_findings = AmbiguityDetector.analyze(doc, normalized_text)

        # 5. Assemble structured result
        return RequirementAnalysisResponse(
            requirement_id=request.requirement_id,
            version=request.version or 1,
            normalized_text=normalized_text,
            actors=actors,
            actions=actions,
            entities=entities,
            conditions=conditions,
            constraints=constraints,
            outcomes=outcomes,
            explicit_negations=negations,
            ambiguity_findings=ambiguity_findings,
            evidence_spans=evidence_spans,
            processing_version=self.VERSION,
        )
