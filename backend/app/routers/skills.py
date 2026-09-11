from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.models.user import User
from app.models.resume import Resume
from app.models.interview_report import InterviewReport
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
from app.middleware.auth_middleware import get_current_user
from app.services import ai_service

router = APIRouter(prefix="/api/skills", tags=["skills"])

# ── Initial Curated Data Seeders ──
CURATED_CAREERS = [
    {
        "slug": "software-engineer",
        "title": "Software Engineer",
        "category": "Core Engineering",
        "description": "Designs, develops, tests, and maintains scalable software applications and core algorithms.",
        "average_salary": "$125,000",
        "growth_rate": "+22% (High Demand)",
        "required_skills": ["Data Structures & Algorithms", "Python", "Java", "System Design", "SQL", "Git", "Docker"],
        "interview_topics": ["Big-O Complexity", "Concurrency & Threading", "Distributed Systems", "RESTful Architecture"],
        "certifications": ["AWS Certified Developer", "Oracle Certified Associate Java"],
    },
    {
        "slug": "full-stack-developer",
        "title": "Full Stack Developer",
        "category": "Web & Cloud",
        "description": "Architects end-to-end web applications covering responsive user interfaces, robust APIs, and databases.",
        "average_salary": "$118,000",
        "growth_rate": "+24% (Very High)",
        "required_skills": ["React", "TypeScript", "Node.js", "SQL", "PostgreSQL", "REST APIs", "Tailwind CSS", "Git"],
        "interview_topics": ["State Management", "SSR vs CSR", "Database Indexing & Transactions", "API Security & OAuth"],
        "certifications": ["Meta Front-End Developer", "AWS Certified Solutions Architect"],
    },
    {
        "slug": "ai-engineer",
        "title": "AI / ML Engineer",
        "category": "Artificial Intelligence",
        "description": "Builds and deploys machine learning models, LLM agents, RAG pipelines, and deep neural architectures.",
        "average_salary": "$145,000",
        "growth_rate": "+38% (Extreme Growth)",
        "required_skills": ["Python", "PyTorch", "LLMs & Prompt Engineering", "Vector Databases", "FastAPI", "Docker", "Data Analysis"],
        "interview_topics": ["Transformer Architectures", "RAG Systems", "Fine-Tuning vs RAG", "Model Quantization & Inference Scaling"],
        "certifications": ["TensorFlow Developer Certificate", "NVIDIA Deep Learning Institute"],
    },
    {
        "slug": "devops-engineer",
        "title": "DevOps & Cloud Engineer",
        "category": "Cloud & Infrastructure",
        "description": "Automates CI/CD pipelines, container orchestration, cloud provisioning, and site reliability.",
        "average_salary": "$132,000",
        "growth_rate": "+28% (High Demand)",
        "required_skills": ["Linux", "Docker", "Kubernetes", "AWS", "Terraform", "CI/CD Pipelines", "Bash/Python Scripting"],
        "interview_topics": ["Infrastructure as Code", "Kubernetes Pod Lifecycle", "Zero-Downtime Deployments", "Observability & Metrics"],
        "certifications": ["CKA (Certified Kubernetes Administrator)", "AWS Solutions Architect Associate"],
    },
    {
        "slug": "data-scientist",
        "title": "Data Scientist & Analyst",
        "category": "Data Science",
        "description": "Extracts actionable predictive insights, builds statistical models, and designs data visualization dashboards.",
        "average_salary": "$122,000",
        "growth_rate": "+20% (High Demand)",
        "required_skills": ["Python", "SQL", "Pandas & NumPy", "Machine Learning", "Statistical Modeling", "Data Visualization", "Tableau/PowerBI"],
        "interview_topics": ["Hypothesis Testing", "A/B Testing Methodologies", "Feature Engineering", "Regression vs Classification"],
        "certifications": ["Google Data Analytics Professional Certificate", "IBM Data Science Professional"],
    },
    {
        "slug": "cybersecurity-engineer",
        "title": "Cybersecurity Specialist",
        "category": "Security & Defense",
        "description": "Protects digital systems, networks, and applications against vulnerabilities, intrusions, and breaches.",
        "average_salary": "$128,000",
        "growth_rate": "+32% (Critical Demand)",
        "required_skills": ["Network Protocols", "Penetration Testing", "Linux", "Application Security (OWASP)", "Cryptography", "Python"],
        "interview_topics": ["OWASP Top 10", "TLS/SSL Handshake", "Zero Trust Architecture", "Incident Response Protocols"],
        "certifications": ["CompTIA Security+", "Certified Ethical Hacker (CEH)"],
    },
]

