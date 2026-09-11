from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.config import settings
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

_client: AsyncIOMotorClient | None = None


async def init_db() -> None:
    """Initialize Motor client and Beanie ODM."""
    global _client
    raw_uri = (settings.MONGODB_URI or "").strip().strip('"').strip("'")
    if not raw_uri or not (raw_uri.startswith("mongodb://") or raw_uri.startswith("mongodb+srv://")):
        raise ValueError(
            f"Invalid MONGODB_URI: Connection string must start with 'mongodb://' or 'mongodb+srv://'. "
            f"Current value: {repr(raw_uri)}. Please ensure MONGODB_URI is set properly in your Render environment variables without surrounding quotes."
        )
    _client = AsyncIOMotorClient(raw_uri)
    database = _client[settings.MONGODB_DB_NAME]
    await init_beanie(
        database=database,
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
        allow_index_dropping=True,
    )


async def close_db() -> None:
    """Close the Motor client connection."""
    global _client
    if _client:
        _client.close()
        _client = None
