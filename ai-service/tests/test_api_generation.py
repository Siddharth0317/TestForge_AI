import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings


@pytest.mark.asyncio
async def test_generation_api_unauthorized():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/internal/v1/test-cases/generate",
            json={
                "requirement_id": "req-1",
                "requirement_text": "User must enter password with at least 8 chars."
            }
        )
        assert resp.status_code == 401


@pytest.mark.asyncio
async def test_generation_api_success():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/internal/v1/test-cases/generate",
            headers={"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY},
            json={
                "requirement_id": "req-100",
                "requirement_version": 1,
                "requirement_text": "The user must enter valid credentials to access the system dashboard.",
                "ml_category": "authentication",
                "scenario_types": ["positive", "negative"],
                "provider_override": "mock",
                "max_cases": 3
            }
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "completed"
        assert data["provider"] == "mock"
        assert data["model"] == "mock-llm-v1"
        assert data["schema_version"] == "1.0"
        assert len(data["candidates"]) >= 1
        first_candidate = data["candidates"][0]
        assert first_candidate["requirement_id"] == "req-100"
        assert first_candidate["schema_version"] == "1.0"
        assert len(first_candidate["steps"]) >= 1