CURATED_SKILL_CATALOG = [
    {"name": "Python", "category": "Languages", "description": "High-level programming language for backend, AI, and scripting.", "typical_roles": ["Software Engineer", "AI Engineer", "Data Scientist"]},
    {"name": "JavaScript", "category": "Languages", "description": "Core language of the web for dynamic frontend and backend runtimes.", "typical_roles": ["Full Stack Developer", "Frontend Developer"]},
    {"name": "TypeScript", "category": "Languages", "description": "Typed superset of JavaScript providing scale and type safety.", "typical_roles": ["Full Stack Developer", "Frontend Developer", "Software Engineer"]},
    {"name": "React", "category": "Frontend", "description": "Component-based UI library for modern web applications.", "typical_roles": ["Frontend Developer", "Full Stack Developer"]},
    {"name": "Node.js", "category": "Backend", "description": "Asynchronous event-driven JavaScript backend runtime environment.", "typical_roles": ["Backend Developer", "Full Stack Developer"]},
    {"name": "FastAPI", "category": "Backend", "description": "Modern high-performance Python web framework for asynchronous APIs.", "typical_roles": ["Backend Developer", "AI Engineer"]},
    {"name": "SQL", "category": "Data & Storage", "description": "Standard declarative language for relational database queries and transactions.", "typical_roles": ["Software Engineer", "Data Scientist", "Full Stack Developer"]},
    {"name": "PostgreSQL", "category": "Data & Storage", "description": "Powerful open-source object-relational database system.", "typical_roles": ["Backend Developer", "Full Stack Developer"]},
    {"name": "MongoDB", "category": "Data & Storage", "description": "NoSQL document database for agile, high-throughput application data.", "typical_roles": ["Full Stack Developer", "Backend Developer"]},
    {"name": "Data Structures & Algorithms", "category": "Core CS", "description": "Foundational computing logic: trees, graphs, sorting, dynamic programming.", "typical_roles": ["Software Engineer", "AI Engineer"]},
    {"name": "System Design", "category": "Core CS", "description": "High-level distributed architecture, caching, queues, load balancing, sharding.", "typical_roles": ["Software Engineer", "Backend Developer"]},
    {"name": "Git", "category": "DevOps & Tools", "description": "Distributed version control system for tracking source code changes.", "typical_roles": ["Software Engineer", "All Engineering Roles"]},
    {"name": "Docker", "category": "DevOps & Tools", "description": "Platform for developing, shipping, and running applications in containers.", "typical_roles": ["DevOps Engineer", "Backend Developer", "Software Engineer"]},
    {"name": "Kubernetes", "category": "DevOps & Tools", "description": "Production-grade container orchestration and automated scaling.", "typical_roles": ["DevOps Engineer", "Cloud Engineer"]},
    {"name": "AWS", "category": "Cloud", "description": "Comprehensive cloud computing platform offering compute, storage, and networking.", "typical_roles": ["Cloud Engineer", "DevOps Engineer", "Full Stack Developer"]},
    {"name": "PyTorch", "category": "Data & AI", "description": "Deep learning framework for tensor computation and neural network models.", "typical_roles": ["AI Engineer", "Data Scientist"]},
    {"name": "LLMs & Prompt Engineering", "category": "Data & AI", "description": "Generative AI models, structured prompts, embeddings, and RAG architectures.", "typical_roles": ["AI Engineer", "Software Engineer"]},
]


