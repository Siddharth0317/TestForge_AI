from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class AmbiguityFinding(BaseModel):
    phrase: str = Field(..., description="The ambiguous or vague phrase detected")
    reason: str = Field(..., description="Explanation of why this term or pattern is ambiguous")
    severity: Literal["warning", "info"] = Field("warning", description="Severity of the ambiguity finding")
    start_char: Optional[int] = Field(None, description="Starting character index in normalized text")
    end_char: Optional[int] = Field(None, description="Ending character index in normalized text")


class EvidenceSpan(BaseModel):
    category: Literal["actor", "action", "entity", "condition", "constraint", "outcome", "negation"]
    text: str = Field(..., description="Extracted textual span")
    start_char: int = Field(..., description="Starting character index in normalized text")
    end_char: int = Field(..., description="Ending character index in normalized text")
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Heuristic confidence score")


class NLPAnalysisResult(BaseModel):
    normalized_text: str = Field(..., description="Safe normalized requirement text")
    actors: List[str] = Field(default_factory=list, description="Extracted actors and subjects")
    actions: List[str] = Field(default_factory=list, description="Extracted actionable verbs")
    entities: List[str] = Field(default_factory=list, description="Extracted domain entities and objects")
    conditions: List[str] = Field(default_factory=list, description="Extracted trigger conditions and pre-conditions")
    constraints: List[str] = Field(default_factory=list, description="Extracted constraints, limits, and bounds")
    outcomes: List[str] = Field(default_factory=list, description="Extracted expected system outcomes")
    explicit_negations: List[str] = Field(default_factory=list, description="Explicit negation markers found in requirement")
    ambiguity_findings: List[AmbiguityFinding] = Field(default_factory=list, description="Ambiguity and quality warnings")
    evidence_spans: List[EvidenceSpan] = Field(default_factory=list, description="Traceable provenance spans")
    processing_version: str = Field("spacy-3.8-rule-v1", description="NLP pipeline and rule-set version")


class RequirementAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=5, max_length=4000, description="Raw requirement text to analyze")
    requirement_id: Optional[str] = Field(None, description="Optional traceability identifier")
    version: Optional[int] = Field(1, ge=1, description="Requirement version number")


class RequirementAnalysisResponse(NLPAnalysisResult):
    requirement_id: Optional[str] = Field(None, description="Requirement identifier if provided")
    version: int = Field(1, ge=1, description="Requirement version")
