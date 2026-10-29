import pytest
from app.ml.classifier import RequirementClassifier
from app.nlp.normalizer import NormalizationError

classifier = RequirementClassifier()


def test_classifier_loads_metadata():
    assert classifier.model is not None
    assert classifier.version == "v1.0.0-baseline"
    assert "test_metrics" in classifier.metadata
    assert classifier.metadata["test_metrics"]["accuracy"] > 0.70


def test_classify_authentication():
    text = "When a customer enters an incorrect password three consecutive times, the login form must be locked."
    res = classifier.predict(text)
    assert res.category == "authentication"
    assert res.confidence > 0.40
    assert not res.is_uncertain
    assert "authentication" in res.probabilities


def test_classify_validation():
    text = "The password field must require at least 8 characters, one digit, and one special symbol."
    res = classifier.predict(text)
    assert res.category == "validation"
    assert res.confidence > 0.40
    assert not res.is_uncertain


def test_classify_business_logic():
    text = "When an order total exceeds $100, the system must apply free standard shipping at checkout."
    res = classifier.predict(text)
    assert res.category == "business_logic"
    assert res.confidence > 0.20


def test_classify_security():
    text = "Only users with the admin role can delete accounts or modify security permissions."
    res = classifier.predict(text)
    assert res.category == "security"
    assert res.confidence > 0.20


def test_classify_error_handling():
    text = "When the payment gateway is unreachable, the checkout must display a retry banner."
    res = classifier.predict(text)
    assert res.category == "error_handling"
    assert res.confidence > 0.20


def test_classify_data_integrity():
    text = "Database write transactions for multi-step order checkout must roll back completely if payment fails."
    res = classifier.predict(text)
    assert res.category == "data_integrity"
    assert res.confidence > 0.20


def test_probability_distribution_sums_to_one():
    text = "User sessions must expire after 30 minutes of inactivity."
    res = classifier.predict(text)
    probs = res.probabilities.values()
    assert len(probs) == 6
    assert abs(sum(probs) - 1.0) < 0.05


def test_uncertainty_flag_on_vague_text():
    # Ambiguous or non-domain text should have lower confidence or close margin
    text = "The button colors should be nice and clean."
    res = classifier.predict(text)
    # The confidence should be lower or flagged as uncertain
    assert res.confidence < 0.60 or res.is_uncertain


def test_classifier_rejects_too_short():
    with pytest.raises(NormalizationError):
        classifier.predict("bad")
