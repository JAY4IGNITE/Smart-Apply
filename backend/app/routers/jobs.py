from fastapi import APIRouter, Depends, HTTPException, Form, Request
from typing import Dict, Any, List, Optional
from beanie import PydanticObjectId
import logging

from app.models.resume import Resume
from app.models.user import User
from app.services import job_service, ai_service
from app.middleware.auth_middleware import get_current_user
from app.rate_limiter import limiter

logger = logging.getLogger("jobs-router")

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

@router.post("/matches")
@limiter.limit("20/minute")
async def get_job_matches(
    request: Request,
    query: str = Form(...),
    location: str = Form("us"),
    resume_id: Optional[str] = Form(None),
    user: User = Depends(get_current_user)
):
    """
    Search for jobs based on a query and score them against the user's resume.
    """
    clean_query = query.strip()
    if not clean_query:
        raise HTTPException(status_code=400, detail="Job search query is required.")

    # 1. Fetch Resume Context if available
    resume_text = ""
    if resume_id and resume_id.strip():
        try:
            resume = await Resume.get(PydanticObjectId(resume_id))
            if resume and resume.user_id == user.id:
                resume_text = resume.extracted_text or ""
        except Exception as e:
            logger.warning(f"Could not load resume {resume_id}: {e}")

    if not resume_text:
        # Fallback to user headline or title query
        resume_text = f"Role: {clean_query}\nCandidate: {user.full_name or 'Job Seeker'}\nHeadline: {user.headline or clean_query}"

    # 2. Fetch Live Jobs from Providers (Adzuna primary, JSearch secondary)
    raw_jobs = await job_service.search_jobs(clean_query, location)
    if not raw_jobs:
        return {"matches": []}

    # 3. Score Jobs using AI with baseline fallback
    try:
        scored_jobs = await ai_service.score_jobs_batch(resume_text, raw_jobs)
        return {"matches": scored_jobs}
    except Exception as e:
        logger.error(f"Error scoring jobs via LLM ({e}), applying baseline heuristic scores...")
        # Baseline heuristic fallback
        for idx, job in enumerate(raw_jobs):
            title_lower = job.get("title", "").lower()
            query_lower = clean_query.lower()
            if any(word in title_lower for word in query_lower.split() if len(word) > 2):
                score = 85 - (idx * 2)
                reason = f"High keyword and title relevance for {clean_query}."
            else:
                score = 70 - (idx * 2)
                reason = f"Complementary domain match for {clean_query}."
            job["match_score"] = max(50, score)
            job["match_reason"] = reason

        raw_jobs.sort(key=lambda x: x.get("match_score", 50), reverse=True)
        return {"matches": raw_jobs}
