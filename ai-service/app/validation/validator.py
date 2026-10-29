import re
from typing import Dict, Any, List, Optional, Tuple
from app.llm.schemas import (
    ValidationSeverity,
    ValidationFinding,
    TestCaseValidationResult,
    ScenarioType,
    ActionType,
    AssertionType
)

ALLOWED_ACTIONS = {action.value for action in ActionType}
ALLOWED_ASSERTIONS = {assert_type.value for assert_type in AssertionType}
ALLOWED_SCENARIOS = {scen.value for scen in ScenarioType}

# Boundary indicator keywords in requirements
BOUNDARY_KEYWORDS = {
    "limit", "min", "max", "minimum", "maximum", "bound", "boundary",
    "threshold", "length", "characters", "times", "attempts",
    "seconds", "minutes", "hours", "days", "exceed", "capacity", "range"
}

# Criticality keywords for priority boost
CRITICAL_KEYWORDS = {
    "auth", "authentication", "login", "password", "credential", "security",
    "lockout", "token", "permission", "role", "payment", "checkout", "admin",
    "privilege", "encrypt", "confidential"
}


class TestCaseValidator:
    """
    Deterministic rule-based validation engine for candidate test cases conforming to
    Section 9.7 and Section 10 of Spec.md.
    Provides explainable findings, transparent prioritization, and automation checks.
    """

    def validate_batch(
        self,
        candidates: List[Dict[str, Any]],
        requirement_text: str
    ) -> List[TestCaseValidationResult]:
        """Validate a list of candidate test cases against the requirement text."""
        results = []
        for cand in candidates:
            results.append(self.validate_candidate(cand, requirement_text))
        return results

    def validate_candidate(
        self,
        cand: Dict[str, Any],
        requirement_text: str
    ) -> TestCaseValidationResult:
        """Run deterministic schema, traceability, and semantic checks on a single test case."""
        findings: List[ValidationFinding] = []
        test_case_id = cand.get("test_case_id") or cand.get("id")

        # 1. Title validation
        title = cand.get("title", "").strip() if isinstance(cand.get("title"), str) else ""
        if not title or len(title) < 3:
            findings.append(ValidationFinding(
                rule="schema_missing_title",
                severity=ValidationSeverity.ERROR,
                message="Test case must provide a descriptive title of at least 3 characters",
                field="title"
            ))

        # 2. Scenario Type validation
        scenario_type = cand.get("scenario_type")
        if not scenario_type or scenario_type not in ALLOWED_SCENARIOS:
            findings.append(ValidationFinding(
                rule="schema_invalid_scenario_type",
                severity=ValidationSeverity.ERROR,
                message=f"Scenario type '{scenario_type}' is invalid. Allowed: {sorted(list(ALLOWED_SCENARIOS))}",
                field="scenario_type"
            ))

        # 3. Steps validation
        steps = cand.get("steps")
        if not isinstance(steps, list) or len(steps) == 0:
            findings.append(ValidationFinding(
                rule="schema_empty_steps",
                severity=ValidationSeverity.ERROR,
                message="Test case must define at least one sequential execution step",
                field="steps"
            ))
        else:
            prev_num = 0
            for idx, step in enumerate(steps):
                if not isinstance(step, dict):
                    findings.append(ValidationFinding(
                        rule="schema_malformed_step",
                        severity=ValidationSeverity.ERROR,
                        message=f"Step at index {idx} is malformed",
                        field=f"steps[{idx}]"
                    ))
                    continue

                step_num = step.get("step_number")
                if not isinstance(step_num, int) or step_num <= 0:
                    findings.append(ValidationFinding(
                        rule="schema_invalid_step_number",
                        severity=ValidationSeverity.ERROR,
                        message=f"Step at index {idx} has invalid step_number ({step_num})",
                        field=f"steps[{idx}].step_number"
                    ))
                elif step_num != prev_num + 1 and prev_num != 0:
                    findings.append(ValidationFinding(
                        rule="schema_invalid_step_order",
                        severity=ValidationSeverity.ERROR,
                        message=f"Step numbers must be strictly sequential (expected {prev_num + 1}, got {step_num})",
                        field=f"steps[{idx}].step_number"
                    ))
                if isinstance(step_num, int):
                    prev_num = step_num

                action = step.get("action")
                if not action or action not in ALLOWED_ACTIONS:
                    findings.append(ValidationFinding(
                        rule="schema_disallowed_action",
                        severity=ValidationSeverity.ERROR,
                        message=f"Action '{action}' is not in the allowed action vocabulary",
                        field=f"steps[{idx}].action"
                    ))

                target_ref = step.get("target_ref")
                if not target_ref or not isinstance(target_ref, str) or not target_ref.strip():
                    findings.append(ValidationFinding(
                        rule="schema_missing_target_ref",
                        severity=ValidationSeverity.ERROR,
                        message=f"Step {step_num or idx+1} must specify a non-empty target_ref locator",
                        field=f"steps[{idx}].target_ref"
                    ))

        # 4. Expected Result validation
        expected_result = cand.get("expected_result", "").strip() if isinstance(cand.get("expected_result"), str) else ""
        if not expected_result or len(expected_result) < 3:
            findings.append(ValidationFinding(
                rule="schema_missing_expected_result",
                severity=ValidationSeverity.ERROR,
                message="Test case must provide an explicit expected_result outcome",
                field="expected_result"
            ))

        # 5. Assertions validation
        assertions = cand.get("assertions")
        has_step_assertion = any(
            isinstance(s, dict) and str(s.get("action", "")).startswith("assert_")
            for s in (steps if isinstance(steps, list) else [])
        )
        has_explicit_assertions = isinstance(assertions, list) and len(assertions) > 0

        if not has_explicit_assertions and not has_step_assertion:
            findings.append(ValidationFinding(
                rule="schema_missing_assertions",
                severity=ValidationSeverity.ERROR,
                message="Test case must define at least one explicit verifiable assertion",
                field="assertions"
            ))
        elif isinstance(assertions, list):
            for a_idx, assertion in enumerate(assertions):
                if not isinstance(assertion, dict):
                    continue
                a_type = assertion.get("type")
                if not a_type or a_type not in ALLOWED_ASSERTIONS:
                    findings.append(ValidationFinding(
                        rule="schema_disallowed_assertion_type",
                        severity=ValidationSeverity.ERROR,
                        message=f"Assertion type '{a_type}' is not allowed",
                        field=f"assertions[{a_idx}].type"
                    ))
                a_target = assertion.get("target_ref")
                if not a_target or not isinstance(a_target, str) or not a_target.strip():
                    findings.append(ValidationFinding(
                        rule="schema_missing_assertion_target",
                        severity=ValidationSeverity.ERROR,
                        message=f"Assertion {a_idx+1} must specify a non-empty target_ref",
                        field=f"assertions[{a_idx}].target_ref"
                    ))

        # 6. Traceability and Source Evidence validation
        source_evidence = cand.get("source_evidence")
        req_text_lower = requirement_text.lower()
        if not isinstance(source_evidence, list) or len(source_evidence) == 0:
            findings.append(ValidationFinding(
                rule="traceability_missing_evidence",
                severity=ValidationSeverity.WARNING,
                message="No requirement source evidence spans cited for this candidate test case",
                field="source_evidence"
            ))
        else:
            for e_idx, ev in enumerate(source_evidence):
                span = ""
                if isinstance(ev, str):
                    span = ev.strip()
                elif isinstance(ev, dict):
                    span = ev.get("requirement_span", "").strip()

                if not span:
                    findings.append(ValidationFinding(
                        rule="traceability_empty_span",
                        severity=ValidationSeverity.WARNING,
                        message=f"Evidence span at index {e_idx} is empty",
                        field=f"source_evidence[{e_idx}]"
                    ))
                elif span.lower() not in req_text_lower:
                    findings.append(ValidationFinding(
                        rule="traceability_span_unmatched",
                        severity=ValidationSeverity.WARNING,
                        message=f"Cited evidence span '{span}' was not found in the source requirement text",
                        field=f"source_evidence[{e_idx}]"
                    ))

        # 7. Semantic / Domain Consistency (Boundary checking)
        if scenario_type == ScenarioType.BOUNDARY.value:
            has_numbers = bool(re.search(r"\b\d+\b", requirement_text))
            has_boundary_words = any(w in req_text_lower for w in BOUNDARY_KEYWORDS)
            if not has_numbers and not has_boundary_words:
                findings.append(ValidationFinding(
                    rule="unsupported_boundary_scenario",
                    severity=ValidationSeverity.WARNING,
                    message="Scenario is marked as 'boundary' but requirement text contains no numeric limits or boundary keywords",
                    field="scenario_type"
                ))

        # 8. Unstated Assumptions flag
        assumptions = cand.get("assumptions")
        if isinstance(assumptions, list) and len(assumptions) > 0:
            findings.append(ValidationFinding(
                rule="unstated_assumptions",
                severity=ValidationSeverity.INFO,
                message=f"Test case relies on {len(assumptions)} unstated model assumption(s) requiring human review",
                field="assumptions"
            ))

        # Determine validity: valid if NO findings with severity == 'error'
        has_errors = any(f.severity == ValidationSeverity.ERROR for f in findings)
        is_valid = not has_errors

        # Calculate explainable rule-based priority score & rationale
        priority_score, priority_rationale = self._calculate_rule_based_priority(
            cand=cand,
            requirement_text=requirement_text,
            has_errors=has_errors,
            has_warnings=any(f.severity == ValidationSeverity.WARNING for f in findings),
            has_assumptions=isinstance(assumptions, list) and len(assumptions) > 0,
            has_explicit_assertions=has_explicit_assertions or has_step_assertion
        )

        # Automation status
        if has_errors:
            automation_status = "not_executable"
        elif any(f.rule == "unsupported_boundary_scenario" for f in findings):
            automation_status = "manual_only"
        else:
            automation_status = "requires_configuration"

        return TestCaseValidationResult(
            test_case_id=str(test_case_id) if test_case_id else None,
            is_valid=is_valid,
            findings=findings,
            priority_score=priority_score,
            priority_rationale=priority_rationale,
            automation_status=automation_status
        )

    def _calculate_rule_based_priority(
        self,
        cand: Dict[str, Any],
        requirement_text: str,
        has_errors: bool,
        has_warnings: bool,
        has_assumptions: bool,
        has_explicit_assertions: bool
    ) -> Tuple[int, str]:
        """
        Calculate an explainable priority score (0-100) using deterministic signals.
        Never conflated with ML classification confidence.
        """
        scenario = cand.get("scenario_type", "positive")
        rationale_parts = []
        score = 0

        # 1. Base scenario contribution
        if scenario in ["authorization", "security"]:
            base = 35
            rationale_parts.append(f"Base scenario '{scenario}' (+{base})")
        elif scenario == "positive":
            base = 30
            rationale_parts.append(f"Base scenario 'positive' (+{base})")
        elif scenario in ["negative", "error_handling"]:
            base = 25
            rationale_parts.append(f"Base scenario '{scenario}' (+{base})")
        elif scenario == "boundary":
            base = 20
            rationale_parts.append(f"Base scenario 'boundary' (+{base})")
        else:
            base = 20
            rationale_parts.append(f"Base scenario '{scenario}' (+{base})")
        score += base

        # 2. Critical requirement keywords match
        title_lower = str(cand.get("title", "")).lower()
        req_lower = requirement_text.lower()
        combined = f"{title_lower} {req_lower}"
        matched_keywords = [kw for kw in CRITICAL_KEYWORDS if kw in combined]
        if matched_keywords:
            boost = 20
            score += boost
            rationale_parts.append(f"Critical keywords matched [{', '.join(matched_keywords[:3])}] (+{boost})")

        # 3. Assertions completeness
        if has_explicit_assertions:
            assertions_boost = 15
            score += assertions_boost
            rationale_parts.append(f"Verifiable assertions present (+{assertions_boost})")

        # 4. Automation feasibility check
        steps = cand.get("steps")
        if isinstance(steps, list) and len(steps) >= 2:
            step_boost = 10
            score += step_boost
            rationale_parts.append(f"Action sequence defined ({len(steps)} steps) (+{step_boost})")

        # 5. Penalties
        if has_assumptions:
            penalty = 10
            score -= penalty
            rationale_parts.append(f"Unstated model assumptions (-{penalty})")

        if has_warnings:
            penalty = 10
            score -= penalty
            rationale_parts.append(f"Validation warnings (-{penalty})")

        if has_errors:
            penalty = 35
            score -= penalty
            rationale_parts.append(f"Blocking schema errors (-{penalty})")

        # Clamp between 0 and 100
        score = max(0, min(100, score))

        tier = "low"
        if score >= 80:
            tier = "critical"
        elif score >= 60:
            tier = "high"
        elif score >= 40:
            tier = "medium"

        full_rationale = " | ".join(rationale_parts) + f" -> Score: {score}/100 ({tier})"
        return score, full_rationale

