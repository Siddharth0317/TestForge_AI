from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from dataclasses import dataclass, field


class LLMProviderError(Exception):
    """Base exception for LLM provider errors."""
    def __init__(self, message: str, code: str = "PROVIDER_ERROR", retryable: bool = False):
        super().__init__(message)
        self.message = message
        self.code = code
        self.retryable = retryable


class LLMTimeoutError(LLMProviderError):
    """Raised when an LLM provider call exceeds the configured timeout."""
    def __init__(self, message: str = "LLM provider request timed out"):
        super().__init__(message, code="TIMEOUT_ERROR", retryable=True)


class LLMRateLimitError(LLMProviderError):
    """Raised when an LLM provider rate limit / quota is exceeded."""
    def __init__(self, message: str = "LLM provider rate limit exceeded"):
        super().__init__(message, code="RATE_LIMIT_ERROR", retryable=True)


class LLMAuthenticationError(LLMProviderError):
    """Raised when an LLM provider credentials are missing or invalid."""
    def __init__(self, message: str = "Invalid or missing LLM provider API credentials"):
        super().__init__(message, code="AUTH_ERROR", retryable=False)


class LLMRefusalError(LLMProviderError):
    """Raised when an LLM refuses to generate content due to safety or policy."""
    def __init__(self, message: str = "LLM provider refused to generate response"):
        super().__init__(message, code="REFUSAL_ERROR", retryable=False)


class LLMMalformedOutputError(LLMProviderError):
    """Raised when an LLM response cannot be parsed into the required schema."""
    def __init__(self, message: str = "LLM response is malformed or invalid JSON"):
        super().__init__(message, code="MALFORMED_OUTPUT_ERROR", retryable=False)


@dataclass
class LLMResponse:
    content: str
    provider_name: str
    model_name: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    finish_reason: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class LLMProvider(ABC):
    """Abstract interface for LLM providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """The canonical name of the provider."""
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """The active model identifier."""
        pass

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 4096,
        timeout_seconds: Optional[int] = None
    ) -> LLMResponse:
        """Generate response text from the LLM provider."""
        pass
