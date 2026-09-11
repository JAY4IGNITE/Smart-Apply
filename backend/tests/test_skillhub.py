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

@pytest.mark.asyncio
async def test_academic_quiz_and_evaluation(async_client, make_user_and_token):
    _, token = await make_user_and_token("quiz_student@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch quiz questions
    res = await async_client.get("/api/skills/assess/quiz?skill=Operating+Systems", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "questions" in data
    assert len(data["questions"]) >= 1
    q1 = data["questions"][0]
    assert "question" in q1
    assert "options" in q1
    assert len(q1["options"]) == 4

    # Submit quiz answers
    submit_payload = {
        "skill": "Operating Systems",
        "questions": data["questions"],
        "answers": {str(q["id"]): q.get("correct_index", 0) for q in data["questions"]}
    }
    submit_res = await async_client.post("/api/skills/assess/submit-quiz", json=submit_payload, headers=headers)
    assert submit_res.status_code == 200
    eval_data = submit_res.json()
    assert eval_data["score"] == 100
    assert eval_data["correct_count"] == len(data["questions"])
    assert "academic_grade" in eval_data

@pytest.mark.asyncio
async def test_academic_roadmap_generation(async_client, make_user_and_token):
    _, token = await make_user_and_token("roadmap_student@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    res = await async_client.post("/api/skills/roadmap/generate?target_career=AI%20Engineer", headers=headers)
    assert res.status_code == 200
    roadmap = res.json()
    assert "milestones" in roadmap
    assert len(roadmap["milestones"]) >= 3

