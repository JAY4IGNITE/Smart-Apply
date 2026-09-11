from datetime import datetime
from typing import Any, Dict, List, Optional
from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field


class CareerPath(Document):
    """Curated career paths with required skills and metadata."""
    slug: Indexed(str, unique=True)
    title: str
    category: str = "Software Engineering"
    description: str = ""
    average_salary: str = "$120,000"
    growth_rate: str = "+25% (High Demand)"
    required_skills: List[str] = Field(default_factory=list)
    recommended_projects: List[Dict[str, Any]] = Field(default_factory=list)
    interview_topics: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)

    class Settings:
        name = "career_paths"
        indexes = ["category"]


class Skill(Document):
    """Master skill taxonomy."""
    name: Indexed(str, unique=True)
    category: str = "Core CS"
    description: str = ""
    typical_roles: List[str] = Field(default_factory=list)

    class Settings:
        name = "skills"
        indexes = ["category"]


class StudentSkill(Document):
    """Student's assessed or reported proficiency in a skill."""
    user_id: Indexed(PydanticObjectId)
    skill_name: str
    proficiency: int = 50  # 0 to 100
    evidence_source: str = "manual"  # 'assessment', 'project', 'github', 'manual'
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "student_skills"
        indexes = [
            [("user_id", 1), ("skill_name", 1)]
        ]


class SkillAssessmentRecord(Document):
    """Historical diagnostic test results and skill gap evaluations."""
    user_id: Indexed(PydanticObjectId)
    target_career: str
    overall_score: int
    skills_breakdown: Dict[str, int] = Field(default_factory=dict)
    skill_gaps: List[Dict[str, Any]] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "skill_assessments"
        indexes = ["created_at"]


class PersonalizedRoadmap(Document):
    """Personalized learning journey generated for student."""
    user_id: Indexed(PydanticObjectId)
    target_career: str
    title: str
    milestones: List[Dict[str, Any]] = Field(default_factory=list)
    completed_tasks: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "roadmaps"
        indexes = ["created_at"]


class StudentProject(Document):
    """Student portfolio project linked to skills and evidence."""
    user_id: Indexed(PydanticObjectId)
    title: str
    description: str
    technologies: List[str] = Field(default_factory=list)
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    featured: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "student_projects"
        indexes = [
            [("user_id", 1), ("featured", -1)]
        ]


class StudentCertification(Document):
    """Student certifications and credentials."""
    user_id: Indexed(PydanticObjectId)
    title: str
    issuer: str
    issue_date: Optional[str] = None
    credential_url: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "certifications"
        indexes = ["created_at"]


class CareerReadinessScore(Document):
    """Composite Career Readiness score calculation."""
    user_id: Indexed(PydanticObjectId)
    target_career: str
    overall_score: int
    components: Dict[str, int] = Field(default_factory=dict)  # skills, projects, resume, github, interview
    breakdown_text: str = ""
    calculated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "career_readiness_scores"
        indexes = ["calculated_at"]
