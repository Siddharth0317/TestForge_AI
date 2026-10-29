import asyncio
import logging
from typing import Optional, Dict, Any
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

logger = logging.getLogger(__name__)


class GeminiLLMProvider(LLMProvider):
    """
    Google Gemini provider adapter utilizing official google-genai SDK.
    Supports structured JSON generation, rate-limit recovery, and safe token accounting.
    """

    def __init__(
        self,
        api_key: str,
        model_name: str = "gemini-2.5-flash",
        timeout_seconds: int = 30
    ):
        self._api_key = api_key
        self._model_name = model_name
        self._timeout_seconds = timeout_seconds
        self._client = None

    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def model_name(self) -> str:
        return self._model_name

    def _get_client(self):
        if not self._api_key or self._api_key.strip() == "":
            raise LLMAuthenticationError("GEMINI_API_KEY is not configured on the server")
        
        if self._client is None:
            try:
                from google import genai
                self._client = genai.Client(api_key=self._api_key)
            except Exception as e:
                raise LLMAuthenticationError(f"Failed to initialize Gemini client: {e}")
        return self._client

    def _sync_generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 4096
    ) -> LLMResponse:
        client = self._get_client()
        from google.genai import types

        config = types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            response_mime_type="application/json"
        )
        if system_prompt:
            config.system_instruction = system_prompt

        try:
            response = client.models.generate_content(
                model=self._model_name,
                contents=prompt,
                config=config
            )
        except Exception as exc:
            err_str = str(exc)
            err_lower = err_str.lower()
            if "429" in err_str or "resource_exhausted" in err_lower or "quota" in err_lower:
                raise LLMRateLimitError(f"Gemini quota/rate limit exceeded: {err_str}")
            if "401" in err_str or "403" in err_str or "api_key_invalid" in err_lower or "permission_denied" in err_lower:
                raise LLMAuthenticationError(f"Gemini authentication failed: {err_str}")
            if "timeout" in err_lower or "timed out" in err_lower or "504" in err_str:
                raise LLMTimeoutError(f"Gemini API timed out: {err_str}")
            raise LLMProviderError(f"Gemini generation failure: {err_str}")

        # Check refusal or blocked candidates
        if not response.candidates or len(response.candidates) == 0:
            raise LLMRefusalError("Gemini returned zero candidates (possible content moderation or safety block)")

        first_candidate = response.candidates[0]
        finish_reason = getattr(first_candidate, "finish_reason", "STOP")
        if finish_reason and "SAFETY" in str(finish_reason).upper():
            raise LLMRefusalError(f"Gemini refused generation due to safety policy: {finish_reason}")

        text_content = response.text or ""
        if not text_content.strip():
            raise LLMMalformedOutputError("Gemini returned an empty response body")

        prompt_tokens = 0
        completion_tokens = 0
        total_tokens = 0
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            prompt_tokens = getattr(response.usage_metadata, "prompt_token_count", 0) or 0
            completion_tokens = getattr(response.usage_metadata, "candidates_token_count", 0) or 0
            total_tokens = getattr(response.usage_metadata, "total_token_count", 0) or (prompt_tokens + completion_tokens)

        return LLMResponse(
            content=text_content,
            provider_name=self.provider_name,
            model_name=self.model_name,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            finish_reason=str(finish_reason),
            metadata={"sdk": "google-genai"}
        )

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 4096,
        timeout_seconds: Optional[int] = None
    ) -> LLMResponse:
        effective_timeout = timeout_seconds or self._timeout_seconds

        try:
            return await asyncio.wait_for(
                asyncio.to_thread(
                    self._sync_generate,
                    prompt=prompt,
                    system_prompt=system_prompt,
                    temperature=temperature,
                    max_tokens=max_tokens
                ),
                timeout=effective_timeout
            )
        except asyncio.TimeoutError:
            raise LLMTimeoutError(f"Gemini generation exceeded timeout limit of {effective_timeout}s")

