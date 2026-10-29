import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings

@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "testforge-ai-service"
        assert "timestamp" in data
        assert "uptime_seconds" in data

@pytest.mark.asyncio
async def test_ready_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"
        assert data["service"] == "testforge-ai-service"
        assert data["llm_provider"] == settings.LLM_PROVIDER

@pytest.mark.asyncio
async def test_internal_ping_unauthorized():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/internal/v1/ping")
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_internal_ping_authorized():
    transport = ASGITransport(app=app)
    headers = {"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/internal/v1/ping", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "authenticated"

