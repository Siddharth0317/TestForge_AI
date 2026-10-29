import time
from datetime import datetime, timezone
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.security import verify_internal_key
from app.api.v1.requirements import router as requirements_router
from app.api.v1.classifier import router as classifier_router
from app.api.v1.generation import router as generation_router

app = FastAPI(
    title="TestForge AI Service",
    description="Deterministic NLP, ML Requirement Classification, and Structured Test Generation",
    version="1.0.0"
)

# Register API routers
app.include_router(requirements_router)
app.include_router(classifier_router)
app.include_router(generation_router, prefix="/internal/v1")

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

START_TIME = time.time()

@app.get("/health", tags=["Monitoring"])
async def health_check():
    """Liveness probe: verifies service is running."""
    return {
        "status": "ok",
        "service": "testforge-ai-service",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": int(time.time() - START_TIME)
    }

@app.get("/ready", tags=["Monitoring"])
async def readiness_check():
    """Readiness probe: verifies service dependencies and configuration."""
    return {
        "status": "ready",
        "service": "testforge-ai-service",
        "llm_provider": settings.LLM_PROVIDER,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/internal/v1/ping", tags=["Internal"], dependencies=[Depends(verify_internal_key)])
async def internal_ping():
    """Authenticated internal sanity check."""
    return {
        "status": "authenticated",
        "service": "testforge-ai-service",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

