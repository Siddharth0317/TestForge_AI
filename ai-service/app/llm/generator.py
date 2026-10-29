import asyncio
import json
import logging
import re
import time
import uuid
from typing import Optional, List, Dict, Any

from app.core.config import settings
from app.llm.schemas import (
    CandidateTestCase,
    GenerateTestCasesRequest,
    GenerateTestCasesResponse,
    TokenUsage,
    ActionType
)
from app.llm.provider import (
    LLMProvider,
    LLMResponse,
    LLMProviderError,
    LLMTimeoutError,
    LLMRateLimitError,
    LLMAuthenticationError,
    LLMRefusalError,
    LLMMalformedOutputError
)
from app.llm.mock_provider import MockLLMProvider
from app.llm.gemini_provider import GeminiLLMProvider
from app.llm.prompts import (
    SYSTEM_PROMPT_V1,
    PROMPT_TEMPLATE_VERSION,
    build_user_prompt_v1
)

logger = logging.getLogger(__name__)


def clean_json_text(text: str) -> str:
    """Strip markdown code block fences and trailing text if present."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


class TestCaseGenerator:
    """
    Orchestrates LLM provider interaction, bounded retries, response normalization,
    and schema validation for candidate test case generation.
    """
    __test__ = False

    def __init__(self, default_provider: Optional[LLMProvider] = None):
        self._default_provider = default_provider

    def _resolve_provider(self, override: Optional[str] = None) -> LLMProvider:
        if self._default_provider and not override:
            return self._default_provider

        provider_type = (override or settings.LLM_PROVIDER).lower().strip()

        if provider_type == "gemini":
            return GeminiLLMProvider(
                api_key=settings.GEMINI_API_KEY,
                model_name=settings.LLM_MODEL,
                timeout_seconds=settings.LLM_TIMEOUT_SECONDS
            )
        elif provider_type == "mock":
            return MockLLMProvider(
                model_name="mock-llm-v1"
            )
        else:
            logger.warning("Unknown provider '%s', falling back to mock provider", provider_type)
            return MockLLMProvider(model_name="mock-llm-v1")

    async def generate_test_cases(
        self,
        request: GenerateTestCasesRequest
    ) -> GenerateTestCasesResponse:
        job_id = f"gen-{uuid.uuid4().hex[:12]}"
        start_time = time.perf_counter()
        provider = self._resolve_provider(request.provider_override)

        user_prompt = build_user_prompt_v1(
            requirement_text=request.requirement_text,
            requirement_id=request.requirement_id,
            requirement_version=request.requirement_version,
            category=request.ml_category,
            scenario_types=[s.value for s in request.scenario_types] if request.scenario_types else None,
            nlp_analysis=request.nlp_analysis,
            max_cases=request.max_cases
        )

        max_retries = settings.LLM_MAX_RETRIES
        attempts = 0
        last_error = None
        llm_response: Optional[LLMResponse] = None

        while attempts <= max_retries:
            attempts += 1
            try:
                llm_response = await provider.generate(
                    prompt=user_prompt,
                    system_prompt=SYSTEM_PROMPT_V1,
                    temperature=settings.LLM_TEMPERATURE,
                    max_tokens=settings.LLM_MAX_OUTPUT_TOKENS,
                    timeout_seconds=settings.LLM_TIMEOUT_SECONDS
                )
                break
            except (LLMTimeoutError, LLMRateLimitError) as err:
                last_error = err
                logger.warning(
                    "Retryable LLM error on attempt %d/%d (%s): %s",
                    attempts, max_retries + 1, err.code, err.message
                )
                if attempts <= max_retries:
                    backoff = 0.5 * (2 ** (attempts - 1))
                    await asyncio.sleep(backoff)
                else:
                    break
            except LLMProviderError as err:
                # Non-retryable provider error (e.g., auth, refusal)
                last_error = err
                break
            except Exception as err:
                last_error = LLMProviderError(f"Unexpected provider error: {str(err)}")
                break

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

        if not llm_response:
            err_code = getattr(last_error, "code", "GENERATION_FAILED")
            err_summary = getattr(last_error, "message", str(last_error))
            logger.error("Generation job %s failed: %s (%s)", job_id, err_code, err_summary)
            return GenerateTestCasesResponse(
                job_id=job_id,
                requirement_id=request.requirement_id,
                requirement_version=request.requirement_version,
                status="failed",
                provider=provider.provider_name,
                model=provider.model_name,
                prompt_template_version=PROMPT_TEMPLATE_VERSION,
                candidates=[],
                token_usage=TokenUsage(),
                duration_ms=duration_ms,
                error_code=err_code,
                error_summary=err_summary
            )

        # Parse JSON and validate schemas
        cleaned_json = clean_json_text(llm_response.content)
        try:
            parsed_data = json.loads(cleaned_json)
        except json.JSONDecodeError as jde:
            logger.error("LLM returned unparseable JSON for job %s: %s", job_id, jde)
            return GenerateTestCasesResponse(
                job_id=job_id,
                requirement_id=request.requirement_id,
                requirement_version=request.requirement_version,
                status="failed",
                provider=provider.provider_name,
                model=provider.model_name,
                prompt_template_version=PROMPT_TEMPLATE_VERSION,
                candidates=[],
                token_usage=TokenUsage(
                    prompt_tokens=llm_response.prompt_tokens,
                    completion_tokens=llm_response.completion_tokens,
                    total_tokens=llm_response.total_tokens
                ),
                duration_ms=duration_ms,
                error_code="MALFORMED_OUTPUT_ERROR",
                error_summary="LLM response did not contain valid JSON"
            )

        raw_candidates = []
        if isinstance(parsed_data, dict):
            raw_candidates = parsed_data.get("candidates", [])
            if not raw_candidates and "title" in parsed_data:
                raw_candidates = [parsed_data]
        elif isinstance(parsed_data, list):
            raw_candidates = parsed_data

        validated_candidates: List[CandidateTestCase] = []
        for idx, item in enumerate(raw_candidates):
            try:
                if not isinstance(item, dict):
                    continue
                # Enforce requirement linkage
                item["requirement_id"] = request.requirement_id
                item["requirement_version"] = request.requirement_version
                if not item.get("test_case_id"):
                    item["test_case_id"] = f"tc-{uuid.uuid4().hex[:8]}"
                
                # Sanitize steps
                steps = item.get("steps", [])
                valid_steps = []
                for s_idx, step in enumerate(steps, 1):
                    if isinstance(step, dict):
                        action_str = str(step.get("action", "")).lower().strip()
                        # Verify allowlisted action
                        if action_str in [a.value for a in ActionType]:
                            step["step_number"] = s_idx
                            valid_steps.append(step)
                item["steps"] = valid_steps

                candidate = CandidateTestCase.model_validate(item)
                validated_candidates.append(candidate)
            except Exception as ve:
                logger.warning("Candidate %d rejected during schema validation: %s", idx, ve)

        status = "completed" if len(validated_candidates) > 0 else "failed"
        err_code = None if status == "completed" else "VALIDATION_FAILED"
        err_summary = None if status == "completed" else "No candidates satisfied the schema validation criteria"

        return GenerateTestCasesResponse(
            job_id=job_id,
            requirement_id=request.requirement_id,
            requirement_version=request.requirement_version,
            status=status,
            provider=provider.provider_name,
            model=provider.model_name,
            prompt_template_version=PROMPT_TEMPLATE_VERSION,
            schema_version="1.0",
            candidates=validated_candidates,
            token_usage=TokenUsage(
                prompt_tokens=llm_response.prompt_tokens,
                completion_tokens=llm_response.completion_tokens,
                total_tokens=llm_response.total_tokens
            ),
            duration_ms=duration_ms,
            error_code=err_code,
            error_summary=err_summary
        )