# ── Schemas ──
class AddSkillRequest(BaseModel):
    skill_name: str
    proficiency: int = Field(default=60, ge=0, le=100)
    evidence_source: str = "manual"

class AssessmentSubmission(BaseModel):
    target_career: str
    answers: Dict[str, int] = Field(default_factory=dict)  # skill_name -> self-rating / quiz score (0-100)

class ProjectCreateRequest(BaseModel):
    title: str
    description: str
    technologies: List[str] = Field(default_factory=list)
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    featured: bool = False

class CertCreateRequest(BaseModel):
    title: str
    issuer: str
    issue_date: Optional[str] = None
    credential_url: Optional[str] = None
    skills: List[str] = Field(default_factory=list)

class RoadmapTaskToggle(BaseModel):
    task_id: str
    completed: bool

class QuizSubmitRequest(BaseModel):
    skill: str
    questions: List[Dict[str, Any]]
    answers: Dict[str, int]  # question_id string -> option index

class AcademicTutorRequest(BaseModel):
    subject_or_skill: str
    question_or_topic: str
    academic_level: Optional[str] = "Undergraduate Engineering / B.Tech"


# ── Endpoints ──

@router.get("/careers")
async def list_careers():
    """Retrieve all available career tracks."""
    careers = await CareerPath.find_all().to_list()
    if not careers:
        # Seed initial curated career tracks
        for item in CURATED_CAREERS:
            await CareerPath(**item).insert()
        careers = await CareerPath.find_all().to_list()
    return careers


@router.get("/careers/{slug}")
async def get_career_detail(slug: str):
    """Retrieve deep requirements and roadmap for a specific career track."""
    career = await CareerPath.find_one(CareerPath.slug == slug)
    if not career:
        # Fallback to in-memory definition
        for c in CURATED_CAREERS:
            if c["slug"] == slug:
                return c
        raise HTTPException(status_code=404, detail="Career track not found")
    return career


@router.get("/catalog")
async def get_skill_catalog():
    """Retrieve full catalog of supported technical skills."""
    skills = await Skill.find_all().to_list()
    if not skills:
        for s in CURATED_SKILL_CATALOG:
            await Skill(**s).insert()
        skills = await Skill.find_all().to_list()
    return skills


@router.get("/my-skills")
async def get_student_skills(user: User = Depends(get_current_user)):
    """Retrieve current student's logged skills and proficiencies."""
    items = await StudentSkill.find(StudentSkill.user_id == user.id).to_list()
    if not items and user.skills:
        # Initialize student skills from user profile if not yet in collection
        for s in user.skills:
            item = StudentSkill(user_id=user.id, skill_name=s, proficiency=65, evidence_source="profile")
            await item.insert()
        items = await StudentSkill.find(StudentSkill.user_id == user.id).to_list()
    return items


@router.post("/my-skills")
async def add_or_update_student_skill(body: AddSkillRequest, user: User = Depends(get_current_user)):
    """Add or update proficiency in a student skill."""
    existing = await StudentSkill.find_one(
        StudentSkill.user_id == user.id,
        StudentSkill.skill_name == body.skill_name
    )
    if existing:
        existing.proficiency = body.proficiency
        existing.evidence_source = body.evidence_source
        existing.last_updated = datetime.utcnow()
        await existing.save()
        return existing
    else:
        new_skill = StudentSkill(
            user_id=user.id,
            skill_name=body.skill_name,
            proficiency=body.proficiency,
            evidence_source=body.evidence_source
        )
        await new_skill.insert()
        # Also ensure it's in user.skills array
        if body.skill_name not in user.skills:
            user.skills.append(body.skill_name)
            await user.save()
        return new_skill


