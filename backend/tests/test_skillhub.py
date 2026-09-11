import pytest

@pytest.mark.asyncio
async def test_careers_list_public(async_client):
    res = await async_client.get("/api/skills/careers")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    slugs = [c["slug"] for c in data]
    assert "software-engineer" in slugs
    assert "ai-engineer" in slugs

@pytest.mark.asyncio
async def test_skill_catalog_public(async_client):
    res = await async_client.get("/api/skills/catalog")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 10
    names = [s["name"] for s in data]
    assert "Python" in names
    assert "React" in names
