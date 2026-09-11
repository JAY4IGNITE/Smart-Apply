import re
from typing import Any, Dict, List, Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.models.user import User
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/github", tags=["github"])


class GitHubAnalyzeRequest(BaseModel):
    username_or_url: str


@router.post("/analyze")
async def analyze_github_profile(body: GitHubAnalyzeRequest, user: User = Depends(get_current_user)):
    """
    Analyzes public GitHub repositories for language distributions, activity,
    and portfolio project evidence.
    """
    raw = body.username_or_url.strip().rstrip("/")
    # Extract username if a full URL was provided
    if "github.com/" in raw:
        username = raw.split("github.com/")[-1].split("/")[0]
    else:
        username = raw

    if not username or not re.match(r"^[a-zA-Z0-9\-_]+$", username):
        raise HTTPException(status_code=400, detail="Invalid GitHub username format")

    user_api_url = f"https://api.github.com/users/{username}"
    repos_api_url = f"https://api.github.com/users/{username}/repos?sort=updated&per_page=30"

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            user_res = await client.get(user_api_url, headers={"User-Agent": "SkillHub-Platform"})
            if user_res.status_code == 404:
                raise HTTPException(status_code=404, detail="GitHub user not found")
            elif user_res.status_code != 200:
                raise HTTPException(status_code=502, detail="GitHub API service currently unreachable")
            user_data = user_res.json()

            repos_res = await client.get(repos_api_url, headers={"User-Agent": "SkillHub-Platform"})
            repos_data = repos_res.json() if repos_res.status_code == 200 else []
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Failed to connect to GitHub API: {str(e)}")

    # Aggregate languages & metrics
    languages: Dict[str, int] = {}
    total_stars = 0
    total_forks = 0
    analyzed_repos = []

    for r in repos_data:
        if r.get("fork"):
            continue  # Skip forked repositories to highlight original work
        lang = r.get("language")
        if lang:
            languages[lang] = languages.get(lang, 0) + 1
        stars = r.get("stargazers_count", 0)
        forks = r.get("forks_count", 0)
        total_stars += stars
        total_forks += forks

        analyzed_repos.append({
            "name": r.get("name"),
            "description": r.get("description") or "No description provided",
            "html_url": r.get("html_url"),
            "language": lang or "Mixed",
            "stars": stars,
            "forks": forks,
            "updated_at": r.get("updated_at"),
            "topics": r.get("topics", [])
        })

    total_repos_counted = sum(languages.values()) or 1
    language_breakdown = [
        {"language": l, "repo_count": count, "percentage": round((count / total_repos_counted) * 100, 1)}
        for l, count in sorted(languages.items(), key=lambda x: x[1], reverse=True)
    ]

    # Inferred skills evidence
    inferred_skills = []
    for l in language_breakdown[:5]:
        inferred_skills.append({
            "skill": l["language"],
            "confidence": min(50 + l["repo_count"] * 10, 95),
            "evidence": f"Detected across {l['repo_count']} original GitHub repositories"
        })

    # Save github_url on user if not already set
    if not user.github_url or username not in user.github_url:
        user.github_url = f"https://github.com/{username}"
        await user.save()

    return {
        "username": username,
        "avatar_url": user_data.get("avatar_url"),
        "public_repos": user_data.get("public_repos", 0),
        "followers": user_data.get("followers", 0),
        "total_stars": total_stars,
        "total_forks": total_forks,
        "languages": language_breakdown,
        "inferred_skills": inferred_skills,
        "top_repositories": analyzed_repos[:8]
    }