@router.post("/assess")
async def run_skill_assessment(body: AssessmentSubmission, user: User = Depends(get_current_user)):
    """Analyze current student proficiency against target career requirements and compute gap priorities."""
    career = await CareerPath.find_one(CareerPath.title == body.target_career)
    if not career:
        for c in CURATED_CAREERS:
            if c["title"].lower() == body.target_career.lower() or c["slug"].lower() == body.target_career.lower():
                career = c
                break
    
    required = career["required_skills"] if isinstance(career, dict) else (career.required_skills if career else ["Python", "SQL", "Git"])
    
    # Existing student skills
    student_skills = await StudentSkill.find(StudentSkill.user_id == user.id).to_list()
    skill_map = {s.skill_name.lower(): s.proficiency for s in student_skills}
    # Overlay any answers from current assessment
    for k, v in body.answers.items():
        skill_map[k.lower()] = v
        # Persist updated proficiency
        existing = await StudentSkill.find_one(StudentSkill.user_id == user.id, StudentSkill.skill_name == k)
        if existing:
            existing.proficiency = v
            existing.evidence_source = "assessment"
            existing.last_updated = datetime.utcnow()
            await existing.save()
        else:
            await StudentSkill(user_id=user.id, skill_name=k, proficiency=v, evidence_source="assessment").insert()

    gaps = []
    total_score = 0
    skills_breakdown = {}

    for req in required:
        current_prof = skill_map.get(req.lower(), 20)
        skills_breakdown[req] = current_prof
        total_score += current_prof
        delta = 85 - current_prof
        if delta > 35:
            priority = "High Priority"
        elif delta > 15:
            priority = "Medium Priority"
        else:
            priority = "Low Priority"
        
        gaps.append({
            "skill": req,
            "current": current_prof,
            "target": 85,
            "priority": priority,
            "status": "Needs Attention" if delta > 15 else "On Track",
            "recommended_actions": [f"Learn {req} Core Concepts", f"Build a {req} Project Milestone", f"Take {req} Practice Quiz"]
        })

    overall_score = int(total_score / max(len(required), 1))
    
    # Sort gaps by priority
    priority_order = {"High Priority": 0, "Medium Priority": 1, "Low Priority": 2}
    gaps.sort(key=lambda g: priority_order.get(g["priority"], 3))

    recommendations = [
        f"Focus first on high-priority gap: {gaps[0]['skill'] if gaps else 'System Design'}",
        "Complete 1 portfolio project demonstrating full-stack integration",
        "Schedule a mock interview in Voice Studio to practice role-specific technical questions"
    ]

    record = SkillAssessmentRecord(
        user_id=user.id,
        target_career=body.target_career,
        overall_score=overall_score,
        skills_breakdown=skills_breakdown,
        skill_gaps=gaps,
        recommendations=recommendations,
        created_at=datetime.utcnow()
    )
    await record.insert()

    return {
        "assessment_id": str(record.id),
        "target_career": body.target_career,
        "overall_score": overall_score,
        "skills_breakdown": skills_breakdown,
        "skill_gaps": gaps,
        "recommendations": recommendations,
        "created_at": record.created_at
    }


@router.get("/gaps")
async def get_latest_skill_gaps(target_career: Optional[str] = None, user: User = Depends(get_current_user)):
    """Retrieve the latest skill assessment and priority gap matrix."""
    query = SkillAssessmentRecord.find(SkillAssessmentRecord.user_id == user.id)
    if target_career:
        query = query.find(SkillAssessmentRecord.target_career == target_career)
    record = await query.sort("-created_at").first_or_none()
    
    if not record:
        # Generate default gap evaluation if no test has been taken yet
        target = target_career or "Software Engineer"
        sim_body = AssessmentSubmission(target_career=target, answers={})
        return await run_skill_assessment(sim_body, user)

    return {
        "assessment_id": str(record.id),
        "target_career": record.target_career,
        "overall_score": record.overall_score,
        "skills_breakdown": record.skills_breakdown,
        "skill_gaps": record.skill_gaps,
        "recommendations": record.recommendations,
        "created_at": record.created_at
    }


