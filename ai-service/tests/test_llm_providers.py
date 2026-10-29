import pytest
from unittest.mock import MagicMock, patch
from app.llm.mock_provider import MockLLMProvider
from app.llm.gemini_provider import GeminiLLMProvider
from app.llm.provider import (
    LLMTimeoutError,
    LLMRateLimitError,
    LLMAuthenticationError,
    LLMRefusalError,
    LLMProviderError
)


@pytest.mark.asyncio
async def test_mock_provider_success():
    provider = MockLLMProvider()
    res = await provider.generate(prompt="REQUIREMENT ID: req-123\nREQUIREMENT VERSION: 2\nREQUIREMENT TEXT: User can login.")
    assert res.provider_name == "mock"
    assert res.model_name == "mock-llm-v1"
    assert res.prompt_tokens > 0
    assert res.completion_tokens > 0
    assert "candidates" in res.content
    assert "req-123" in res.content


@pytest.mark.asyncio
async def test_mock_provider_timeout_simulation():
    provider = MockLLMProvider(mode="timeout")
    with pytest.raises(LLMTimeoutError) as exc_info:
        await provider.generate(prompt="test")
    assert exc_info.value.code == "TIMEOUT_ERROR"
    assert exc_info.value.retryable is True


@pytest.mark.asyncio
async def test_mock_provider_rate_limit_simulation():
    provider = MockLLMProvider(mode="rate_limit")
    with pytest.raises(LLMRateLimitError) as exc_info:
        await provider.generate(prompt="test")
    assert exc_info.value.code == "RATE_LIMIT_ERROR"
    assert exc_info.value.retryable is True


@pytest.mark.asyncio
async def test_mock_provider_auth_error_simulation():
    provider = MockLLMProvider(mode="auth_error")
    with pytest.raises(LLMAuthenticationError) as exc_info:
        await provider.generate(prompt="test")
    assert exc_info.value.code == "AUTH_ERROR"
    assert exc_info.value.retryable is False


@pytest.mark.asyncio
async def test_mock_provider_refusal_simulation():
    provider = MockLLMProvider(mode="refusal")
    with pytest.raises(LLMRefusalError) as exc_info:
        await provider.generate(prompt="test")
    assert exc_info.value.code == "REFUSAL_ERROR"
    assert exc_info.value.retryable is False


@pytest.mark.asyncio
async def test_mock_provider_malformed_json_simulation():
    provider = MockLLMProvider(mode="malformed_json")
    res = await provider.generate(prompt="test")
    assert "This is not JSON" in res.content


@pytest.mark.asyncio
async def test_gemini_provider_missing_key():
    provider = GeminiLLMProvider(api_key="")
    with pytest.raises(LLMAuthenticationError) as exc_info:
        await provider.generate(prompt="test")
    assert "GEMINI_API_KEY is not configured" in str(exc_info.value)


@pytest.mark.asyncio
async def test_gemini_provider_mocked_success():
    provider = GeminiLLMProvider(api_key="fake-gemini-key", model_name="gemini-2.5-flash")

    mock_response = MagicMock()
    mock_candidate = MagicMock()
    mock_candidate.finish_reason = "STOP"
    mock_response.candidates = [mock_candidate]
    mock_response.text = '{"candidates": [{"schema_version": "1.0", "requirement_id": "r1", "title": "Test Login", "category": "authentication", "scenario_type": "positive", "steps": [{"step_number": 1, "action": "navigate", "target_ref": "login_page"}], "expected_result": "Success"}]}'
    
    mock_usage = MagicMock()
    mock_usage.prompt_token_count = 120
    mock_usage.candidates_token_count = 85
    mock_usage.total_token_count = 205
    mock_response.usage_metadata = mock_usage

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response

    with patch.object(provider, "_get_client", return_value=mock_client):
        res = await provider.generate(prompt="test prompt")
        assert res.provider_name == "gemini"
        assert res.model_name == "gemini-2.5-flash"
        assert res.prompt_tokens == 120
        assert res.completion_tokens == 85
        assert res.total_tokens == 205
        assert "Test Login" in res.content
