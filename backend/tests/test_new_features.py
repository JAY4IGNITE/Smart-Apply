import pytest
from app.services import ai_service

@pytest.mark.asyncio
async def test_generate_cover_letter_with_tone_and_metadata():
    resume = "Candidate: Alex Mercer. 6 years Python, PyTorch, CUDA, distributed systems, published at NeurIPS."
    jd = "Seeking Staff AI Systems Engineer for low-latency inference scaling at Anthropic."
    letter = await ai_service.generate_cover_letter(
        resume_text=resume,
        job_description=jd,
        tone="Deep Tech & Architecture",
        company_name="Anthropic",
        role_title="Staff AI Systems Engineer"
    )
    assert isinstance(letter, str)
    assert len(letter.strip()) > 100
    # Check that it produces coherent text without raw markdown code fences
    assert "```" not in letter

@pytest.mark.asyncio
async def test_suggest_projects_functional():
    projects = await ai_service.suggest_projects(
        skills="Go, Docker, Kafka, Redis",
        time_commitment="10 hours a week",
        interests="High-throughput distributed systems"
    )
    assert isinstance(projects, list)
    assert len(projects) > 0
    first = projects[0]
    assert "title" in first
    assert "description" in first
    assert "key_technologies" in first

@pytest.mark.asyncio
async def test_generate_project_roadmap_functional():
    project = {
        "title": "Distributed Task Scheduler",
        "description": "An event-driven distributed task execution engine with raft consensus",
        "key_technologies": ["Go", "Kafka", "Docker", "Redis"]
    }
    preferences = {
        "Preferred Database": "PostgreSQL",
        "Preferred Hosting": "Render",
        "Team Size": "Solo Engineer",
        "Target Audience": "B2B Developers",
        "Monetization Strategy": "Open Source",
        "Additional Requirements": "Clean tests and metrics"
    }
    result = await ai_service.generate_project_roadmap(project, preferences)
    assert isinstance(result, dict)
    phases = result.get("phases", [])
    assert isinstance(phases, list)
    assert len(phases) > 0
    first_phase = phases[0]
    assert "phase_number" in first_phase
    assert "title" in first_phase
    assert "tasks" in first_phase