@router.get("/assess/quiz")
async def get_academic_quiz(
    skill: str = "Data Structures & Algorithms",
    difficulty: str = "Intermediate",
    user: User = Depends(get_current_user)
):
    """
    Generate an academic multiple-choice assessment quiz using NVIDIA NIM.
    Generates 5 questions adhering to university CS and engineering curricula.
    """
    questions = await ai_service.generate_academic_quiz(skill=skill, difficulty=difficulty, num_questions=5)
    return {
        "skill": skill,
        "difficulty": difficulty,
        "questions": questions
    }


@router.post("/assess/submit-quiz")
async def submit_academic_quiz(
    body: QuizSubmitRequest,
    user: User = Depends(get_current_user)
):
    """
    Grade and evaluate an academic quiz submission using NVIDIA NIM,
    returning score, detailed academic explanations, and updating student skill proficiency.
    """
    result = await ai_service.evaluate_academic_quiz_answers(
        skill=body.skill,
        questions=body.questions,
        user_answers=body.answers
    )

    # Persist the verified score into StudentSkill
    prof_score = result.get("score", 60)
    existing_skill = await StudentSkill.find_one(
        StudentSkill.user_id == user.id,
        StudentSkill.skill_name == body.skill
    )
    if existing_skill:
        # Blend previous rating with quiz outcome (favoring verified quiz)
        existing_skill.proficiency = int(round((existing_skill.proficiency * 0.3) + (prof_score * 0.7)))
        existing_skill.evidence_source = "nvidia_academic_quiz"
        existing_skill.last_updated = datetime.utcnow()
        await existing_skill.save()
    else:
        new_skill = StudentSkill(
            user_id=user.id,
            skill_name=body.skill,
            proficiency=prof_score,
            evidence_source="nvidia_academic_quiz"
        )
        await new_skill.insert()
        if body.skill not in user.skills:
            user.skills.append(body.skill)
            await user.save()

    return result


@router.post("/academic/tutor")
async def academic_tutor_query(
    body: AcademicTutorRequest,
    user: User = Depends(get_current_user)
):
    """
    Academic concept tutor powered by NVIDIA NIM.
    Generates university-level answers with formal proofs, complexity, and textbook citations.
    """
    prompt = f"""You are a distinguished university professor of computer science and engineering.
Answer the following student question according to university academic syllabus and rigorous standards.

Subject / Skill: {body.subject_or_skill}
Academic Level: {body.academic_level or 'Undergraduate B.Tech / Computer Science'}
Student Question / Concept:
{body.question_or_topic}

Guidelines for your response:
1. Formal Definition & Conceptual Overview: State the formal academic definition clearly.
2. Underlying Mathematical / Algorithmic Foundations: Include equations, state machines, or algorithmic complexity (Big-O time and space) where appropriate.
3. Concrete Code / Architecture Example: Provide an illustrative, well-commented snippet or architectural diagram.
4. Academic Exam / Viva Tip: Highlight common misconceptions, examiner expectations, or university viva questions.
5. Standard Textbook References: Cite standard literature (e.g., Cormen CLRS, Silberschatz, Tanenbaum, Russell & Norvig).
"""
    reply = await ai_service.chat_completion([{"role": "user", "content": prompt}])
    return {
        "subject_or_skill": body.subject_or_skill,
        "academic_level": body.academic_level,
        "answer": reply
    }


