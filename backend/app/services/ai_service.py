import asyncio
import json
import logging
import time
from typing import Any, Dict, List, Optional

import httpx
from openai import AsyncOpenAI
import openai

from app.config import settings
from app.models.api_metrics import APILog

logger = logging.getLogger(__name__)

_clients: Dict[str, AsyncOpenAI] = {}


def _parse_llm_json(content: str, fallback: Any) -> Any:
    """Safely parse JSON from LLM output, handling markdown fences and extraneous text."""
    if not content:
        return fallback
    content = content.strip()

    # If code fence exists anywhere, extract and try parsing blocks
    if "```" in content:
        try:
            parts = content.split("```")
            for p in parts[1::2]:
                block = p.split("\n", 1)[1] if "\n" in p else p
                try:
                    return json.loads(block.strip())
                except Exception:
                    pass
        except Exception:
            pass

    # Direct json parse
    try:
        return json.loads(content)
    except Exception:
        pass

    # Find boundaries
    first_bracket = content.find('[')
    last_bracket = content.rfind(']')
    first_brace = content.find('{')
    last_brace = content.rfind('}')

    # Order candidates by which opening delimiter appears first
    candidates = []
    if first_bracket != -1 and last_bracket > first_bracket:
        candidates.append((first_bracket, content[first_bracket:last_bracket + 1]))
    if first_brace != -1 and last_brace > first_brace:
        candidates.append((first_brace, content[first_brace:last_brace + 1]))

    candidates.sort(key=lambda c: c[0])

    for _, snippet in candidates:
        try:
            return json.loads(snippet)
        except Exception:
            continue

    return fallback


def _get_client(api_key: Optional[str] = None) -> AsyncOpenAI:
    """Lazy-initialize an NVIDIA NIM OpenAI-compatible client.

    A request-level timeout and automatic retries are set here so a slow or
    flaky upstream can't hang a user request indefinitely."""
    key = (api_key or settings.NVIDIA_API_KEY or "").strip()
    if key not in _clients:
        _clients[key] = AsyncOpenAI(
            base_url=settings.NVIDIA_BASE_URL,
            api_key=key,
            timeout=45.0,
            max_retries=0,
        )
    return _clients[key]


import inspect


def _log_api_metric(**fields) -> None:
    """Persist an APILog row without blocking the caller.

    The metric write used to be `await`ed inline, so every user-facing AI
    response paid for an extra MongoDB round-trip before returning. We now
    schedule it as a background task: the AI result is returned immediately
    and the log lands a few milliseconds later. Failures to log are swallowed
    (metrics must never break a working feature)."""
    async def _write():
        try:
            await APILog(**fields).insert()
        except Exception:
            logger.warning("Failed to write APILog metric", exc_info=True)

    try:
        asyncio.create_task(_write())
    except RuntimeError:
        # No running loop (e.g. called from sync context) — skip silently.
        pass


async def _call_llm_with_tracking(**kwargs):
    """Wraps client.chat.completions.create to track API latency and success rates."""
    api_key = kwargs.pop("api_key", None)
    client = _get_client(api_key)
    start_time = time.time()

    # Auto-detect caller function name
    try:
        endpoint_name = inspect.currentframe().f_back.f_code.co_name
    except Exception:
        endpoint_name = "unknown"

    max_retries = 2
    for attempt in range(max_retries):
        try:
            completion = await client.chat.completions.create(**kwargs)
            duration_ms = int((time.time() - start_time) * 1000)

            _log_api_metric(
                endpoint=endpoint_name,
                response_time_ms=duration_ms,
                success=True,
                status_code=200,
            )

            return completion

        except Exception as e:
            err_str = str(e).lower()
            target_model = kwargs.get("model")

            # Fallback to primary API key if a feature-specific key failed authorization or errored
            if (
                "401" in err_str
                or "403" in err_str
                or "500" in err_str
                or "502" in err_str
                or "503" in err_str
                or "unauthorized" in err_str
                or "authorization failed" in err_str
                or "internal server error" in err_str
                or "timeout" in err_str
                or "connection" in err_str
            ) and client.api_key != settings.NVIDIA_API_KEY:
                logger.warning(f"Feature API key failed ({e}). Falling back to primary NVIDIA_API_KEY...")
                client = _get_client(settings.NVIDIA_API_KEY)
                continue

            if ("404" in err_str or "410" in err_str or "not found" in err_str or "gone" in err_str) and target_model != "meta/llama-3.2-11b-vision-instruct":
                logger.warning(f"Model '{target_model}' unavailable ({e}). Falling back to meta/llama-3.2-11b-vision-instruct...")
                kwargs["model"] = "meta/llama-3.2-11b-vision-instruct"
                continue

            if attempt < max_retries - 1 and isinstance(e, (openai.APIConnectionError, openai.RateLimitError, openai.InternalServerError, httpx.HTTPError)):
                logger.warning(f"LLM call transient error ({e}), retrying attempt {attempt + 2}/{max_retries}...")
                await asyncio.sleep(1.0 * (attempt + 1))
                continue

            duration_ms = int((time.time() - start_time) * 1000)
            status_code = getattr(e, 'status_code', 500) or 500

            _log_api_metric(
                endpoint=endpoint_name,
                response_time_ms=duration_ms,
                success=False,
                status_code=status_code,
                error_message=str(e),
            )

            raise e


