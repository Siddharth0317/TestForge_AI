import pytest
from app.nlp.extractor import LinguisticCandidateExtractor

extractor = LinguisticCandidateExtractor()


def test_extract_actors_and_actions():
    text = "The customer enters an invalid password and clicks submit."
    doc = extractor.process(text)
    (
        actors,
        actions,
        entities,
        conditions,
        constraints,
        outcomes,
        negations,
        evidence_spans,
    ) = extractor.extract_all(doc, text)

    assert "customer" in [a.lower() for a in actors]
    action_lemmas = [a.lower() for a in actions]
    assert "enter" in action_lemmas or "enters" in action_lemmas
    assert "click" in action_lemmas or "clicks" in action_lemmas


def test_extract_compound_actors():
    text = "The system admin user must review all security audit reports."
    doc = extractor.process(text)
    actors, _, _, _, _, _, _, _ = extractor.extract_all(doc, text)
    actor_lower = [a.lower() for a in actors]
    assert any("admin" in a or "user" in a for a in actor_lower)


def test_extract_conditions_and_constraints():
    text = "When a customer enters an incorrect password three consecutive times, the login form must be locked for 15 minutes."
    doc = extractor.process(text)
    (
        actors,
        actions,
        entities,
        conditions,
        constraints,
        outcomes,
        negations,
        evidence_spans,
    ) = extractor.extract_all(doc, text)

    # Condition extracted from 'When ...'
    assert len(conditions) > 0
    assert any("enters" in c or "incorrect password" in c for c in conditions)

    # Constraints: quantitative / temporal bounds
    assert any("15 minutes" in c for c in constraints)
    assert any("consecutive" in c for c in constraints)


def test_extract_expected_outcomes():
    text = "When payment fails, the system must display an error banner and redirect to checkout."
    doc = extractor.process(text)
    (
        actors,
        actions,
        entities,
        conditions,
        constraints,
        outcomes,
        negations,
        evidence_spans,
    ) = extractor.extract_all(doc, text)

    assert len(outcomes) > 0
    outcome_text = " ".join(outcomes).lower()
    assert "display" in outcome_text or "redirect" in outcome_text or "error banner" in outcome_text


def test_extract_explicit_negations():
    text = "The user must not share passwords and should never use expired tokens."
    doc = extractor.process(text)
    (
        actors,
        actions,
        entities,
        conditions,
        constraints,
        outcomes,
        negations,
        evidence_spans,
    ) = extractor.extract_all(doc, text)

    assert len(negations) > 0
    neg_lower = [n.lower() for n in negations]
    assert any("not" in n for n in neg_lower)
    assert any("never" in n for n in neg_lower)


def test_evidence_spans_align_with_text():
    text = "The user enters a valid email address."
    doc = extractor.process(text)
    _, _, _, _, _, _, _, evidence_spans = extractor.extract_all(doc, text)

    assert len(evidence_spans) > 0
    for span in evidence_spans:
        # Span indices must map cleanly to text slice
        assert 0 <= span.start_char < len(text)
        assert span.start_char < span.end_char <= len(text)
        assert span.text.lower() in text.lower()
        assert 0.0 <= span.confidence <= 1.0