@router.post("/roadmap/generate")
async def generate_personalized_roadmap(target_career: str, user: User = Depends(get_current_user)):
    """Generate a step-by-step personalized learning roadmap based on career goal and gaps using NVIDIA NIM."""
    ai_generated = await ai_service.generate_academic_roadmap(
        target_career=target_career,
        academic_level="Undergraduate B.Tech / Computer Science & Engineering",
        user_skills=user.skills
    )

    milestones = ai_generated.get("milestones", [])
    completed_tasks = ["t1", "t2"]

    # Delete existing roadmap for target_career if updating, or update in place
    existing = await PersonalizedRoadmap.find_one(
        PersonalizedRoadmap.user_id == user.id,
        PersonalizedRoadmap.target_career == target_career
    )
    if existing:
        existing.milestones = milestones
        existing.title = ai_generated.get("title", f"{target_career} Academic & Career Master Roadmap")
        existing.created_at = datetime.utcnow()
        await existing.save()
        return existing

    roadmap = PersonalizedRoadmap(
        user_id=user.id,
        target_career=target_career,
        title=ai_generated.get("title", f"{target_career} Academic & Career Master Roadmap"),
        milestones=milestones,
        completed_tasks=completed_tasks,
        created_at=datetime.utcnow()
    )
    await roadmap.insert()
    return roadmap


@router.get("/roadmap")
async def get_student_roadmap(user: User = Depends(get_current_user)):
    """Retrieve the student's active roadmap, generating one if not yet present."""
    roadmap = await PersonalizedRoadmap.find(PersonalizedRoadmap.user_id == user.id).sort("-created_at").first_or_none()
    if not roadmap:
        return await generate_personalized_roadmap("Software Engineer", user)
    return roadmap


@router.put("/roadmap/task")
async def toggle_roadmap_task(body: RoadmapTaskToggle, user: User = Depends(get_current_user)):
    """Toggle completion status of a roadmap task."""
    roadmap = await PersonalizedRoadmap.find(PersonalizedRoadmap.user_id == user.id).sort("-created_at").first_or_none()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    if body.completed:
        if body.task_id not in roadmap.completed_tasks:
            roadmap.completed_tasks.append(body.task_id)
    else:
        if body.task_id in roadmap.completed_tasks:
            roadmap.completed_tasks.remove(body.task_id)

    # Also update milestone object task status
    for m in roadmap.milestones:
        for t in m.get("tasks", []):
            if t.get("id") == body.task_id:
                t["completed"] = body.completed

    await roadmap.save()
    return {"status": "ok", "completed_tasks": roadmap.completed_tasks}


# ── Student Portfolio Projects ──

@router.get("/portfolio")
async def list_portfolio_projects(user: User = Depends(get_current_user)):
    """List all portfolio projects for the student."""
    projects = await StudentProject.find(StudentProject.user_id == user.id).sort("-created_at").to_list()
    return projects


@router.post("/portfolio")
async def create_portfolio_project(body: ProjectCreateRequest, user: User = Depends(get_current_user)):
    """Create a new portfolio project."""
    project = StudentProject(
        user_id=user.id,
        title=body.title,
        description=body.description,
        technologies=body.technologies,
        github_url=body.github_url,
        live_url=body.live_url,
        featured=body.featured,
        created_at=datetime.utcnow()
    )
    await project.insert()
    return project


