import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    AI_SERVICE_PORT: int = Field(default=8000)
    AI_SERVICE_HOST: str = Field(default="0.0.0.0")
    AI_LOG_LEVEL: str = Field(default="INFO")
    INTERNAL_SERVICE_KEY: str = Field(default="replace-with-internal-service-secret-token")
    LLM_PROVIDER: str = Field(default="mock")
    LLM_MODEL: str = Field(default="gemini-1.5-pro")
    GEMINI_API_KEY: str = Field(default="")
    OPENAI_API_KEY: str = Field(default="")

    model_config = SettingsConfigDict(
        env_file=os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.env")),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

