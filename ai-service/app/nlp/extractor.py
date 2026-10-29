import re
from typing import List, Tuple, Set, Optional
import spacy
from spacy.tokens import Doc, Span, Token
from app.nlp.schemas import EvidenceSpan


class LinguisticCandidateExtractor:
    """
    Deterministic candidate entity extractor conforming to Spec.md Section 9.3 & 17.
    Extracts actors, actions, entities, conditions, constraints, explicit negations,
    and expected outcomes using dependency parses, part-of-speech tags, and rule patterns.
    """

    # Common domain stop-words or generic pronouns to exclude from actor classification
    EXCLUDED_ACTORS = {"it", "this", "that", "there", "which", "what", "who", "they", "them", "these", "those"}

    # Common UI and software testing action verbs
    COMMON_UI_ACTIONS = {
        "click": "click",
        "clicks": "click",
        "clicked": "click",
        "clicking": "click",
        "enter": "enter",
        "enters": "enter",
        "entered": "enter",
        "entering": "enter",
        "type": "type",
        "types": "type",
        "typed": "type",
        "typing": "type",
        "select": "select",
        "selects": "select",
        "selected": "select",
        "selecting": "select",
        "submit": "submit",
        "submits": "submit",
        "submitted": "submit",
        "submitting": "submit",
        "press": "press",
        "presses": "press",
        "pressed": "press",
        "navigate": "navigate",
        "navigates": "navigate",
        "navigated": "navigate",
        "choose": "choose",
        "chooses": "choose",
        "check": "check",
        "checks": "check",
        "uncheck": "uncheck",
        "unchecks": "uncheck",
        "hover": "hover",
        "hovers": "hover",
        "scroll": "scroll",
        "scrolls": "scroll",
        "tap": "tap",
        "taps": "tap",
        "drag": "drag",
        "drags": "drag",
        "drop": "drop",
        "drops": "drop",
        "upload": "upload",
        "uploads": "upload",
        "download": "download",
        "downloads": "download",
        "verify": "verify",
        "verifies": "verify",
        "assert": "assert",
        "asserts": "assert",
        "display": "display",
        "displays": "display",
        "lock": "lock",
        "locks": "lock",
        "redirect": "redirect",
        "redirects": "redirect",
        "reject": "reject",
        "rejects": "reject"
    }

    NUM_WORDS = r"(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)"

    # Constraint patterns matching quantitative and temporal boundaries
    CONSTRAINT_PATTERNS = [
        rf"\b(?:at least|at most|no more than|no less than|up to|maximum(?: of)?|minimum(?: of)?|between)\s+(?:\d+|{NUM_WORDS})(?:\.\d+)?(?:\s+[a-zA-Z%]+)?\b",
        rf"\b{NUM_WORDS}\s+(?:seconds?|minutes?|hours?|days?|times?|attempts?|characters?|chars?|items?|records?|bytes?|kb|mb|gb|percent|%)\b",
        rf"\b(?:within|in)\s+{NUM_WORDS}\s+(?:seconds?|minutes?|hours?|days?)\b",
        rf"\b{NUM_WORDS}\s+consecutive\s+[a-zA-Z]+\b",
        r"\b(?:non-empty|alphanumeric|numeric|case-sensitive|unique)\b",
    ]

    # Outcome indicators
    OUTCOME_MODALS = {"must", "shall", "will", "should", "ought"}
    OUTCOME_VERBS = {
        "display", "show", "present", "render", "lock", "block", "disable", "enable",
        "redirect", "navigate", "reject", "fail", "pass", "return", "respond", "send",
        "save", "persist", "update", "notify", "alert", "log"
    }

    # Condition trigger words
    CONDITION_TRIGGERS = {"if", "when", "whenever", "given", "after", "before", "unless", "in case", "once", "provided"}

    def __init__(self, nlp_model=None):
        if nlp_model:
            self.nlp = nlp_model
        else:
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except Exception:
                try:
                    self.nlp = spacy.load("en_core_web_md")
                except Exception:
                    self.nlp = spacy.blank("en")
                    if "sentencizer" not in self.nlp.pipe_names:
                        self.nlp.add_pipe("sentencizer")

    def process(self, text: str) -> Doc:
        return self.nlp(text)

    def extract_all(self, doc: Doc, text: str) -> Tuple[
        List[str], List[str], List[str], List[str], List[str], List[str], List[str], List[EvidenceSpan]
    ]:
        evidence_spans: List[EvidenceSpan] = []

        actors = self._extract_actors(doc, evidence_spans)
        actions = self._extract_actions(doc, evidence_spans)
        entities = self._extract_entities(doc, evidence_spans)
        conditions = self._extract_conditions(doc, text, evidence_spans)
        constraints = self._extract_constraints(text, evidence_spans)
        outcomes = self._extract_outcomes(doc, evidence_spans)
        negations = self._extract_negations(doc, evidence_spans)

        return (
            actors,
            actions,
            entities,
            conditions,
            constraints,
            outcomes,
            negations,
            evidence_spans,
        )

    def _extract_actors(self, doc: Doc, evidence: List[EvidenceSpan]) -> List[str]:
        actors: Set[str] = set()

        for token in doc:
            if token.dep_ in ("nsubj", "nsubjpass"):
                compound_tokens = [child.text for child in token.children if child.dep_ == "compound"]
                compound_tokens.append(token.text)
                actor_text = " ".join(compound_tokens).strip()

                if actor_text.lower() not in self.EXCLUDED_ACTORS and len(actor_text) > 1:
                    actors.add(actor_text)
                    evidence.append(
                        EvidenceSpan(
                            category="actor",
                            text=actor_text,
                            start_char=token.left_edge.idx,
                            end_char=token.right_edge.idx + len(token.right_edge.text),
                            confidence=0.9 if token.dep_ == "nsubj" else 0.75,
                        )
                    )

        if not actors and hasattr(doc, "noun_chunks"):
            for chunk in doc.noun_chunks:
                text_lower = chunk.text.lower()
                if any(role in text_lower for role in ("user", "customer", "admin", "guest", "client", "system", "caller")):
                    actors.add(chunk.text.strip())
                    evidence.append(
                        EvidenceSpan(
                            category="actor",
                            text=chunk.text.strip(),
                            start_char=chunk.start_char,
                            end_char=chunk.end_char,
                            confidence=0.7,
                        )
                    )

        return sorted(list(actors))

    def _extract_actions(self, doc: Doc, evidence: List[EvidenceSpan]) -> List[str]:
        actions: Set[str] = set()

        for token in doc:
            token_lower = token.text.lower()
            token_lemma = token.lemma_.lower()

            # Direct verb POS
            if token.pos_ == "VERB" and token_lemma not in ("be", "have", "do", "get"):
                action_text = token_lemma
                actions.add(action_text)
                evidence.append(
                    EvidenceSpan(
                        category="action",
                        text=token.text,
                        start_char=token.idx,
                        end_char=token.idx + len(token.text),
                        confidence=0.85,
                    )
                )
            # Known domain action verbs even if mis-tagged as NOUN in coordination
            elif token_lower in self.COMMON_UI_ACTIONS:
                canonical = self.COMMON_UI_ACTIONS[token_lower]
                actions.add(canonical)
                evidence.append(
                    EvidenceSpan(
                        category="action",
                        text=token.text,
                        start_char=token.idx,
                        end_char=token.idx + len(token.text),
                        confidence=0.8,
                    )
                )

        return sorted(list(actions))

    def _extract_entities(self, doc: Doc, evidence: List[EvidenceSpan]) -> List[str]:
        entities: Set[str] = set()

        for token in doc:
            if token.dep_ in ("dobj", "pobj", "obj"):
                left_idx = token.idx
                right_idx = token.idx + len(token.text)
                phrase_tokens = []
                for child in token.children:
                    if child.dep_ in ("compound", "amod"):
                        phrase_tokens.append(child.text)
                        if child.idx < left_idx:
                            left_idx = child.idx
                phrase_tokens.append(token.text)
                entity_text = " ".join(phrase_tokens).strip()

                if len(entity_text) > 1 and entity_text.lower() not in self.EXCLUDED_ACTORS:
                    entities.add(entity_text)
                    evidence.append(
                        EvidenceSpan(
                            category="entity",
                            text=entity_text,
                            start_char=left_idx,
                            end_char=right_idx,
                            confidence=0.85,
                        )
                    )

        return sorted(list(entities))

    def _extract_conditions(self, doc: Doc, text: str, evidence: List[EvidenceSpan]) -> List[str]:
        conditions: List[str] = []

        # Strategy 1: Find tokens matching CONDITION_TRIGGERS (e.g. When, If, Whenever)
        for token in doc:
            if token.text.lower() in self.CONDITION_TRIGGERS:
                head = token.head
                start_char = token.idx
                # Span goes to end of head verb's clause
                end_char = head.right_edge.idx + len(head.right_edge.text)
                condition_text = text[start_char:end_char].strip().rstrip(",").rstrip(".")

                if len(condition_text) > 3 and condition_text not in conditions:
                    conditions.append(condition_text)
                    evidence.append(
                        EvidenceSpan(
                            category="condition",
                            text=condition_text,
                            start_char=start_char,
                            end_char=end_char,
                            confidence=0.9,
                        )
                    )

        # Strategy 2: Adverbial clauses (advcl)
        for token in doc:
            if token.dep_ == "advcl":
                start_char = token.left_edge.idx
                end_char = token.right_edge.idx + len(token.right_edge.text)
                condition_text = text[start_char:end_char].strip().rstrip(",").rstrip(".")
                if len(condition_text) > 3 and condition_text not in conditions:
                    conditions.append(condition_text)
                    evidence.append(
                        EvidenceSpan(
                            category="condition",
                            text=condition_text,
                            start_char=start_char,
                            end_char=end_char,
                            confidence=0.85,
                        )
                    )

        return conditions

    def _extract_constraints(self, text: str, evidence: List[EvidenceSpan]) -> List[str]:
        constraints: Set[str] = set()

        for pattern in self.CONSTRAINT_PATTERNS:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                span_text = match.group().strip()
                constraints.add(span_text)
                evidence.append(
                    EvidenceSpan(
                        category="constraint",
                        text=span_text,
                        start_char=match.start(),
                        end_char=match.end(),
                        confidence=0.95,
                    )
                )

        return sorted(list(constraints))

    def _extract_outcomes(self, doc: Doc, evidence: List[EvidenceSpan]) -> List[str]:
        outcomes: List[str] = []

        for token in doc:
            # Case 1: Modal verb attached to action verb (e.g. "must be locked", "shall display")
            if token.text.lower() in self.OUTCOME_MODALS and token.pos_ in ("AUX", "VERB"):
                head = token.head
                subtree_tokens = sorted(list(head.subtree), key=lambda t: t.idx)
                outcome_tokens = [t.text for t in subtree_tokens if t.idx >= token.idx]
                outcome_text = " ".join(outcome_tokens).strip().rstrip(".")

                if outcome_text and outcome_text not in outcomes:
                    outcomes.append(outcome_text)
                    start_char = token.idx
                    end_char = token.idx + len(outcome_text)
                    evidence.append(
                        EvidenceSpan(
                            category="outcome",
                            text=outcome_text,
                            start_char=start_char,
                            end_char=min(end_char, len(doc.text)),
                            confidence=0.88,
                        )
                    )

            # Case 2: System action verbs in root/conjunctive position
            elif token.lemma_.lower() in self.OUTCOME_VERBS and token.dep_ in ("ROOT", "conj") and token.dep_ != "advcl":
                has_modal = any(child.text.lower() in self.OUTCOME_MODALS for child in token.children)
                if not has_modal:
                    obj_tokens = [child.text for child in token.children if child.dep_ in ("dobj", "pobj", "obj")]
                    if obj_tokens:
                        outcome_phrase = f"{token.text} {' '.join(obj_tokens)}"
                        if outcome_phrase not in outcomes:
                            outcomes.append(outcome_phrase)
                            evidence.append(
                                EvidenceSpan(
                                    category="outcome",
                                    text=outcome_phrase,
                                    start_char=token.idx,
                                    end_char=token.idx + len(outcome_phrase),
                                    confidence=0.75,
                                )
                            )

        return outcomes

    def _extract_negations(self, doc: Doc, evidence: List[EvidenceSpan]) -> List[str]:
        negations: List[str] = []

        for token in doc:
            if token.dep_ == "neg" or token.text.lower() in ("not", "never", "no", "cannot", "without", "neither", "nor"):
                governing_verb = token.head.text if token.head else ""
                negation_phrase = f"{token.text} {governing_verb}".strip()
                negations.append(negation_phrase)
                evidence.append(
                    EvidenceSpan(
                        category="negation",
                        text=negation_phrase,
                        start_char=token.idx,
                        end_char=token.idx + len(negation_phrase),
                        confidence=0.95,
                    )
                )

        return negations
