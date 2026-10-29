import pytest
import spacy
from app.nlp.ambiguity import AmbiguityDetector

nlp = spacy.load("en_core_web_sm")


def test_detects_vague_subjective_terms():
    text = "The application must be user-friendly, fast, and robust."
    doc = nlp(text)
    findings = AmbiguityDetector.analyze(doc, text)
    phrases = [f.phrase.lower() for f in findings]

    assert "user-friendly" in phrases
    assert "fast" in phrases
    assert "robust" in phrases
    for f in findings:
        assert f.severity == "warning"
        assert f.start_char is not None
        assert f.end_char is not None


def test_detects_weak_modals():
    text = "The system might send an email or should display a notification."
    doc = nlp(text)
    findings = AmbiguityDetector.analyze(doc, text)
    phrases = [f.phrase.lower() for f in findings]

    assert "might" in phrases
    assert "should" in phrases


def test_detects_unbounded_quantifiers():
    text = "The admin can import several users, many groups, etc."
    doc = nlp(text)
    findings = AmbiguityDetector.analyze(doc, text)
    phrases = [f.phrase.lower() for f in findings]

    assert "several" in phrases
    assert "many" in phrases
    assert any("etc" in p for p in phrases)


def test_detects_passive_voice_without_agent():
    text = "The registration button must be clicked."
    doc = nlp(text)
    findings = AmbiguityDetector.analyze(doc, text)
    reasons = [f.reason for f in findings]

    assert any("Passive voice construction" in r for r in reasons)


def test_detects_conditional_without_expected_outcome():
    # Only conditional clause without any outcome modal or system reaction
    text = "When the user enters an invalid credit card number in the billing field,"
    doc = nlp(text)
    findings = AmbiguityDetector.analyze(doc, text)
    reasons = [f.reason for f in findings]

    assert any("lacks an explicit verifiable outcome" in r for r in reasons)


def test_clean_requirement_has_zero_or_low_ambiguity():
    text = "When the customer enters an incorrect password three consecutive times, the login form must be locked for 15 minutes and display an informative lockout message."
    doc = nlp(text)
    findings = AmbiguityDetector.analyze(doc, text)
    warnings = [f for f in findings if f.severity == "warning"]
    # No vague terms, no unbounded quantifiers, clear outcome
    assert len(warnings) == 0

