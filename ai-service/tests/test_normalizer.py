import pytest
from app.nlp.normalizer import RequirementNormalizer, NormalizationError


def test_normalizer_standard_text():
    raw = "  The user   must enter a   valid password.  "
    orig, norm = RequirementNormalizer.normalize(raw)
    assert orig == raw
    assert norm == "The user must enter a valid password."


def test_normalizer_multiline_and_tabs():
    raw = "Line 1.\n\n\t  Line 2 with \t tabs.\r\n   Line 3."
    orig, norm = RequirementNormalizer.normalize(raw)
    assert norm == "Line 1. Line 2 with tabs. Line 3."


def test_normalizer_preserves_punctuation_and_negation():
    raw = "User must NOT enter credentials with <special> characters, e.g. 'admin' or \"root\"!"
    _, norm = RequirementNormalizer.normalize(raw)
    assert "NOT" in norm
    assert "<special>" in norm
    assert "'admin'" in norm
    assert "\"root\"!" in norm


def test_normalizer_unicode_nfc():
    # Combining characters normalized to single canonical code points
    raw = "Cafe\u0301 requirement text for user authentication."
    _, norm = RequirementNormalizer.normalize(raw)
    assert "Café" in norm


def test_normalizer_strips_control_characters():
    # Null byte and bell character should be stripped
    raw = "The system\x00 must log\x07 every security attempt."
    _, norm = RequirementNormalizer.normalize(raw)
    assert "\x00" not in norm
    assert "\x07" not in norm
    assert norm == "The system must log every security attempt."


def test_normalizer_rejects_too_short():
    with pytest.raises(NormalizationError, match="at least 5 characters"):
        RequirementNormalizer.normalize("Hi")


def test_normalizer_rejects_whitespace_only():
    with pytest.raises(NormalizationError, match="at least 5 characters"):
        RequirementNormalizer.normalize("     \n\t   ")


def test_normalizer_rejects_too_long():
    oversized = "a" * 4001
    with pytest.raises(NormalizationError, match="maximum allowed length"):
        RequirementNormalizer.normalize(oversized)


def test_normalizer_rejects_non_string():
    with pytest.raises(NormalizationError, match="must be a string"):
        RequirementNormalizer.normalize(12345)  # type: ignore
