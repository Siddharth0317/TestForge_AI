import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings


@pytest.mark.asyncio
async def test_predict_category_authenticated_success():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "text": "When a customer enters an incorrect password three consecutive times, the login form must be locked for 15 minutes.",
            "requirement_id": "req_101"
        }
        response = await client.post(
            "/internal/v1/classifier/predict",
            json=payload,
            headers={"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["requirement_id"] == "req_101"
        assert data["category"] == "authentication"
        assert 0.0 <= data["confidence"] <= 1.0
        assert data["model_version"] == "v1.0.0-baseline"
        assert isinstance(data["is_uncertain"], bool)
        assert isinstance(data["probabilities"], dict)
        assert len(data["probabilities"]) == 6


@pytest.mark.asyncio
async def test_predict_category_unauthorized():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/internal/v1/classifier/predict",
            json={"text": "User must enter email and password."},
            headers={"X-Internal-Service-Key": "invalid-key"}
        )
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_predict_category_missing_key():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/internal/v1/classifier/predict",
            json={"text": "User must enter email and password."}
        )
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_predict_category_validation_too_short():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/internal/v1/classifier/predict",
            json={"text": "hi"},
            headers={"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}
        )
        assert response.status_code == 422