@router.delete("/portfolio/{project_id}")
async def delete_portfolio_project(project_id: str, user: User = Depends(get_current_user)):
    """Delete a portfolio project."""
    from bson import ObjectId
    try:
        oid = ObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project ID")
    project = await StudentProject.find_one(StudentProject.id == oid, StudentProject.user_id == user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await project.delete()
    return {"status": "deleted"}


# ── Certifications ──

@router.get("/certifications")
async def list_certifications(user: User = Depends(get_current_user)):
    """List verified certifications for student."""
    certs = await StudentCertification.find(StudentCertification.user_id == user.id).sort("-created_at").to_list()
    return certs


@router.post("/certifications")
async def create_certification(body: CertCreateRequest, user: User = Depends(get_current_user)):
    """Add a new verified certification."""
    cert = StudentCertification(
        user_id=user.id,
        title=body.title,
        issuer=body.issuer,
        issue_date=body.issue_date,
        credential_url=body.credential_url,
        skills=body.skills,
        created_at=datetime.utcnow()
    )
    await cert.insert()
    return cert


@router.delete("/certifications/{cert_id}")
async def delete_certification(cert_id: str, user: User = Depends(get_current_user)):
    """Delete a certification."""
    from bson import ObjectId
    try:
        oid = ObjectId(cert_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid certification ID")
    cert = await StudentCertification.find_one(StudentCertification.id == oid, StudentCertification.user_id == user.id)
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")
    await cert.delete()
    return {"status": "deleted"}


# ── Composite Career Readiness Score Engine ──

@router.get("/readiness")
async def get_career_readiness(target_career: Optional[str] = "Software Engineer", user: User = Depends(get_current_user)):
    """
    Computes an explainable, objective SkillHub Career Readiness index (0-100).
    Components:
    - Skills & Assessment Proficiency (30%)
    - Portfolio Projects (25%)
    - Resume ATS Optimization (20%)
    - Live Mock Interview History (15%)
    - GitHub & Evidence Linkage (10%)
    """
    # 1. Skills score
    assessment = await SkillAssessmentRecord.find(SkillAssessmentRecord.user_id == user.id).sort("-created_at").first_or_none()
    skills_score = assessment.overall_score if assessment else (min(len(user.skills) * 12, 75) if user.skills else 45)

    # 2. Projects score
    projects = await StudentProject.find(StudentProject.user_id == user.id).to_list()
    projects_score = min(len(projects) * 30 + (10 if any(p.github_url for p in projects) else 0), 100)
    if not projects and user.experience:
        projects_score = 60

    # 3. Resume ATS score
    resumes = await Resume.find(Resume.user_id == user.id).to_list()
    ats_scores = [r.ats_score for r in resumes if r.ats_score is not None]
    resume_score = int(sum(ats_scores) / len(ats_scores)) if ats_scores else (75 if resumes else 30)

    # 4. Interview score
    interviews = await InterviewReport.find(InterviewReport.user_id == str(user.id)).to_list()
    interview_scores = [i.final_score for i in interviews if getattr(i, 'final_score', None)]
    interview_score = int(sum(interview_scores) / len(interview_scores)) if interview_scores else (40 if len(interviews) > 0 else 25)

    # 5. Proof / GitHub score
    github_score = 80 if user.github_url else 20
    if len(await StudentCertification.find(StudentCertification.user_id == user.id).to_list()) > 0:
        github_score = min(github_score + 20, 100)

    # Weighted Composite
    overall = int(
        (skills_score * 0.30) +
        (projects_score * 0.25) +
        (resume_score * 0.20) +
        (interview_score * 0.15) +
        (github_score * 0.10)
    )

    breakdown = {
        "skills": skills_score,
        "projects": projects_score,
        "resume_ats": resume_score,
        "interview": interview_score,
        "proof_github": github_score
    }

    # Summary text
    if overall >= 80:
        summary = "Outstanding Career Readiness! You are well-positioned for top-tier competitive software engineering roles."
    elif overall >= 65:
        summary = "Strong Technical Foundation! Narrow down your remaining high-priority skill gaps to reach peak readiness."
    else:
        summary = "Active Growth Phase. Follow your personalized roadmap and complete portfolio projects to boost your readiness."

    # Record historical score
    readiness_doc = CareerReadinessScore(
        user_id=user.id,
        target_career=target_career or "Software Engineer",
        overall_score=overall,
        components=breakdown,
        breakdown_text=summary,
        calculated_at=datetime.utcnow()
    )
    await readiness_doc.insert()

    return {
        "overall_score": overall,
        "target_career": target_career,
        "components": breakdown,
        "summary": summary,
        "calculated_at": readiness_doc.calculated_at
    }
