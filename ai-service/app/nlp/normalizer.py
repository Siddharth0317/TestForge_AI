import re
import unicodedata
from typing import Tuple


class NormalizationError(ValueError):
    """Raised when requirement text fails size or type validation."""
    pass


class RequirementNormalizer:
    """
    Deterministic requirement text normalizer conforming to Spec.md Section 9.2.
    Preserves all domain tokens, punctuation, negation, and identifiers while
    sanitizing whitespace, control characters, and Unicode variations.
    """
    VERSION = "norm-v1.0.0"
    MIN_LENGTH = 5
    MAX_LENGTH = 4000

    @classmethod
    def normalize(cls, raw_text: str) -> Tuple[str, str]:
        """
        Validates and normalizes raw requirement text.
        Returns a tuple of (original_text, normalized_text).
        Raises NormalizationError if input is invalid or out of bounds.
        """
        if not isinstance(raw_text, str):
            raise NormalizationError("Requirement text must be a string.")

        original_text = raw_text

        # 1. Unicode normalization (NFC ensures consistent character representations)
        normalized = unicodedata.normalize("NFC", raw_text)

        # 2. Remove non-printable control characters (except standard newline, carriage return, tab)
        normalized = "".join(
            ch for ch in normalized
            if ch in ("\n", "\r", "\t") or (unicodedata.category(ch)[0] != "C")
        )

        # 3. Collapse excessive horizontal whitespace and replace tabs/carriage returns with space
        normalized = re.sub(r"[\t\r]+", " ", normalized)
        # Collapse multiple spaces into one, preserving single newline breaks where semantic
        lines = [re.sub(r"[ ]{2,}", " ", line).strip() for line in normalized.split("\n")]
        # Remove empty lines and rejoin with single space or newline
        normalized = " ".join(line for line in lines if line)

        # 4. Final boundary validation
        if len(normalized) < cls.MIN_LENGTH:
            raise NormalizationError(
                f"Requirement text must contain at least {cls.MIN_LENGTH} characters of meaningful content."
            )
        if len(normalized) > cls.MAX_LENGTH:
            raise NormalizationError(
                f"Requirement text exceeds maximum allowed length of {cls.MAX_LENGTH} characters."
            )

        return original_text, normalized
