import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings
from app.validation.validator import TestCaseValidator
from app.llm.schemas import ValidationSeverity


@pytest.fixture
def validator():
    return TestCaseValidator()


@pytest.fixture
def valid_candidate():
    return {
        "test_case_id": "tc-101",
        "title": "Valid user authentication with standard credentials",
        "scenario_type": "positive",
        "preconditions": ["User account is active"],
        "test_data": {"email": "user@company.local", "password": "SecurePassword123!"},
        "steps": [
            {"step_number": 1, "action": "navigate", "target_ref": "login_page", "value_ref": None},
            {"step_number": 2, "action": "enter_text", "target_ref": "email_input", "value_ref": "user@company.local"},
            {"step_number": 3, "action": "enter_text", "target_ref": "password_input", "value_ref": "SecurePassword123!"},
            {"step_number": 4, "action": "click", "target_ref": "submit_btn", "value_ref": None}
        ],
        "expected_result": "User is redirected to the dashboard with active session.",
        "assertions": [
            {"type": "assert_visible", "target_ref": "user_dashboard", "expected_value": None, "timeout_ms": 5000}
        ],
        "priority": "high",
        "assumptions": ["Assumes session cookie is set immediately"],
        "source_evidence": [{"requirement_span": "user must be able to log in with valid credentials"}]
    }


def test_valid_candidate_passes(validator, valid_candidate):
    req_text = "The user must be able to log in with valid credentials and access dashboard."
    res = validator.validate_candidate(valid_candidate, req_text)
    assert res.is_valid is True
    # Should have no error severity findings
    assert not any(f.severity == ValidationSeverity.ERROR for f in res.findings)
    # Assumptions trigger an info finding
    assert any(f.rule == "unstated_assumptions" for f in res.findings)
    assert res.priority_score > 0
    assert "Score:" in res.priority_rationale


def test_missing_title_fails(validator, valid_candidate):
    valid_candidate["title"] = ""
    res = validator.validate_candidate(valid_candidate, "User must log in")
    assert res.is_valid is False
    assert any(f.rule == "schema_missing_title" for f in res.findings)


def test_disallowed_action_fails(validator, valid_candidate):
    valid_candidate["steps"][0]["action"] = "execute_arbitrary_shell_command"
    res = validator.validate_candidate(valid_candidate, "User must log in")
    assert res.is_valid is False
    assert any(f.rule == "schema_disallowed_action" for f in res.findings)


def test_non_sequential_steps_fail(validator, valid_candidate):
    valid_candidate["steps"][1]["step_number"] = 5  # Jumps from 1 to 5
    res = validator.validate_candidate(valid_candidate, "User must log in")
    assert res.is_valid is False
    assert any(f.rule == "schema_invalid_step_order" for f in res.findings)


def test_missing_assertions_fails(validator, valid_candidate):
    valid_candidate["assertions"] = []
    res = validator.validate_candidate(valid_candidate, "User must log in")
    assert res.is_valid is False
    assert any(f.rule == "schema_missing_assertions" for f in res.findings)


def test_disallowed_assertion_type_fails(validator, valid_candidate):
    valid_candidate["assertions"] = [{"type": "arbitrary_eval", "target_ref": "elem", "timeout_ms": 5000}]
    res = validator.validate_candidate(valid_candidate, "User must log in")
    assert res.is_valid is False
    assert any(f.rule == "schema_disallowed_assertion_type" for f in res.findings)


def test_unmatched_evidence_span_generates_warning(validator, valid_candidate):
    req_text = "Only authorized personnel may update user accounts."
    # The span 'user must be able to log in with valid credentials' does not exist in req_text
    res = validator.validate_candidate(valid_candidate, req_text)
    assert any(f.rule == "traceability_span_unmatched" for f in res.findings)
    assert any(f.severity == ValidationSeverity.WARNING for f in res.findings)


def test_boundary_without_numeric_limits_generates_warning(validator, valid_candidate):
    valid_candidate["scenario_type"] = "boundary"
    # Requirement contains no numbers or limit words
    req_text = "The user can submit feedback comments to our support team."
    res = validator.validate_candidate(valid_candidate, req_text)
    assert any(f.rule == "unsupported_boundary_scenario" for f in res.findings)


def test_priority_score_transparency(validator, valid_candidate):
    req_text = "The user must be able to log in with valid credentials."
    res = validator.validate_candidate(valid_candidate, req_text)
    assert 0 <= res.priority_score <= 100
    assert "Base scenario" in res.priority_rationale
    assert "Critical keywords" in res.priority_rationale


@pytest.mark.asyncio
async def test_validation_api_endpoint(valid_candidate):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Unauthorized without internal key
        res = await client.post(
            "/internal/v1/test-cases/validate",
            json={
                "requirement_text": "The user must be able to log in with valid credentials.",
                "candidate_test_cases": [valid_candidate]
            }
        )
        assert res.status_code == 401

        # Authorized with internal key
        res = await client.post(
            "/internal/v1/test-cases/validate",
            headers={"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY},
            json={
                "requirement_text": "The user must be able to log in with valid credentials and access dashboard.",
                "candidate_test_cases": [valid_candidate]
            }
        )
        assert res.status_code == 200
        data = res.json()
        assert "validation_results" in data
        assert len(data["validation_results"]) == 1
        assert data["validation_results"][0]["is_valid"] is True
