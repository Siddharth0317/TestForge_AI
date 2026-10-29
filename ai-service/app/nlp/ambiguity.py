import re
from typing import List, Tuple
from spacy.tokens import Doc
from app.nlp.schemas import AmbiguityFinding


class AmbiguityDetector:
    """
    Deterministic quality and ambiguity rule engine conforming to Spec.md Section 9.3 & 17.
    Surfaces subjective terms, non-binding modals, unbounded quantifiers, missing outcomes,
    and passive voice ambiguity.
    """

    VAGUE_TERMS = {
        "user-friendly": "Subjective term without measurable acceptance criteria.",
        "intuitive": "Subjective term without verifiable behavioral definition.",
        "fast": "Vague performance descriptor; replace with concrete latency limit (e.g., '< 200ms').",
        "quick": "Vague performance descriptor; replace with concrete latency requirement.",
        "responsive": "Ambiguous performance/design descriptor; specify concrete viewport or timing bounds.",
        "seamless": "Vague qualitative descriptor with no testable assertion.",
        "robust": "Vague resilience claim; specify exact failure conditions and recovery behaviors.",
        "flexible": "Unverifiable architecture claim without concrete functional parameters.",
        "efficient": "Subjective efficiency claim; specify CPU, memory, or throughput benchmarks.",
        "appropriate": "Ambiguous qualification; specify exact validation or error handling rules.",
        "adequate": "Ambiguous qualification; specify concrete sufficiency criteria.",
        "good": "Subjective rating; specify verifiable requirements.",
        "properly": "Vague behavior descriptor; specify exact functional state changes.",
        "correctly": "Vague correctness descriptor; specify exact expected outputs.",
        "as soon as possible": "Non-deterministic timing; specify exact SLA or timeout threshold.",
        "asap": "Non-deterministic timing; specify exact SLA or timeout threshold.",
        "instantly": "Physically impossible software claim; specify realistic timeout limit.",
        "promptly": "Non-deterministic timing; specify maximum allowable elapsed time.",
    }

    UNBOUNDED_QUANTIFIERS = {
        "etc": "Incomplete enumeration ('etc') leaves boundary conditions unspecified.",
        "etc.": "Incomplete enumeration ('etc.') leaves boundary conditions unspecified.",
        "and so on": "Incomplete enumeration leaves boundary conditions open-ended.",
        "some": "Unbounded quantifier ('some') does not define minimum or maximum set size.",
        "several": "Unbounded quantifier ('several') does not define discrete test partition.",
        "many": "Unbounded quantifier ('many') lacks concrete bounds for boundary analysis.",
        "few": "Unbounded quantifier ('few') lacks concrete bounds for boundary analysis.",
        "various": "Vague enumeration ('various') prevents deterministic test fixture creation.",
        "all necessary": "Ambiguous completeness claim ('all necessary') without enumeration.",
        "all appropriate": "Ambiguous completeness claim ('all appropriate') without enumeration.",
    }

    WEAK_MODALS = {
        "might": "Weak modal ('might') creates non-deterministic requirement; use 'must' or 'shall'.",
        "could": "Weak modal ('could') creates optional requirement; use 'must' or 'shall'.",
        "may": "Permissive modal ('may') denotes optional behavior rather than mandatory acceptance test.",
        "should": "Recommendation modal ('should') is non-normative; prefer 'must' or 'shall' for testable criteria.",
    }

    OUTCOME_VERBS = {
        "display", "displays", "show", "shows", "present", "presents", "render", "renders",
        "lock", "locks", "block", "blocks", "disable", "disables", "enable", "enables",
        "redirect", "redirects", "navigate", "navigates", "reject", "rejects", "fail", "fails",
        "pass", "passes", "return", "returns", "respond", "responds", "send", "sends",
        "save", "saves", "persist", "persists", "notify", "notifies", "alert", "alerts"
    }

    @classmethod
    def analyze(cls, doc: Doc, normalized_text: str) -> List[AmbiguityFinding]:
        """
        Runs rule-based ambiguity scans against a spaCy Doc and its source text.
        """
        findings: List[AmbiguityFinding] = []
        text_lower = normalized_text.lower()

        # 1. Check for vague / subjective terms
        for term, reason in cls.VAGUE_TERMS.items():
            pattern = rf"\b{re.escape(term)}\b"
            for match in re.finditer(pattern, text_lower):
                findings.append(
                    AmbiguityFinding(
                        phrase=normalized_text[match.start():match.end()],
                        reason=reason,
                        severity="warning",
                        start_char=match.start(),
                        end_char=match.end(),
                    )
                )

        # 2. Check for unbounded quantifiers
        for term, reason in cls.UNBOUNDED_QUANTIFIERS.items():
            pattern = rf"\b{re.escape(term)}" if term.endswith(".") else rf"\b{re.escape(term)}\b"
            for match in re.finditer(pattern, text_lower):
                findings.append(
                    AmbiguityFinding(
                        phrase=normalized_text[match.start():match.end()],
                        reason=reason,
                        severity="warning",
                        start_char=match.start(),
                        end_char=match.end(),
                    )
                )

        # 3. Check for weak modals using spaCy tokens
        for token in doc:
            token_lower = token.text.lower()
            if token_lower in cls.WEAK_MODALS and token.pos_ in ("AUX", "VERB"):
                findings.append(
                    AmbiguityFinding(
                        phrase=token.text,
                        reason=cls.WEAK_MODALS[token_lower],
                        severity="info" if token_lower == "should" else "warning",
                        start_char=token.idx,
                        end_char=token.idx + len(token.text),
                    )
                )

        # 4. Check for passive voice without explicit agent
        for token in doc:
            if token.dep_ == "nsubjpass":
                # Check if there is an explicit agent (e.g. "by the user") attached to the head verb
                has_agent = any(child.dep_ == "agent" for child in token.head.children)
                if not has_agent:
                    span_text = f"{token.text} {token.head.text}"
                    findings.append(
                        AmbiguityFinding(
                            phrase=span_text,
                            reason="Passive voice construction omits the initiating actor or responsible party.",
                            severity="info",
                            start_char=token.idx,
                            end_char=token.head.idx + len(token.head.text),
                        )
                    )

        # 5. Check for conditional trigger without clear expected outcome
        has_conditional_trigger = bool(
            re.search(r"^\s*(?:if|when|whenever|given|in\s+case|unless)\b", normalized_text, re.IGNORECASE)
        ) or any(
            token.text.lower() in ("if", "when", "whenever", "given", "in case", "unless")
            and (token.pos_ in ("SCONJ", "ADV", "ADP") or token.dep_ in ("mark", "advmod"))
            for token in doc
        )

        has_outcome_modal = any(
            token.text.lower() in ("must", "shall", "will") and token.pos_ in ("AUX", "VERB")
            for token in doc
        )
        has_outcome_verb = any(
            token.text.lower() in cls.OUTCOME_VERBS and token.dep_ in ("ROOT", "conj") and token.dep_ != "advcl"
            for token in doc
        )

        if has_conditional_trigger and not (has_outcome_modal or has_outcome_verb):
            findings.append(
                AmbiguityFinding(
                    phrase=normalized_text[:min(len(normalized_text), 40)] + "...",
                    reason="Requirement contains conditional trigger ('if'/'when'/'given') but lacks an explicit verifiable outcome or system action.",
                    severity="warning",
                    start_char=0,
                    end_char=len(normalized_text),
                )
            )

        return findings
