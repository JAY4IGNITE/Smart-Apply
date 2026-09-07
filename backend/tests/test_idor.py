import pytest

@pytest.mark.asyncio
async def test_user_cannot_access_another_users_resume(async_client, make_user_and_token, make_resume):
    user_a, token_a = await make_user_and_token("a@example.com")
    user_b, _ = await make_user_and_token("b@example.com")
    resume = await make_resume(owner=user_b)

    resp = await async_client.post(
        "/api/jobs/matches",
        data={"query": "engineer", "resume_id": str(resume.id)},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert resp.status_code in (400, 404, 403, 401)  # must NOT succeed
