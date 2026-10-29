from typing import Optional, Dict, Any, List
import json
import uuid
from app.llm.provider import (
    LLMProvider,
    LLMResponse,
    LLMTimeoutError,
    LLMRateLimitError,
    LLMAuthenticationError,
    LLMRefusalError,
    LLMMalformedOutputError
)


class MockLLMProvider(LLMProvider):
    """
    Deterministic Mock LLM Provider for local development, CI, and test execution.
    Never calls external networks or incurs API fees.
    """

    def __init__(
        self,
        model_name: str = "mock-llm-v1",
        mode: str = "success"
    ):
        self._model_name = model_name
        self.mode = mode

    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def model_name(self) -> str:
        return self._model_name

    def set_mode(self, mode: str) -> None:
        """Switch simulation behavior for unit/integration tests."""
        self.mode = mode

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 4096,
        timeout_seconds: Optional[int] = None
    ) -> LLMResponse:
        # Check simulation modes
        if self.mode == "timeout":
            raise LLMTimeoutError("Simulated mock timeout exceeded")
        if self.mode == "rate_limit":
            raise LLMRateLimitError("Simulated mock 429 rate limit quota exceeded")
        if self.mode == "auth_error":
            raise LLMAuthenticationError("Simulated mock invalid API key or credentials")
        if self.mode == "refusal":
            raise LLMRefusalError("Simulated mock safety policy refusal")
        if self.mode == "malformed_json":
            return LLMResponse(
                content="This is not JSON: {invalid syntax",
                provider_name=self.provider_name,
                model_name=self.model_name,
                prompt_tokens=50,
                completion_tokens=10,
                total_tokens=60,
                finish_reason="stop"
            )
        if self.mode == "empty":
            return LLMResponse(
                content=json.dumps({"candidates": []}),
                provider_name=self.provider_name,
                model_name=self.model_name,
                prompt_tokens=50,
                completion_tokens=5,
                total_tokens=55,
                finish_reason="stop"
            )

        # Extract context clues from prompt
        req_id = "req-1"
        req_version = 1
        for line in prompt.split("\n"):
            if line.startswith("REQUIREMENT ID:"):
                req_id = line.split(":", 1)[1].strip()
            elif line.startswith("REQUIREMENT VERSION:"):
                try:
                    req_version = int(line.split(":", 1)[1].strip())
                except ValueError:
                    req_version = 1

        # Synthesize realistic candidate test cases covering positive, negative, and boundary
        candidates = [
            {
                "schema_version": "1.0",
                "test_case_id": f"tc-{uuid.uuid4().hex[:8]}",
                "requirement_id": req_id,
                "requirement_version": req_version,
                "title": "Verify positive happy path with valid inputs",
                "category": "business_logic",
                "scenario_type": "positive",
                "preconditions": ["System is online and target environment is accessible"],
                "test_data": {"user_input": "valid_standard_data"},
                "steps": [
                    {
                        "step_number": 1,
                        "action": "navigate",
                        "target_ref": "target_page",
                        "value_ref": None
                    },
                    {
                        "step_number": 2,
                        "action": "enter_text",
                        "target_ref": "primary_input_field",
                        "value_ref": "valid_standard_data"
                    },
                    {
                        "step_number": 3,
                        "action": "click",
                        "target_ref": "submit_action_button",
                        "value_ref": None
                    },
                    {
                        "step_number": 4,
                        "action": "assert_visible",
                        "target_ref": "success_notification",
                        "value_ref": None
                    }
                ],
                "expected_result": "System processes the input successfully and renders confirmation.",
                "priority": "high",
                "automation_status": "requires_configuration",
                "assumptions": ["Assumes success notification locator is 'success_notification'"],
                "source_evidence": [{"requirement_span": "user must be able to complete the action"}],
                "review_status": "pending"
            },
            {
                "schema_version": "1.0",
                "test_case_id": f"tc-{uuid.uuid4().hex[:8]}",
                "requirement_id": req_id,
                "requirement_version": req_version,
                "title": "Verify negative rejection with invalid or missing input",
                "category": "validation",
                "scenario_type": "negative",
                "preconditions": ["Target environment is accessible and in clean state"],
                "test_data": {"user_input": ""},
                "steps": [
                    {
                        "step_number": 1,
                        "action": "navigate",
                        "target_ref": "target_page",
                        "value_ref": None
                    },
                    {
                        "step_number": 2,
                        "action": "click",
                        "target_ref": "submit_action_button",
                        "value_ref": None
                    },
                    {
                        "step_number": 3,
                        "action": "assert_text",
                        "target_ref": "validation_error_message",
                        "value_ref": "Field is required"
                    }
                ],
                "expected_result": "System rejects submission and displays validation error.",
                "priority": "high",
                "automation_status": "requires_configuration",
                "assumptions": ["Assumes client displays inline validation on empty submission"],
                "source_evidence": [{"requirement_span": "must validate input"}],
                "review_status": "pending"
            },
            {
                "schema_version": "1.0",
                "test_case_id": f"tc-{uuid.uuid4().hex[:8]}",
                "requirement_id": req_id,
                "requirement_version": req_version,
                "title": "Verify boundary condition at maximum input length limit",
                "category": "validation",
                "scenario_type": "boundary",
                "preconditions": ["Target environment is accessible"],
                "test_data": {"user_input": "x" * 255},
                "steps": [
                    {
                        "step_number": 1,
                        "action": "navigate",
                        "target_ref": "target_page",
                        "value_ref": None
                    },
                    {
                        "step_number": 2,
                        "action": "enter_text",
                        "target_ref": "primary_input_field",
                        "value_ref": "x" * 255
                    },
                    {
                        "step_number": 3,
                        "action": "click",
                        "target_ref": "submit_action_button",
                        "value_ref": None
                    },
                    {
                        "step_number": 4,
                        "action": "assert_visible",
                        "target_ref": "success_notification",
                        "value_ref": None
                    }
                ],
                "expected_result": "System accepts input up to boundary limit without error.",
                "priority": "medium",
                "automation_status": "requires_configuration",
                "assumptions": ["Assumes maximum length limit is 255 characters"],
                "source_evidence": [{"requirement_span": "input limit"}],
                "review_status": "pending"
            }
        ]

        payload = {"candidates": candidates}
        content = json.dumps(payload, indent=2)

        return LLMResponse(
            content=content,
            provider_name=self.provider_name,
            model_name=self.model_name,
            prompt_tokens=180,
            completion_tokens=420,
            total_tokens=600,
            finish_reason="stop",
            metadata={"mock_mode": self.mode}
        )

