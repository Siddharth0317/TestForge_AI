import pytest
from app.llm.generator import TestCaseGenerator, clean_json_text
from app.llm.mock_provider import MockLLMProvider
from app.llm.schemas import (
    GenerateTestCasesRequest,
    ScenarioType,
    RequirementCategory,
    ActionType
)
from app.llm.prompts import build_user_prompt_v1


def test_clean_json_text():
    assert clean_json_text('{"a": 1}') == '{"a": 1}'
    assert clean_json_text('```json\n{"a": 1}\n```') == '{"a": 1}'
    assert clean_json_text('```\n{"a": 1}\n```') == '{"a": 1}'


def test_build_user_prompt():
    prompt = build_user_prompt_v1(
        requirement_text="The system shall validate email address format.",
        requirement_id="req-999",
        requirement_version=3,
        category="validation",
        scenario_types=["positive", "negative"],
        nlp_analysis={
            "actors": ["user"],
            "actions": ["validate"],
            "entities": ["email address"],
            "conditions": ["When submitted"],
            "constraints": ["valid format"],
            "outcomes": ["rejects invalid"]
        },
        max_cases=3
    )
    assert "REQUIREMENT ID: req-999" in prompt
    assert "REQUIREMENT VERSION: 3" in prompt
    assert "The system shall validate email address format." in prompt
    assert "PREDICTED CATEGORY: validation" in prompt
    assert "Extracted Actors: user" in prompt
    assert "Extracted Entities: email address" in prompt


@pytest.mark.asyncio
async def test_generator_successful_mock():
    mock_provider = MockLLMProvider()
    generator = TestCaseGenerator(default_provider=mock_provider)

    req = GenerateTestCasesRequest(
        requirement_id="req-456",
        requirement_version=1,
        requirement_text="User must be able to log in with valid credentials.",
        ml_category="authentication",
        scenario_types=[ScenarioType.POSITIVE, ScenarioType.NEGATIVE],
        max_cases=3
    )

    resp = await generator.generate_test_cases(req)
    assert resp.status == "completed"
    assert resp.provider == "mock"
    assert resp.model == "mock-llm-v1"
    assert resp.schema_version == "1.0"
    assert len(resp.candidates) > 0
    assert resp.error_code is None

    first = resp.candidates[0]
    assert first.requirement_id == "req-456"
    assert first.requirement_version == 1
    assert first.title
    assert first.scenario_type in [s.value for s in ScenarioType]
    assert len(first.steps) >= 1
    for step in first.steps:
        assert step.action in [a.value for a in ActionType]
        assert step.target_ref
    assert first.expected_result


@pytest.mark.asyncio
async def test_generator_handles_malformed_json():
    mock_provider = MockLLMProvider(mode="malformed_json")
    generator = TestCaseGenerator(default_provider=mock_provider)

    req = GenerateTestCasesRequest(
        requirement_id="req-fail",
        requirement_text="Some valid text for generation."
    )

    resp = await generator.generate_test_cases(req)
    assert resp.status == "failed"
    assert resp.error_code == "MALFORMED_OUTPUT_ERROR"
    assert len(resp.candidates) == 0


@pytest.mark.asyncio
async def test_generator_handles_empty_candidates():
    mock_provider = MockLLMProvider(mode="empty")
    generator = TestCaseGenerator(default_provider=mock_provider)

    req = GenerateTestCasesRequest(
        requirement_id="req-empty",
        requirement_text="Some valid text for generation."
    )

    resp = await generator.generate_test_cases(req)
    assert resp.status == "failed"
    assert resp.error_code == "VALIDATION_FAILED"
    assert len(resp.candidates) == 0


@pytest.mark.asyncio
async def test_generator_handles_auth_error():
    mock_provider = MockLLMProvider(mode="auth_error")
    generator = TestCaseGenerator(default_provider=mock_provider)

    req = GenerateTestCasesRequest(
        requirement_id="req-auth",
        requirement_text="Some valid text for generation."
    )

    resp = await generator.generate_test_cases(req)
    assert resp.status == "failed"
    assert resp.error_code == "AUTH_ERROR"
    assert "invalid API key" in resp.error_summary
