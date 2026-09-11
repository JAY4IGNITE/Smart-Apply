import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from mongomock_motor import AsyncMongoMockClient
from beanie import init_beanie

from app.main import app
from app.models.user import User
from app.models.resume import Resume
from app.models.interview_report import InterviewReport
from app.models.settings import SystemSettings
from app.models.api_metrics import APILog
from app.models.resume_template import ResumeTemplate
from app.models.skills import (
    CareerPath,
    Skill,
    StudentSkill,
    SkillAssessmentRecord,
    PersonalizedRoadmap,
    StudentProject,
    StudentCertification,
    CareerReadinessScore,
)

@pytest_asyncio.fixture(autouse=True)
async def test_db():
    client = AsyncMongoMockClient()
    await init_beanie(
        database=client["test_db"],
        document_models=[
            User,
            Resume,
            InterviewReport,
            SystemSettings,
            APILog,
            ResumeTemplate,
            CareerPath,
            Skill,
            StudentSkill,
            SkillAssessmentRecord,
            PersonalizedRoadmap,
            StudentProject,
            StudentCertification,
            CareerReadinessScore,
        ],
    )
    yield

@pytest_asyncio.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

from app.services.auth_service import create_access_token, hash_password

@pytest_asyncio.fixture
async def make_user_and_token():
    async def _make(email: str):
        user = User(
            email=email,
            hashed_password=hash_password("password"),
            full_name=f"User {email}",
            is_verified=True
        )
        await user.insert()
        token = create_access_token({"sub": user.email})
        return user, token
    return _make

@pytest_asyncio.fixture
async def make_resume():
    async def _make(owner: User):
        resume = Resume(
            user_id=owner.id,
            filename="resume.pdf",
            file_url="https://example.com/resume.pdf",
            extracted_text="Resume content",
            parsed_data={"skills": []},
        )
        await resume.insert()
        return resume
    return _make
