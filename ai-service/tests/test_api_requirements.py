import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings


@pytest.mark.asyncio
async def test_analyze_requirement_authenticated_success():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "text": "When a customer enters an incorrect password three consecutive times, the login form must be locked for 15 minutes and display an informative lockout message.",
            "requirement_id": "req_test_001",
            "version": 1
        }
        response = await client.post(
            "/internal/v1/requirements/analyze",
            json=payload,
            headers={"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["requirement_id"] == "req_test_001"
        assert data["version"] == 1
        assert "normalized_text" in data
        assert isinstance(data["actors"], list)
        assert isinstance(data["actions"], list)
        assert isinstance(data["entities"], list)
        assert isinstance(data["conditions"], list)
        assert isinstance(data["constraints"], list)
        assert isinstance(data["outcomes"], list)
        assert isinstance(data["ambiguity_findings"], list)
        assert isinstance(data["evidence_spans"], list)
        assert data["processing_version"] == "spacy-3.8-rule-v1"


@pytest.mark.asyncio
async def test_analyze_requirement_unauthorized():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/internal/v1/requirements/analyze",
            json={"text": "User must click submit button."},
            headers={"X-Internal-Service-Key": "wrong-secret-key"}
        )
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_analyze_requirement_missing_key():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/internal/v1/requirements/analyze",
            json={"text": "User must click submit button."}
        )
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_analyze_requirement_validation_error_too_short():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/internal/v1/requirements/analyze",
            json={"text": "bad"},
            headers={"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}
        )
        # FastApi/Pydantic validation failure returns 422
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_analyze_requirement_surfaces_ambiguity():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "text": "The portal should be intuitive and fast when loading several user profiles ASAP."
        }
        response = await client.post(
            "/internal/v1/requirements/analyze",
            json=payload,
            headers={"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}
        )

        assert response.status_code == 200
        data = response.json()
        findings = data["ambiguity_findings"]
        assert len(findings) > 0
        phrases = [f["phrase"].lower() for f in findings]
        assert any(p in phrases for p in ["intuitive", "fast", "several", "asap", "should"])