def _fallback_ats_score(resume_text: str, job_description: str) -> Dict[str, Any]:
    """Calculate an intelligent fallback ATS score based on keyword extraction and best practices."""
    import re
    resume_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', resume_text.lower()))
    
    if job_description and job_description.strip():
        jd_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', job_description.lower()))
        common_stop = {"with", "that", "this", "from", "they", "have", "will", "your", "what", "about", "there", "their", "which", "would"}
        significant_jd = jd_words - common_stop
        matched = [w.capitalize() for w in list(resume_words.intersection(significant_jd))[:15]]
        missing = [w.capitalize() for w in list(significant_jd - resume_words)[:8]]
        ratio = len(matched) / (len(significant_jd) or 1)
        score = min(92, max(45, int(ratio * 100)))
    else:
        matched = [w.capitalize() for w in list(resume_words)[:12]]
        missing = ["Certifications", "Quantifiable Metrics", "Leadership Experience", "Agile Methodologies"]
        score = min(88, max(65, 50 + len(resume_words) // 25))

    return {
        "score": score,
        "matched_keywords": matched,
        "missing_keywords": missing,
        "suggestions": [
            "Start bullet points with strong impact verbs (e.g. Architected, Optimized, Streamlined).",
            "Quantify key accomplishments with measurable data or percent improvements.",
            "Align technical skills and keywords directly with target job requirements.",
        ],
    }


async def analyze_resume_ats(
    resume_text: str, job_description: str
) -> Dict[str, Any]:
    """Analyze a resume against a job description for ATS compatibility."""
    resume_text_clean = (resume_text or "")[:5000].strip()
    job_description_clean = (job_description or "")[:3000].strip()

    if job_description_clean:
        jd_section = f"\nJOB DESCRIPTION:\n{job_description_clean}\n"
        instruction = """
Evaluate the provided RESUME against the provided JOB DESCRIPTION. 
Calculate an ATS match score based strictly on keyword overlaps, required experience, and skills alignment.
Do not hallucinate keywords. Only list keywords present in the JD as missing if the resume lacks them.
"""
    else:
        jd_section = ""
        instruction = """
Evaluate the provided RESUME on general industry best practices since no Job Description was provided.
Calculate a general quality score based on: actionable verbs, quantifiable achievements, clear formatting, and standard industry skills.
For "missing_keywords", provide 3-5 highly sought-after industry skills that the candidate might consider adding based on their current profile.
Do not hallucinate skills they already have.
"""

    prompt = f"""You are a strict and highly accurate Applicant Tracking System (ATS) evaluator.

{instruction}

RESUME:
{resume_text_clean}
{jd_section}

You MUST return your analysis as a valid JSON object matching the exact schema below. Do not include markdown code blocks (like ```json), conversational text, or any other formatting.

{{
  "score": <integer from 0 to 100>,
  "matched_keywords": ["keyword1", "keyword2", ...],
  "missing_keywords": ["missing1", "missing2", ...],
  "suggestions": ["Specific, actionable suggestion 1", "Specific suggestion 2", ...]
}}
"""

    try:
        completion = await _call_llm_with_tracking(
            model=settings.NVIDIA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=750,
        )

        content = completion.choices[0].message.content or "{}"
        parsed = _parse_llm_json(content, fallback=None)
        if parsed and isinstance(parsed, dict) and "score" in parsed:
            return parsed
        return _fallback_ats_score(resume_text_clean, job_description_clean)
    except Exception as e:
        logger.error(f"Error during ATS analysis: {e}", exc_info=True)
        return _fallback_ats_score(resume_text_clean, job_description_clean)


async def evaluate_interview_answer(
    question: str, answer: str, role: str
) -> Dict[str, Any]:
    """Evaluate an interview answer and provide feedback."""
    prompt = f"""You are an expert interviewer for a {role} position.

Evaluate the following answer to the interview question.

QUESTION: {question}
ANSWER: {answer}

Return a JSON object with:
- "score": integer from 0 to 100
- "strengths": list of 2-3 things done well
- "weaknesses": list of 2-3 areas for improvement
- "improved_answer": a brief example of a stronger answer (2-3 sentences)

Return ONLY valid JSON."""

    try:
        completion = await _call_llm_with_tracking(
            model=settings.NVIDIA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=800,
        )

        content = completion.choices[0].message.content or "{}"
        return _parse_llm_json(content, fallback={
            "score": 75,
            "strengths": ["Clear communication", "Addressed the core problem"],
            "weaknesses": ["Could provide more quantifiable results"],
            "improved_answer": "Structure your answer with STAR: Situation, Task, Action, and measurable Result.",
        })
    except Exception as e:
        logger.error(f"Error evaluating interview answer: {e}", exc_info=True)
        return {
            "score": 75,
            "strengths": ["Clear communication", "Good foundational knowledge"],
            "weaknesses": ["Could provide more specific technical metrics"],
            "improved_answer": "Structure your answer with STAR: Situation, Task, Action, and measurable Result.",
        }


def _fallback_suggested_projects(skills: str, interests: str) -> List[Dict[str, Any]]:
    """Intelligent fallback projects matching extracted skills and interests."""
    skills_lower = (skills or "").lower()
    interests_lower = (interests or "").lower()

    is_ai = any(w in skills_lower or w in interests_lower for w in ["ai", "llm", "ml", "python", "pytorch", "agent", "data"])
    is_web = any(w in skills_lower or w in interests_lower for w in ["react", "typescript", "javascript", "frontend", "fullstack", "next", "node"])
    is_backend = any(w in skills_lower or w in interests_lower for w in ["go", "docker", "kafka", "redis", "kubernetes", "backend", "distributed", "system"])

    projects = []
    if is_ai or not (is_web or is_backend):
        projects.append({
            "id": "project-ai-1",
            "title": "Autonomous RAG Knowledge Graph & Copilot",
            "description": "An enterprise multi-agent retrieval pipeline that builds vector embeddings and knowledge graphs from developer documentation with sub-100ms latency.",
            "rating": 9,
            "skill_level": "Advanced",
            "estimated_time": "3 weeks",
            "key_technologies": ["Python", "FastAPI", "Vector DB", "LLM", "Docker"],
        })
    if is_web or not projects:
        projects.append({
            "id": "project-web-2",
            "title": "High-Performance Realtime Collaborative Canvas",
            "description": "A zero-latency multiplayer design system with WebSockets, optimistic UI reconciliation, and CRDT synchronization.",
            "rating": 9,
            "skill_level": "Intermediate",
            "estimated_time": "2-3 weeks",
            "key_technologies": ["React", "TypeScript", "Tailwind CSS", "WebSockets", "Node.js"],
        })
    if is_backend or len(projects) < 3:
        projects.append({
            "id": "project-be-3",
            "title": "Distributed Event-Driven Task Engine",
            "description": "A resilient distributed job queue with Raft consensus, rate limiting, and worker telemetry dashboards.",
            "rating": 10,
            "skill_level": "Advanced",
            "estimated_time": "4 weeks",
            "key_technologies": ["Go", "Docker", "Kafka", "Redis", "Prometheus"],
        })
    if len(projects) < 4:
        projects.append({
            "id": "project-full-4",
            "title": "AI Cloud Telemetry & Security Audit Platform",
            "description": "An automated compliance auditor that continuously inspects container configurations and alerts on security vulnerabilities.",
            "rating": 8,
            "skill_level": "Intermediate",
            "estimated_time": "2 weeks",
            "key_technologies": ["Python", "React", "PostgreSQL", "Docker", "GitHub Actions"],
        })
    return projects


async def suggest_projects(skills: str, time_commitment: str, interests: str) -> List[Dict[str, Any]]:
    """Suggest software projects based on user skills, time, and interests."""
    prompt = f"""You are an expert software engineering mentor. Based on the following user profile, suggest 3 to 5 realistic software projects they can build for their portfolio.

User Skills: {skills}
Available Time: {time_commitment}
Interests/Goals: {interests}

For each project, provide:
- "id": a unique short string identifier
- "title": a catchy project title
- "description": a brief 1-2 sentence description
- "rating": an integer from 1 to 10 evaluating how good this project is for their portfolio
- "skill_level": e.g., "Beginner", "Intermediate", "Advanced"
- "estimated_time": e.g., "2 weeks", "40 hours"
- "key_technologies": list of 3-5 technologies

Return a JSON array of project objects. Return ONLY valid JSON, no markdown formatting."""

    api_key = settings.PROJECT_FINDER_API_KEY or settings.NVIDIA_API_KEY
    try:
        completion = await _call_llm_with_tracking(
            api_key=api_key,
            model=settings.NVIDIA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1000,
        )

        content = completion.choices[0].message.content or "{}"
        raw_projects = _parse_llm_json(content, fallback=[])

        # Handle dictionary wrappers like {"projects": [...]}
        if isinstance(raw_projects, dict):
            for k in ("projects", "recommendations", "data", "items"):
                if k in raw_projects and isinstance(raw_projects[k], list):
                    raw_projects = raw_projects[k]
                    break
            else:
                raw_projects = []

        if not isinstance(raw_projects, list) or len(raw_projects) == 0:
            return _fallback_suggested_projects(skills, interests)

        normalized_projects = []
        for idx, p in enumerate(raw_projects):
            if not isinstance(p, dict):
                continue

            raw_rating = p.get("rating", 8)
            try:
                if isinstance(raw_rating, str):
                    rating = int(float(raw_rating.split("/")[0].strip()))
                else:
                    rating = int(raw_rating)
            except Exception:
                rating = 8
            rating = max(1, min(10, rating))

            raw_techs = p.get("key_technologies", [])
            if isinstance(raw_techs, str):
                key_technologies = [t.strip() for t in raw_techs.split(",") if t.strip()]
            elif isinstance(raw_techs, list):
                key_technologies = [str(t).strip() for t in raw_techs if str(t).strip()]
            else:
                key_technologies = []

            normalized_projects.append({
                "id": str(p.get("id") or f"project-{idx + 1}"),
                "title": str(p.get("title") or f"Portfolio Project {idx + 1}"),
                "description": str(p.get("description") or ""),
                "rating": rating,
                "skill_level": str(p.get("skill_level") or "Intermediate"),
                "estimated_time": str(p.get("estimated_time") or "2-3 weeks"),
                "key_technologies": key_technologies,
            })

        return normalized_projects if normalized_projects else _fallback_suggested_projects(skills, interests)
    except Exception as e:
        logger.error(f"Error suggesting projects via LLM: {e}", exc_info=True)
        return _fallback_suggested_projects(skills, interests)


def _fallback_roadmap(project_details: Dict[str, Any]) -> Dict[str, Any]:
    """Resilient fallback roadmap if the LLM is slow or unavailable."""
    title = project_details.get("title", "Software Project")
    techs = project_details.get("key_technologies", ["Frontend", "Backend", "Database"])
    tech_str = ", ".join(techs) if isinstance(techs, list) else str(techs)
    return {
        "phases": [
            {
                "phase_number": 1,
                "title": "Architecture, Specification & Environment Setup",
                "description": f"Establish development workspace, containerized toolchain ({tech_str}), and repository structure.",
                "tasks": [
                    "Initialize repository with strict TypeScript/Python linters and formatters",
                    f"Configure Docker environment and base dependencies for {tech_str}",
                    "Draft comprehensive data model schema and core REST/WebSocket contracts",
                    "Setup continuous integration pipelines for automated linting and unit tests",
                ]
            },
            {
                "phase_number": 2,
                "title": "Core Engine & Data Pipeline Development",
                "description": f"Build the foundational backend services and primary business logic for {title}.",
                "tasks": [
                    "Implement core service modules with robust error handling and telemetry",
                    "Construct database models, index optimization, and connection pooling",
                    "Develop authenticated API endpoints with input validation and rate limiting",
                    "Write integration tests validating happy-path and edge-case execution",
                ]
            },
            {
                "phase_number": 3,
                "title": "Interactive Client Interface & State Management",
                "description": "Build modern responsive user interface with rich micro-interactions and smooth transitions.",
                "tasks": [
                    "Implement component library and design tokens using clean modular CSS",
                    "Connect client state store to backend APIs with optimistic cache updates",
                    "Add comprehensive error boundaries, loading skeletons, and toast alerts",
                    "Conduct end-to-end user journey smoke tests across mobile and desktop viewports",
                ]
            },
            {
                "phase_number": 4,
                "title": "Production Hardening, Deployment & Benchmarking",
                "description": f"Optimize performance, stress-test throughput, and deploy {title} to production.",
                "tasks": [
                    "Audit security headers, CORS origins, and environment secrets",
                    "Run load tests to verify latency under concurrent user traffic",
                    "Deploy to cloud provider (Render/Vercel) with production monitoring",
                    "Author showcase portfolio documentation and interactive demo video",
                ]
            }
        ]
    }


async def generate_project_roadmap(project_details: Dict[str, Any], preferences: Dict[str, str] = None) -> Dict[str, Any]:
    """Generate a step-by-step roadmap for a specific project."""
    prefs_text = ""
    if preferences:
        prefs_text = "\nUser Preferences for this Roadmap:\n"
        for k, v in preferences.items():
            if v and str(v).strip():
                prefs_text += f"- {k}: {v}\n"

    raw_techs = project_details.get("key_technologies", [])
    if isinstance(raw_techs, list):
        tech_str = ", ".join(str(t) for t in raw_techs)
    else:
        tech_str = str(raw_techs)

    prompt = f"""You are an expert technical lead creating a development roadmap.

Create a step-by-step implementation roadmap for the following project:
Title: {project_details.get('title')}
Description: {project_details.get('description')}
Technologies: {tech_str}
{prefs_text}
Return a JSON object with a "phases" array. Each phase should have:
- "phase_number": integer
- "title": string
- "description": string
- "tasks": a list of string tasks to complete in this phase

Ensure the roadmap strictly adheres to the user's preferences if provided.
Return ONLY valid JSON, no markdown formatting."""

    api_key = settings.PROJECT_FINDER_API_KEY or settings.NVIDIA_API_KEY
    try:
        completion = await _call_llm_with_tracking(
            api_key=api_key,
            model=settings.NVIDIA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1000,
        )

        content = completion.choices[0].message.content or "{}"
        raw_data = _parse_llm_json(content, fallback=None)

        if not raw_data:
            return _fallback_roadmap(project_details)

        if isinstance(raw_data, list):
            phases_list = raw_data
        elif isinstance(raw_data, dict):
            phases_list = raw_data.get("phases") or raw_data.get("roadmap") or raw_data.get("steps") or []
        else:
            phases_list = []

        if not phases_list:
            return _fallback_roadmap(project_details)

        normalized_phases = []
        for idx, phase in enumerate(phases_list):
            if not isinstance(phase, dict):
                continue
            try:
                phase_num = int(phase.get("phase_number", idx + 1))
            except Exception:
                phase_num = idx + 1

            raw_tasks = phase.get("tasks", [])
            if isinstance(raw_tasks, list):
                tasks = [str(t) for t in raw_tasks if str(t).strip()]
            elif isinstance(raw_tasks, str):
                tasks = [t.strip() for t in raw_tasks.split("\n") if t.strip()]
            else:
                tasks = []

            normalized_phases.append({
                "phase_number": phase_num,
                "title": str(phase.get("title") or f"Phase {phase_num}"),
                "description": str(phase.get("description") or ""),
                "tasks": tasks,
            })

        return {"phases": normalized_phases} if normalized_phases else _fallback_roadmap(project_details)
    except Exception as e:
        logger.error(f"Error generating roadmap via LLM: {e}", exc_info=True)
        return _fallback_roadmap(project_details)

async def tailor_resume_latex(latex_code: str, recommendations: List[str], custom_instructions: str) -> str:
    """Modify LaTeX resume code based on ATS recommendations and user instructions."""
    client = _get_client()
    
    recs_text = "\n".join([f"- {r}" for r in recommendations]) if recommendations else "None"
    custom_text = custom_instructions if custom_instructions else "None"

    prompt = f"""You are an expert LaTeX developer and career coach.
I will provide you with the raw LaTeX source code of a user's resume.
Your task is to modify the LaTeX code to incorporate the following ATS recommendations and custom user instructions.

ATS Recommendations to apply:
{recs_text}

Custom User Instructions:
{custom_text}

Original LaTeX Code:
```latex
{latex_code}
```

Instructions:
1. Make targeted, intelligent edits to the LaTeX code to fulfill the requests.
2. Ensure the resulting LaTeX code remains valid, compilable, and syntactically correct.
3. Do NOT change the overall layout, styling, or document class unless explicitly requested.
4. CRITICAL: You MUST escape all LaTeX special characters like &, %, $, _, # by preceding them with a backslash (e.g. \\&, \\%, \\$, \\_, \\#) inside text content.
5. CRITICAL: Do NOT delete or modify the user's contact information (email, phone, LinkedIn, GitHub, etc.) or any existing hyperlinks (\\href) unless explicitly requested. Keep them exactly where they are.
6. Output ONLY the raw updated LaTeX code. Do NOT wrap it in markdown blocks (e.g. ```latex). Do NOT add any conversational text.
"""

    completion = await _call_llm_with_tracking(
        model=settings.NVIDIA_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=4000,
    )

    content = completion.choices[0].message.content or latex_code
    content = content.strip()
    
    if "```latex" in content:
        content = content.split("```latex")[1]
    elif "```" in content:
        content = content.split("```")[1]
        
    if "```" in content:
        content = content.split("```")[0]

    return content.strip()

def _fallback_cover_letter(
    resume_text: str,
    job_description: str,
    role_title: Optional[str] = None,
    company_name: Optional[str] = None,
    tone: Optional[str] = None,
) -> str:
    """Build a professional, tailored fallback cover letter from candidate profile and role."""
    import re
    first_lines = [line.strip() for line in resume_text.splitlines() if line.strip()][:5]
    candidate_name = first_lines[0] if first_lines and len(first_lines[0].split()) <= 4 else "Candidate"
    
    skill_matches = re.findall(r'\b(Python|React|TypeScript|JavaScript|Node\.js|Docker|Kubernetes|AWS|SQL|PostgreSQL|Go|FastAPI|MongoDB|Redis|Java|C\+\+)\b', resume_text, re.IGNORECASE)
    unique_skills = list(dict.fromkeys([s.capitalize() for s in skill_matches]))[:6]
    skills_phrase = ", ".join(unique_skills) if unique_skills else "modern software engineering practices, scalable systems, and cloud architectures"

    target_role = role_title or "Software Engineer"
    target_company = company_name or "your team"

    return f"""Dear Hiring Team at {target_company},

I am excited to submit my application for the {target_role} position. With a solid foundation in {skills_phrase}, I have consistently focused on engineering high-reliability systems, optimizing application throughput, and delivering measurable product impact.

Reviewing your requirements, I was drawn to your mission and technical focus. In my recent experience, I have led end-to-end feature implementations, architected resilient API workflows, and collaborated closely with cross-functional partners to translate complex requirements into clean, maintainable code. My hands-on proficiency across modern engineering toolchains allows me to onboard rapidly and contribute from day one.

I would welcome the opportunity to discuss how my technical expertise and passion for continuous improvement can support {target_company}'s upcoming milestones. Thank you for your time and consideration.

Sincerely,
{candidate_name}"""


async def generate_cover_letter(
    resume_text: str,
    job_description: str,
    tone: Optional[str] = None,
    company_name: Optional[str] = None,
    role_title: Optional[str] = None,
) -> str:
    """Generate a bespoke cover letter based on resume, job description, and narrative style."""
    resume_text_clean = (resume_text or "")[:4000].strip()
    job_description_clean = (job_description or "")[:2500].strip()

    context_extras = []
    if role_title and role_title.strip():
        context_extras.append(f"TARGET ROLE: {role_title.strip()}")
    if company_name and company_name.strip():
        context_extras.append(f"TARGET COMPANY: {company_name.strip()}")
    if tone and tone.strip():
        context_extras.append(f"DESIRED NARRATIVE TONE: {tone.strip()}")
    extras_str = ("\n" + "\n".join(context_extras) + "\n") if context_extras else ""

    prompt = f"""You are an elite executive career strategist and principal technical copywriter.
Write a compelling, bespoke, and memorable cover letter tailored to the following role and candidate profile.
{extras_str}
JOB DESCRIPTION:
{job_description_clean}

CANDIDATE RESUME:
{resume_text_clean}

Strict Writing Guidelines:
1. NEVER use generic AI cliches such as: "I am writing to express my interest", "I hope this email finds you well", "I am thrilled to apply", or "I believe I am the perfect candidate".
2. Open with an authoritative, hook-driven opening sentence that immediately connects candidate strengths to the company's core mission or challenge.
3. Highlight 2-3 specific, quantified achievements or deep technical competencies from the resume that directly solve the requirements in the job description.
4. Maintain an optimal length between 250 and 350 words. High signal-to-noise ratio.
5. Output ONLY the polished cover letter text. Do NOT include markdown code fences or conversational commentary.
"""

    try:
        completion = await _call_llm_with_tracking(
            model=settings.NVIDIA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=750,
        )

        content = completion.choices[0].message.content or ""
        content = content.strip()

        # Strip code block fences if present
        if "```" in content:
            parts = content.split("```")
            for p in parts[1::2]:
                block = p.split("\n", 1)[1] if "\n" in p else p
                if len(block.strip()) > 50:
                    content = block.strip()
                    break

        content = content.strip("`").strip()

        # Strip stray conversational intros
        lines = content.splitlines()
        if lines and any(lines[0].lower().startswith(prefix) for prefix in ("here is", "here's", "certainly", "sure,")):
            lines = lines[1:]
            while lines and not lines[0].strip():
                lines = lines[1:]
            content = "\n".join(lines).strip()

        return content if len(content) > 100 else _fallback_cover_letter(resume_text_clean, job_description_clean, role_title, company_name, tone)
    except Exception as e:
        logger.error(f"Error generating cover letter via LLM: {e}", exc_info=True)
        return _fallback_cover_letter(resume_text_clean, job_description_clean, role_title, company_name, tone)


def _fallback_smart_fill(resume_text: str, required_fields: List[str], user_profile: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
    """Fallback extraction of template fields using regex and stored profile data."""
    import re
    result = {}
    profile = user_profile or {}

    for field in required_fields:
        f_lower = field.lower()
        if any(k in f_lower for k in ["name", "full_name"]):
            result[field] = profile.get("full_name") or (resume_text.splitlines()[0].strip() if resume_text.strip() else "Job Applicant")
        elif "email" in f_lower:
            emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text)
            result[field] = emails[0] if emails else profile.get("email", "")
        elif any(k in f_lower for k in ["phone", "mobile", "tel"]):
            phones = re.findall(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', resume_text)
            result[field] = phones[0] if phones else profile.get("phone", "")
        elif any(k in f_lower for k in ["github", "git"]):
            gh = re.findall(r'github\.com/[a-zA-Z0-9_-]+', resume_text)
            result[field] = f"https://{gh[0]}" if gh else profile.get("github_url", "")
        elif any(k in f_lower for k in ["linkedin", "linked"]):
            li = re.findall(r'linkedin\.com/in/[a-zA-Z0-9_-]+', resume_text)
            result[field] = f"https://{li[0]}" if li else profile.get("linkedin_url", "")
        elif any(k in f_lower for k in ["skill", "technologies", "tools"]):
            words = re.findall(r'\b(Python|React|TypeScript|JavaScript|Node\.js|Docker|Kubernetes|AWS|SQL|PostgreSQL|Go|FastAPI|MongoDB|Redis|Java|C\+\+|Git|Linux)\b', resume_text, re.IGNORECASE)
            skills = list(dict.fromkeys([w.capitalize() for w in words]))
            result[field] = ", ".join(skills) if skills else "Python, React, TypeScript, Docker, PostgreSQL"
        elif any(k in f_lower for k in ["summary", "bio", "objective"]):
            result[field] = profile.get("bio") or "Passionate software engineer experienced in building scalable, production-grade applications."
        elif any(k in f_lower for k in ["education", "degree", "university"]):
            result[field] = "Bachelor of Technology in Computer Science"
        else:
            result[field] = ""
    return result


async def smart_fill_resume_fields(resume_text: str, required_fields: List[str], user_profile: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
    """Smart fill resume fields based on extracted text, stored profile data, and required template fields."""
    resume_text_clean = (resume_text or "")[:4500].strip()
    fields_list = "\n".join([f'- "{field}"' for field in required_fields])
    
    profile_section = f"\nUSER STORED PROFILE DATA:\n{json.dumps(user_profile, indent=2, default=str)}\n" if user_profile else ""
    
    prompt = f"""You are an expert resume assistant. Extract comprehensive information from the provided resume text and stored profile data to intelligently pre-fill out the specified required fields for a new resume template.

RESUME TEXT:
{resume_text_clean}
{profile_section}
REQUIRED FIELDS:
{fields_list}

Instructions:
1. Extract ALL relevant details for each required field. Do not summarize or truncate if the field represents a list of items (e.g., Experience, Projects, Education) - include all the entries you can find.
2. If a field represents bullet points or multiple items, separate them clearly using newlines or bullet formats (e.g., - ) so they render nicely.
3. If a field's information is completely missing, leave the value as an empty string "".
4. Return your answer as a valid JSON object mapping each required field to the extracted text value.
5. Do not include markdown code blocks (like ```json), conversational text, or any other formatting. Output ONLY the JSON object.
"""

    try:
        completion = await _call_llm_with_tracking(
            model=settings.NVIDIA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1000,
        )

        content = completion.choices[0].message.content or "{}"
        parsed = _parse_llm_json(content, fallback=None)
        if parsed and isinstance(parsed, dict) and len(parsed) > 0:
            return parsed
        return _fallback_smart_fill(resume_text_clean, required_fields, user_profile)
    except Exception as e:
        logger.error(f"Error during smart_fill_resume_fields: {e}", exc_info=True)
        return _fallback_smart_fill(resume_text_clean, required_fields, user_profile)

async def parse_resume_for_profile(resume_text: str) -> Dict[str, Any]:
    """Parse a resume PDF text and extract profile details."""
    client = _get_client()
    prompt = f"""You are an expert AI resume parser. Extract the following information from the provided resume text into a structured JSON format.

RESUME:
{resume_text}

Extract the details exactly into this JSON format:
{{
    "full_name": "Full Name or null",
    "bio": "A short 2-3 sentence professional summary based on the resume",
    "skills": ["skill1", "skill2"],
    "education": [
        {{
            "institution": "University Name",
            "degree": "Degree Name",
            "start_date": "YYYY-MM or string",
            "end_date": "YYYY-MM or string",
            "description": "Details"
        }}
    ],
    "experience": [
        {{
            "company": "Company Name",
            "role": "Job Title",
            "start_date": "YYYY-MM",
            "end_date": "YYYY-MM or Present",
            "description": "Bullet points or description"
        }}
    ],
    "linkedin_url": "URL or null",
    "github_url": "URL or null",
    "portfolio_url": "URL or null"
}}

Return ONLY valid JSON, no markdown formatting."""

    completion = await _call_llm_with_tracking(
        model=settings.NVIDIA_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=2500,
    )

    content = completion.choices[0].message.content or "{}"
    return _parse_llm_json(content, fallback={})


_CHAT_SYSTEM_MSG = {
    "role": "system",
    "content": (
        "You are SkillHub AI, an advanced academic and career intelligence mentor for university students and engineers. "
        "You deliver rigorous, academically sound, and conceptually precise guidance grounded in computer science and engineering curricula "
        "(Data Structures, Algorithms, Operating Systems, Computer Networks, Database Management Systems, AI/ML Theory, System Design, and Software Engineering). "
        "When answering student or technical queries: "
        "1. Structure your answers with formal academic definitions, underlying theoretical concepts, and intuitive real-world engineering analogies. "
        "2. Provide algorithmic complexity analysis (Time O(n), Space O(1)) and mathematical derivations where appropriate. "
        "3. Cite standard academic textbook references (e.g., Cormen/CLRS for Algorithms, Silberschatz/Galvin for OS, Kurose-Ross for Networks, Korth/Elmasri for DBMS, Russell-Norvig for AI). "
        "4. Bridge academic coursework directly with industry implementation practices and technical interview expectations. "
        "Maintain a professorial, inspiring, clear, and highly articulate academic tone."
    ),
}


async def chat_completion(messages: List[Dict[str, str]]) -> str:
    """General AI career-advisor chatbot. Returns the assistant's reply text."""
    completion = await _call_llm_with_tracking(
        model=settings.NVIDIA_MODEL,
        messages=[_CHAT_SYSTEM_MSG] + list(messages),
        temperature=0.7,
        max_tokens=1500,
    )

    return (
        completion.choices[0].message.content
        or "I'm sorry, I couldn't generate a response. Please try again."
    )


async def chat_completion_stream(messages: List[Dict[str, str]]):
    """Stream the chatbot reply token-by-token.

    Yields text deltas as they arrive so the UI can render the answer while
    it's still being generated — the single biggest perceived-latency win for
    an interactive chat, since the user sees words in ~1s instead of waiting
    for the whole (often multi-second) response. Metrics are logged in the
    background once the stream finishes."""
    client = _get_client()
    start_time = time.time()
    try:
        stream = await client.chat.completions.create(
            model=settings.NVIDIA_MODEL,
            messages=[_CHAT_SYSTEM_MSG] + list(messages),
            temperature=0.7,
            max_tokens=1500,
            stream=True,
        )
        async for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            if delta and delta.content:
                yield delta.content
        _log_api_metric(
            endpoint="chat_completion_stream",
            response_time_ms=int((time.time() - start_time) * 1000),
            success=True,
            status_code=200,
        )
    except Exception as e:
        _log_api_metric(
            endpoint="chat_completion_stream",
            response_time_ms=int((time.time() - start_time) * 1000),
            success=False,
            status_code=getattr(e, "status_code", 500) or 500,
            error_message=str(e),
        )
        raise


async def generate_interview_question(role: str, difficulty: str) -> Dict[str, str]:
    """Generate a single AI interview question for a given role and difficulty."""
    prompt = f"""Generate a single {difficulty} difficulty interview question for a {role} position.

Return a JSON object with:
- "question": the interview question
- "category": the category (e.g., "Technical", "Behavioral", "System Design", "Problem Solving")
- "tips": a brief tip for how to approach this question (1-2 sentences)

Return ONLY valid JSON."""

    completion = await _call_llm_with_tracking(
        model=settings.NVIDIA_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
        max_tokens=500,
    )

    content = completion.choices[0].message.content or "{}"
    return _parse_llm_json(content, fallback={
        "question": "Tell me about a challenging project you've worked on.",
        "category": "Behavioral",
        "tips": "Use the STAR method: Situation, Task, Action, Result.",
    })


def _fallback_linkedin_optimization(profile_text: str) -> Dict[str, Any]:
    """Resilient fallback LinkedIn profile recommendations."""
    return {
        "headline_suggestions": [
            "Full-Stack Software Engineer | Python, TypeScript, React | Cloud & Microservices Architect",
            "Software Engineer | Building High-Throughput Distributed Systems & Resilient Web Apps",
            "Full-Stack Developer | Modern Web Architectures, APIs & Scalable Cloud Platforms"
        ],
        "summary_rewrite": "Accomplished software engineer with deep hands-on expertise in designing and shipping reliable web applications, distributed APIs, and scalable cloud architectures. Proven track record of accelerating development cycles, improving application performance, and collaborating across cross-functional engineering teams to drive user impact.",
        "experience_improvements": [
            {
                "role": "Software Engineering Experience",
                "suggestion": "Quantify bullet points with tangible metrics (e.g., 'Reduced API latency by 35%', 'Scaled data pipeline to process 100k+ events daily', 'Streamlined deployment workflows reducing CI build times by 40%')."
            },
            {
                "role": "Projects & Contributions",
                "suggestion": "Lead every bullet with strong action verbs like 'Architected', 'Engineered', 'Optimized', and clearly articulate the user or business outcome."
            }
        ]
    }


async def optimize_linkedin_profile(profile_text: str) -> Dict[str, Any]:
    """Analyze a LinkedIn profile and provide optimization suggestions."""
    profile_text_clean = (profile_text or "")[:4000].strip()

    prompt = f"""You are an expert LinkedIn profile optimization coach and recruiter.
Analyze the provided LinkedIn profile text (extracted from a PDF) and provide highly actionable recommendations to improve it.

PROFILE TEXT:
{profile_text_clean}

Return your analysis as a valid JSON object matching the exact schema below. Do not include markdown code blocks (like ```json), conversational text, or any other formatting.

{{
  "headline_suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
  "summary_rewrite": "A professionally written, engaging summary paragraph tailored to their experience.",
  "experience_improvements": [
    {{
      "role": "Role Name",
      "suggestion": "How to improve the bullet points for this specific role."
    }}
  ]
}}
"""

    try:
        completion = await _call_llm_with_tracking(
            model=settings.NVIDIA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=800,
        )

        content = completion.choices[0].message.content or "{}"
        parsed = _parse_llm_json(content, fallback=None)
        if parsed and isinstance(parsed, dict) and "headline_suggestions" in parsed:
            return parsed
        return _fallback_linkedin_optimization(profile_text_clean)
    except Exception as e:
        logger.error(f"Error during LinkedIn profile optimization: {e}", exc_info=True)
        return _fallback_linkedin_optimization(profile_text_clean)


async def score_jobs_batch(resume_text: str, jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Score a batch of jobs against a resume in a single LLM call, then sort by match."""
    if not jobs:
        return []

    # Seed defaults so every job has a score even if the model fails
    for i, job in enumerate(jobs):
        job.setdefault("match_score", max(50, 85 - (i * 3)))
        job.setdefault("match_reason", "Strong domain and skill relevance.")

    resume_text_clean = (resume_text or "")[:3000].strip()

    jobs_summary = ""
    for i, job in enumerate(jobs):
        desc_snippet = job["description"][:300].replace("\n", " ") if job.get("description") else ""
        jobs_summary += f"Job ID {i}:\nTitle: {job.get('title', '')}\nSnippet: {desc_snippet}\n\n"

    prompt = f"""You are an ATS matching engine. Score the following jobs based on their match with the candidate's resume.
Score each job from 0 to 100 based on title alignment and skill overlap.

CANDIDATE RESUME:
{resume_text_clean}

JOBS:
{jobs_summary}

Return ONLY a valid JSON array of objects, where each object has:
- "index": integer (the Job ID number from above)
- "score": integer (0-100)
- "match_reason": a brief 1-sentence reason why it matches or lacks match

Do not include markdown blocks or conversational text.
"""

    try:
        completion = await _call_llm_with_tracking(
            model=settings.NVIDIA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=800,
        )

        content = completion.choices[0].message.content or "[]"
        results = _parse_llm_json(content, fallback=[])

        if isinstance(results, list):
            for res in results:
                if not isinstance(res, dict):
                    continue
                idx = res.get("index")
                if isinstance(idx, int) and 0 <= idx < len(jobs):
                    jobs[idx]["match_score"] = res.get("score", 50)
                    jobs[idx]["match_reason"] = res.get("match_reason", "")
    except Exception as e:
        logger.warning(f"Error scoring jobs with LLM: {e}, baseline scores retained.")

    jobs.sort(key=lambda x: x.get("match_score", 0), reverse=True)
    return jobs


async def analyze_raw_idea(raw_idea: str, target_format: str = "cursor") -> Dict[str, Any]:
    """Analyze a raw/unstructured project idea and formulate clarifying questions to resolve ambiguities."""
    prompt = f"""You are a principal software architect and AI product strategist.
A user has submitted a raw, unstructured, or ambiguous project idea:

RAW IDEA:
"{raw_idea}"

TARGET AI PROMPT FORMAT: {target_format}

Your goal:
1. Distill the raw idea into a refined title, compelling one-liner vision, category (e.g. SaaS, Mobile App, AI Agent, Developer Tool), complexity score (1-10), and recommended tech stack.
2. Provide a 2-3 sentence initial architectural analysis highlighting potential challenges or ambiguities.
3. Formulate 3 to 4 targeted, high-value clarifying questions to resolve crucial product/tech decisions (e.g., Auth mechanism, Real-time requirement, Tech stack preference, Target users, Data storage).
   Each question MUST provide 3-4 distinct selectable options for quick user selection.

Return ONLY a valid JSON object matching this exact structure:
{{
  "refined_title": "Clean Project Title",
  "one_liner": "Concise product summary",
  "category": "Web Application / SaaS / AI Tool / Mobile",
  "estimated_complexity": 6,
  "suggested_stack": ["React/Next.js", "FastAPI/Python", "PostgreSQL", "Tailwind CSS"],
  "initial_analysis": "Initial architectural assessment highlighting scope and considerations...",
  "clarifying_questions": [
    {{
      "id": "q1",
      "question": "What primary platform/interface do you envision for the initial launch?",
      "options": ["Responsive Web App (Next.js/React)", "Native Mobile App (React Native/Flutter)", "Chrome Extension / Plugin", "CLI / API Service Only"],
      "purpose": "Platform Scope"
    }},
    {{
      "id": "q2",
      "question": "How should data persistent & authentication be handled?",
      "options": ["Supabase / Firebase (Managed BaaS)", "FastAPI + PostgreSQL + JWT", "Node.js + MongoDB + NextAuth", "No Auth / Local Storage Only"],
      "purpose": "Backend & Storage"
    }},
    {{
      "id": "q3",
      "question": "What is the primary AI capability or external integration needed?",
      "options": ["LLM Text Generation / Chatbot API", "Vision / Image Processing API", "Web Scraping & Data Pipeline", "No External AI Required"],
      "purpose": "Core AI Integration"
    }}
  ]
}}
"""

    completion = await _call_llm_with_tracking(
        model=settings.NVIDIA_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=2000,
    )

    content = completion.choices[0].message.content or "{}"
    return _parse_llm_json(content, fallback={
        "refined_title": "AI Project Concept",
        "one_liner": raw_idea[:100],
        "category": "Web Application",
        "estimated_complexity": 5,
        "suggested_stack": ["TypeScript", "React", "Node.js"],
        "initial_analysis": "An interesting project concept that can be structured with clear requirements.",
        "clarifying_questions": [
            {
                "id": "q1",
                "question": "What is your preferred technology stack?",
                "options": ["React + Node.js", "Next.js + Python/FastAPI", "Vue + Django", "Flutter Mobile"],
                "purpose": "Tech Stack"
            },
            {
                "id": "q2",
                "question": "What is the primary target audience?",
                "options": ["General Consumers (B2C)", "Developers / Engineers", "Small Business Owners (B2B)", "Internal Tool"],
                "purpose": "Target Audience"
            }
        ]
    })


async def generate_idea_master_prompt(
    raw_idea: str,
    refined_title: str = "",
    target_format: str = "cursor",
    clarification_answers: Dict[str, str] = None,
    additional_notes: str = ""
) -> Dict[str, Any]:
    """Generate a production-grade, highly structured AI master prompt to build the project."""

    answers_summary = ""
    if clarification_answers:
        for k, v in clarification_answers.items():
            if v and str(v).strip():
                answers_summary += f"- {k}: {v}\n"

    format_guidelines = {
        "cursor": "Generate a comprehensive .cursorrules / System Instruction Prompt optimized for Cursor IDE / Antigravity AI agent. Include explicit tech stack rules, coding standards, directory structure, component hierarchy, and step-by-step implementation phases.",
        "v0": "Generate a v0.dev / bolt.new / UI Design Specification Prompt. Focus heavily on UI layout, dark/light theme tokens, component states, interactive micro-animations, mobile responsiveness, and page hierarchy.",
        "claude": "Generate a Master System Prompt for Claude 3.5 Sonnet / GPT-4o. Focus on PRD structure, User Stories, Database ERD Schema, API Endpoints design, State Management, and Security rules.",
        "architecture": "Generate an End-to-End Technical Architecture Blueprint. Detail system boundaries, data flow diagrams, database schemas, REST API specs, middleware, deployment pipelines, and environment variables."
    }.get(target_format, "Generate an exhaustive Master AI Prompt.")

    suggested_ext = {
        "cursor": ".cursorrules",
        "v0": "v0_prompt.md",
        "claude": "SYSTEM_PROMPT.md",
        "architecture": "ARCHITECTURE_SPEC.md"
    }.get(target_format, "PROMPT.md")

    prompt = f"""You are an elite Principal Software Engineer & AI System Architect.
Synthesize the user's raw project idea into a MASTER AI PROMPT for building the application.

PROJECT TITLE: {refined_title or 'Untitled App'}
RAW IDEA: "{raw_idea}"
TARGET FORMAT SPEC: {target_format.upper()} ({format_guidelines})

CLARIFICATIONS / DECISIONS PROVIDED BY USER:
{answers_summary or 'None specified (use optimal industry defaults)'}

ADDITIONAL CONSTRAINTS / NOTES:
{additional_notes or 'None'}

Instuctions:
Create an exhaustive, professional, production-grade prompt that a developer can copy-paste directly into AI tools (Cursor, Antigravity, v0, Claude, ChatGPT) to generate the full app without ambiguity.

Return ONLY a valid JSON object with the following schema:
{{
  "prompt_title": "Master Prompt for {refined_title or 'Project'}",
  "target_format": "{target_format}",
  "suggested_filename": "{suggested_ext}",
  "master_prompt": "# Complete Markdown Master Prompt text with headers, code fences, guidelines, tech stack, data models, API endpoints, and step-by-step instructions...",
  "architecture_summary": {{
    "title": "{refined_title or 'Project Title'}",
    "key_features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
    "recommended_stack": ["Frontend Framework", "Backend/API", "Database", "Styling/UI"],
    "database_entities": ["User", "Session", "Item", "Analytics"],
    "primary_api_routes": ["POST /api/v1/auth/login", "GET /api/v1/items", "POST /api/v1/ai/process"],
    "ui_pages": ["Landing Page", "Main Dashboard", "Editor/Workspace", "Settings & Analytics"]
  }}
}}
"""

    completion = await _call_llm_with_tracking(
        model=settings.NVIDIA_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=3500,
    )

    content = completion.choices[0].message.content or "{}"
    return _parse_llm_json(content, fallback={
        "prompt_title": f"Master Prompt - {refined_title or 'App'}",
        "target_format": target_format,
        "suggested_filename": suggested_ext,
        "master_prompt": f"# Master AI Prompt: {refined_title}\n\n## Overview\n{raw_idea}\n\n## Implementation Steps\n1. Setup project workspace\n2. Configure tech stack\n3. Build UI components\n4. Connect backend API.",
        "architecture_summary": {
            "title": refined_title or "App Concept",
            "key_features": ["User Authentication", "Dashboard Workspace", "AI Generation"],
            "recommended_stack": ["React/Next.js", "Python FastAPI", "PostgreSQL"],
            "database_entities": ["User", "Project"],
            "primary_api_routes": ["/api/health", "/api/generate"],
            "ui_pages": ["Home", "Dashboard"]
        }
    })


# ── SkillHub NVIDIA NIM Academic Intelligence Services ──

def _fallback_academic_roadmap(target_career: str) -> Dict[str, Any]:
    """Fallback academic roadmap structured into curriculum semesters and phases."""
    return {
        "title": f"{target_career} Academic & Career Master Roadmap",
        "milestones": [
            {
                "phase": "Phase 1: Academic Foundations & Core Theory",
                "title": "Discrete Math, Programming Foundations & Algorithmic Analysis",
                "duration": "Semester 1–2",
                "tasks": [
                    {"id": "t1", "title": "Asymptotic Complexity (Big-O, Omega, Theta) & Recurrences", "completed": True, "type": "learn"},
                    {"id": "t2", "title": "Core Linear & Tree Data Structures (BSTs, Heaps, Hash Tables)", "completed": True, "type": "practice"},
                    {"id": "t3", "title": "Laboratory Benchmark: Sorting & Memory Allocation in C/Python", "completed": False, "type": "build"},
                ]
            },
            {
                "phase": "Phase 2: Core Engineering & Systems Coursework",
                "title": "Operating Systems, Computer Networks & Database Internals",
                "duration": "Semester 3–4",
                "tasks": [
                    {"id": "t4", "title": "Process Scheduling, Thread Synchronization & IPC Mechanisms", "completed": False, "type": "learn"},
                    {"id": "t5", "title": "Relational Schema Normalization (1NF–BCNF) & ACID Transactions", "completed": False, "type": "practice"},
                    {"id": "t6", "title": "Socket Programming: Multi-threaded HTTP/TCP Server Lab", "completed": False, "type": "build"},
                ]
            },
            {
                "phase": "Phase 3: Advanced Architecture & Modern Frameworks",
                "title": "Distributed Systems, Cloud Deployments & API Design",
                "duration": "Semester 5–6",
                "tasks": [
                    {"id": "t7", "title": "RESTful & Async Microservice Architecture with Containerization", "completed": False, "type": "learn"},
                    {"id": "t8", "title": "Distributed Consensus & Caching Systems (Redis / Message Brokers)", "completed": False, "type": "build"},
                    {"id": "t9", "title": "CI/CD Pipeline with Automated Unit & Integration Test Suites", "completed": False, "type": "assess"},
                ]
            },
            {
                "phase": "Phase 4: Capstone Engineering & Placement Readiness",
                "title": "Major Capstone Project, System Design & Technical Viva Prep",
                "duration": "Semester 7–8",
                "tasks": [
                    {"id": "t10", "title": "Deploy Full-Stack Production Capstone with Metrics & Logging", "completed": False, "type": "build"},
                    {"id": "t11", "title": "Score 85%+ on Academic Viva & Technical Mock Interview", "completed": False, "type": "practice"},
                    {"id": "t12", "title": "Portfolio Verification: GitHub Repository & ATS Resume Optimization", "completed": False, "type": "assess"},
                ]
            }
        ]
    }


async def generate_academic_roadmap(
    target_career: str, academic_level: str = "B.Tech / Undergraduate Computer Science", user_skills: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Generate a 4-phase academic semester curriculum & career roadmap using NVIDIA NIM."""
    prompt = f"""You are a university computer science academic dean and senior industry curriculum director.
Design a highly structured 4-phase academic and industry-aligned learning roadmap for a student pursuing: "{target_career}".
Academic Degree / Context: {academic_level}
Current Verified Skills: {', '.join(user_skills) if user_skills else 'Beginner to Intermediate'}

Create 4 academic milestones (e.g. Phase 1: Academic Foundations & Core Theory, Phase 2: Core Engineering & Systems Coursework, Phase 3: Advanced Architecture & Specialization, Phase 4: Capstone Engineering & Placement Readiness).
Each phase MUST contain:
- phase: (e.g. "Phase 1: Academic Foundations & Core Theory")
- title: concise descriptive title
- duration: (e.g. "Semester 1–2", "Semester 3–4", etc.)
- tasks: exactly 3 actionable tasks with fields:
  - id: (e.g. "t1", "t2", ...)
  - title: specific academic or practical task title
  - completed: boolean (set first 2 to true, rest false)
  - type: one of "learn", "practice", "build", "assess"

Return ONLY valid JSON matching this schema:
{{
  "title": "{target_career} Academic & Career Master Roadmap",
  "milestones": [
    {{
      "phase": "Phase 1: Academic Foundations & Core Theory",
      "title": "Title here",
      "duration": "Semester 1–2",
      "tasks": [
        {{"id": "t1", "title": "Task title", "completed": true, "type": "learn"}},
        {{"id": "t2", "title": "Task title", "completed": true, "type": "practice"}},
        {{"id": "t3", "title": "Task title", "completed": false, "type": "build"}}
      ]
    }}
  ]
}}
"""
    try:
        completion = await _call_llm_with_tracking(
            model=settings.NVIDIA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2000,
        )
        content = completion.choices[0].message.content or "{}"
        parsed = _parse_llm_json(content, fallback=None)
        if parsed and isinstance(parsed, dict) and "milestones" in parsed and len(parsed["milestones"]) >= 3:
            counter = 1
            for m in parsed["milestones"]:
                for t in m.get("tasks", []):
                    t["id"] = f"t{counter}"
                    counter += 1
            return parsed
    except Exception as e:
        logger.error(f"Error generating academic roadmap with NVIDIA NIM: {e}", exc_info=True)

    return _fallback_academic_roadmap(target_career)


def _fallback_academic_quiz(skill: str) -> List[Dict[str, Any]]:
    """Curated academic quiz fallback for standard computer science subjects."""
    return [
        {
            "id": 1,
            "question": f"In academic algorithm analysis, what is the tight asymptotic upper bound (Big-O) of quicksort in the worst-case, and which choice of pivot mitigates this?",
            "options": [
                "O(n log n), mitigated by choosing the first element as pivot",
                "O(n^2), mitigated by median-of-three or randomized pivot selection",
                "O(n), mitigated by duplicate key avoidance",
                "O(2^n), mitigated by memoization tables"
            ],
            "correct_index": 1,
            "academic_explanation": "Quicksort degrades to O(n^2) when subproblems are unbalanced (e.g., sorted array with first element pivot). Randomized or median-of-three pivot selection ensures expected O(n log n) runtime.",
            "textbook_ref": "Cormen, Leiserson, Rivest, Stein — Introduction to Algorithms (CLRS), Chapter 7"
        },
        {
            "id": 2,
            "question": f"Which of the following conditions is NOT one of Coffman's four necessary conditions for a system deadlock to occur in Operating Systems?",
            "options": [
                "Mutual Exclusion",
                "Hold and Wait",
                "Preemptive Resource Revocation",
                "Circular Wait"
            ],
            "correct_index": 2,
            "academic_explanation": "The four Coffman conditions are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. If preemption is allowed, deadlock cannot persist.",
            "textbook_ref": "Silberschatz, Galvin, Gagne — Operating System Concepts, Chapter 8"
        },
        {
            "id": 3,
            "question": f"In relational database theory, what distinguishes Boyce-Codd Normal Form (BCNF) from Third Normal Form (3NF)?",
            "options": [
                "BCNF permits multi-valued dependencies whereas 3NF strictly eliminates them",
                "In BCNF, for every functional dependency X -> Y, X must be a superkey without exception for prime attributes",
                "3NF requires relations to be non-loss decomposable whereas BCNF does not",
                "BCNF is strictly applicable only to non-relational document stores"
            ],
            "correct_index": 1,
            "academic_explanation": "In 3NF, X -> Y is permitted if X is a superkey OR Y is a prime attribute (part of a candidate key). BCNF eliminates this second exception, requiring X to strictly be a superkey.",
            "textbook_ref": "Silberschatz, Korth, Sudarshan — Database System Concepts, Chapter 7"
        },
        {
            "id": 4,
            "question": f"In TCP/IP networking, during the three-way handshake, what flags and sequence numbers are exchanged to establish a reliable connection?",
            "options": [
                "Client sends SYN; Server replies with SYN-ACK; Client acknowledges with ACK",
                "Client sends FIN; Server replies with RST; Client establishes session",
                "Client sends PUSH; Server responds with PULL; Client validates checksum",
                "Client sends UDP packet; Server echoes timestamp"
            ],
            "correct_index": 0,
            "academic_explanation": "Connection establishment requires SYN (seq=x), SYN-ACK (seq=y, ack=x+1), and client final ACK (ack=y+1).",
            "textbook_ref": "Kurose & Ross — Computer Networking: A Top-Down Approach, Chapter 3"
        },
        {
            "id": 5,
            "question": f"When implementing concurrent systems in modern engineering, which principle defines safety versus liveness properties?",
            "options": [
                "Safety ensures nothing bad happens; Liveness guarantees something good eventually happens",
                "Safety measures CPU cache latency; Liveness measures memory allocation",
                "Safety requires single-threaded runtimes; Liveness allows distributed nodes",
                "Safety is static type checking; Liveness is runtime dynamic dispatch"
            ],
            "correct_index": 0,
            "academic_explanation": "In formal concurrency theory (Lamport), safety states that an undesirable state is never reached (e.g. mutual exclusion), while liveness ensures progress is made (e.g. absence of starvation).",
            "textbook_ref": "Leslie Lamport — Proving the Correctness of Multiprocess Programs (1977)"
        }
    ]


async def generate_academic_quiz(
    skill: str, difficulty: str = "Intermediate", num_questions: int = 5
) -> List[Dict[str, Any]]:
    """Generate university-grade academic multiple-choice questions for a subject using NVIDIA NIM."""
    prompt = f"""You are a distinguished university computer science professor and academic board examiner.
Generate {num_questions} rigorous, university curriculum-standard multiple-choice assessment questions for the topic/skill: "{skill}".
Academic Rigor: {difficulty}

Each question MUST test conceptual depth, mathematical/algorithmic analysis, or engineering trade-offs.
Each question MUST follow this exact schema:
- id: integer 1 to {num_questions}
- question: clear, precise academic question text
- options: list of exactly 4 plausible answer strings
- correct_index: integer (0, 1, 2, or 3) indicating the single correct option
- academic_explanation: in-depth theoretical and conceptual explanation of why the correct answer is right and why distractors fail
- textbook_ref: standard university curriculum or textbook citation (e.g. CLRS, Silberschatz, Korth, Tanenbaum, etc.)

Return ONLY valid JSON matching:
{{
  "questions": [
    {{
      "id": 1,
      "question": "Question text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "academic_explanation": "Academic explanation...",
      "textbook_ref": "Introduction to Algorithms, Chapter 3"
    }}
  ]
}}
"""
    try:
        completion = await _call_llm_with_tracking(
            model=settings.NVIDIA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=2200,
        )
        content = completion.choices[0].message.content or "{}"
        parsed = _parse_llm_json(content, fallback=None)
        if parsed and isinstance(parsed, dict) and "questions" in parsed and len(parsed["questions"]) > 0:
            return parsed["questions"]
    except Exception as e:
        logger.error(f"Error generating academic quiz with NVIDIA NIM: {e}", exc_info=True)

    return _fallback_academic_quiz(skill)


async def evaluate_academic_quiz_answers(
    skill: str, questions: List[Dict[str, Any]], user_answers: Dict[str, int]
) -> Dict[str, Any]:
    """Evaluate student's quiz answers against academic criteria, computing score and feedback."""
    correct_count = 0
    detailed_results = []

    for q in questions:
        qid = str(q.get("id"))
        user_choice = user_answers.get(qid)
        correct_choice = q.get("correct_index", 0)
        is_correct = (user_choice == correct_choice)
        if is_correct:
            correct_count += 1
        
        opts = q.get("options", [])
        detailed_results.append({
            "id": q.get("id"),
            "question": q.get("question"),
            "user_choice": user_choice,
            "user_answer_text": opts[user_choice] if user_choice is not None and 0 <= user_choice < len(opts) else "No answer",
            "correct_choice": correct_choice,
            "correct_answer_text": opts[correct_choice] if 0 <= correct_choice < len(opts) else "",
            "is_correct": is_correct,
            "academic_explanation": q.get("academic_explanation", ""),
            "textbook_ref": q.get("textbook_ref", "")
        })

    total_q = max(len(questions), 1)
    percentage = int(round((correct_count / total_q) * 100))

    if percentage >= 80:
        academic_grade = "Distinction / Advanced Mastery (A)"
        summary = f"Exceptional theoretical and conceptual mastery in {skill}. Ready for advanced capstone and senior technical vivas."
    elif percentage >= 60:
        academic_grade = "Proficient / Solid Foundation (B)"
        summary = f"Good academic grounding in {skill}. Review specific textbook chapters to cement algorithmic and system edge-cases."
    else:
        academic_grade = "Developing / Foundational Review Required (C)"
        summary = f"Core fundamentals in {skill} require revision. Review recommended readings and laboratory coursework."

    return {
        "skill": skill,
        "score": percentage,
        "correct_count": correct_count,
        "total_questions": len(questions),
        "academic_grade": academic_grade,
        "summary": summary,
        "breakdown": detailed_results
    }



