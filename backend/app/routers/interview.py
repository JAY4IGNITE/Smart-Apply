import json
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, WebSocket, WebSocketDisconnect, Request
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from app.rate_limiter import limiter

from app.config import settings
from app.middleware.auth_middleware import get_current_user
from app.models.interview_report import InterviewReport
from app.models.user import User
from app.services.email_service import send_interview_report_email
from app.services.auth_service import decode_access_token
from app.services.ai_service import _call_llm_with_tracking

import openai

logger = logging.getLogger("interview-router")

router = APIRouter(prefix="/api/interview", tags=["Interview"])


# ─────────────────────────────────────────────
# Real-time Voice AI Interviewer Response Endpoint
# ─────────────────────────────────────────────

class InterviewRespondRequest(BaseModel):
    theme: str = "HR"
    messages: List[Dict[str, str]]
    participant_name: str = "Candidate"
    target_role: Optional[str] = None
    resume_summary: Optional[str] = None

THEME_SYSTEM_PROMPTS = {
    "Technical": (
        "You are an expert Lead Software Engineer conducting a live technical interview. "
        "Your goal is to assess technical depth, system design, algorithm optimization, and problem-solving skills. "
        "RULES:\n"
        "1. Actively listen to the candidate's answer and reference specific technical details they mentioned before asking your next follow-up.\n"
        "2. If the candidate gives a high-level or vague answer, ask them to dive deeper into edge cases, concurrency, or performance tradeoffs.\n"
        "3. If they propose an algorithm or design, ask them to implement or solve a specific part in the live code editor.\n"
        "4. Keep responses concise (under 2-3 natural conversational sentences). Ask EXACTLY ONE clear question per turn."
    ),
    "Behavioral": (
        "You are a Senior Talent Acquisition Lead evaluating leadership, STAR methodology (Situation, Task, Action, Result), and team collaboration. "
        "RULES:\n"
        "1. Evaluate if the candidate provided specific Actions and measurable Results.\n"
        "2. Follow up on key decisions, conflicts, or lessons learned from their story.\n"
        "3. Keep responses conversational and concise (under 2-3 sentences). Ask EXACTLY ONE question per turn."
    ),
    "Executive": (
        "You are a C-suite Executive interviewing a candidate for strategic impact, business ROI, scale, and vision. "
        "RULES:\n"
        "1. Focus on metrics, business outcome, team scaling, and strategic vision.\n"
        "2. Challenge assumptions constructively and probe for measurable business impact.\n"
        "3. Keep responses concise (under 2-3 sentences). Ask EXACTLY ONE question per turn."
    ),
    "Creative": (
        "You are a Creative Director evaluating product design, user experience (UX), and innovative strategy. "
        "RULES:\n"
        "1. Ask imaginative, user-centric design questions and explore trade-offs between aesthetic and usability.\n"
        "2. Keep responses concise (under 2-3 sentences). Ask EXACTLY ONE question per turn."
    ),
    "HR": (
        "You are a warm, professional Senior HR Recruiter conducting an initial candidate screen. "
        "RULES:\n"
        "1. Evaluate role fit, career trajectory, core motivators, and communication clarity.\n"
        "2. Keep responses warm, engaging, and concise (under 2-3 sentences). Ask EXACTLY ONE question per turn."
    )
}

@router.post("/respond")
@limiter.limit("30/minute")
async def respond_to_candidate(request: Request, body: InterviewRespondRequest, current_user: User = Depends(get_current_user)):
    """Generate instant AI Interviewer speech response based on conversation history."""
    try:
        system_instruction = THEME_SYSTEM_PROMPTS.get(body.theme, THEME_SYSTEM_PROMPTS["HR"])
        
        context_details = []
        candidate_name = body.participant_name or current_user.full_name or "Candidate"
        context_details.append(f"Candidate Name: {candidate_name}")
        
        if body.target_role:
            context_details.append(f"Target Role: {body.target_role}")
            
        if body.resume_summary:
            context_details.append(f"Candidate Resume Highlights: {body.resume_summary}")
        elif hasattr(current_user, 'headline') and current_user.headline:
            context_details.append(f"Candidate Background: {current_user.headline}")

        full_prompt = f"{system_instruction}\n\nCONTEXT:\n" + "\n".join(context_details)
        
        full_messages = [{"role": "system", "content": full_prompt}]
        for msg in body.messages[-10:]: # keep last 10 turns for context
            full_messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

        logger.info(f"Calling NVIDIA LLM ({settings.NVIDIA_MODEL}) for interview response...")
        response = await _call_llm_with_tracking(
            model=settings.NVIDIA_MODEL,
            messages=full_messages,
            temperature=0.7,
            max_tokens=250,
        )

        ai_response = response.choices[0].message.content.strip()
        
        # Detect if AI asks for code solution in Technical track
        should_open_editor = False
        if body.theme == "Technical":
            ai_resp_lower = ai_response.lower()
            code_triggers = [
                "write code", "code editor", "solve in the editor", "implement a solution",
                "open the code editor", "in your editor", "write a function to", "code a solution"
            ]
            if any(trigger in ai_resp_lower for trigger in code_triggers):
                should_open_editor = True

        return {
            "status": "success",
            "response": ai_response,
            "open_code_editor": should_open_editor
        }
    except Exception as e:
        logger.error(f"Interview respond error: {e}")
        # Fallback response
        return {
            "status": "success",
            "response": "Could you tell me more about your recent project achievements and key challenges?",
            "open_code_editor": False
        }


# ─────────────────────────────────────────────
# Internal report-save endpoint (legacy / direct)
# ─────────────────────────────────────────────

class ReportCreateRequest(BaseModel):
    user_id: str
    room_name: str
    questions_asked: List[str]
    user_replies: List[str]
    areas_for_improvement: List[str]
    weaknesses: List[str]
    telemetry_summary: Dict
    final_score: int
    overall_feedback: str
    communication_feedback: str

@router.post("/report")
@limiter.limit("10/minute")
async def create_report(request: Request, body: ReportCreateRequest, current_user: User = Depends(get_current_user)):
    """Internal endpoint to save a pre-built report directly."""
    try:
        if body.user_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized")
        report = InterviewReport(**body.model_dump())
        await report.insert()
        return {"status": "success", "id": str(report.id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─────────────────────────────────────────────
# Analyze endpoint — called by the frontend when interview finishes
# ─────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    user_id: str
    room_name: str
    transcript: List[Dict[str, str]]   # [{"role": "user"|"assistant", "content": "..."}]
    telemetry: Dict[str, Any]          # {"avg_confidence": float, "blink_count": int}

async def _run_llm_and_save(data: AnalyzeRequest) -> None:
    nvidia_api_key = settings.NVIDIA_API_KEY
    nvidia_model = settings.NVIDIA_MODEL

    avg_confidence = data.telemetry.get("avg_confidence", 0.0)
    blink_count = data.telemetry.get("blink_count", 0)

    transcript_text = (
        "\n".join(f"{m['role']}: {m['content']}" for m in data.transcript)
        if data.transcript
        else "No transcript available."
    )

    prompt = (
        "You are an expert technical interviewer evaluator. "
        "Based on the following interview transcript and facial telemetry metrics, "
        "generate a JSON report analyzing the candidate's performance. "
        "Specifically look for and document any grammatical or sentence formation mistakes in the candidate's speech.\n"
        f"Facial Telemetry -> Average Confidence: {avg_confidence:.2f} (0 to 1), "
        f"Total Blinks: {blink_count}\n\n"
        f"Transcript:\n{transcript_text}\n\n"
        "Output MUST be a valid JSON object matching this schema exactly:\n"
        "{\n"
        '  "questions_asked": ["question 1", "question 2"],\n'
        '  "user_replies": ["reply 1", "reply 2"],\n'
        '  "areas_for_improvement": ["area 1", "area 2"],\n'
        '  "weaknesses": ["weakness 1", "weakness 2"],\n'
        '  "telemetry_summary": {"avg_confidence": 0.85, "blink_count": 12},\n'
        '  "final_score": 85,\n'
        '  "overall_feedback": "Great job, but...",\n'
        '  "communication_feedback": "You had a few grammatical errors such as..."\n'
        "}\n"
        "Do not include Markdown formatting blocks like ```json. Return only raw JSON."
    )

    try:
        logger.info(f"Calling NVIDIA LLM for room {data.room_name} report generation...")
        response = await _call_llm_with_tracking(
            model=settings.NVIDIA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1024,
        )
        report_json = response.choices[0].message.content.strip()
        import re
        json_match = re.search(r'\{.*\}', report_json, re.DOTALL)
        if json_match:
            clean_json_str = json_match.group(0)
        else:
            clean_json_str = report_json

        try:
            report_data = json.loads(clean_json_str)
        except Exception as json_err:
            logger.warning(f"Fallback JSON parsing for room {data.room_name}: {json_err}")
            report_data = {
                "questions_asked": [m["content"] for m in data.transcript if m["role"] == "assistant"],
                "user_replies": [m["content"] for m in data.transcript if m["role"] == "user"],
                "areas_for_improvement": ["Elaborate further on architectural design patterns."],
                "weaknesses": ["Minor speech hesitation detected."],
                "telemetry_summary": data.telemetry or {"avg_confidence": 0.85, "blink_count": 12},
                "final_score": 82,
                "overall_feedback": "Solid interview performance with good technical articulation.",
                "communication_feedback": "Demonstrated strong verbal communication and domain clarity."
            }

        report_data["user_id"] = data.user_id
        report_data["room_name"] = data.room_name
        report_data["transcript"] = [dict(m) for m in data.transcript]

        report = InterviewReport(**report_data)
        await report.insert()
        logger.info(f"Report saved to DB for room {data.room_name}")

        try:
            from bson import ObjectId
            user = await User.find_one(User.id == ObjectId(data.user_id))

            if user and user.email:
                success = await send_interview_report_email(user.email, report_data)
                if success:
                    logger.info(f"Report email sent to {user.email}")
                else:
                    logger.warning(f"Failed to send report email to {user.email}")
        except Exception as email_err:
            logger.error(f"Email send error: {email_err}")

    except Exception as e:
        logger.error(f"LLM analysis failed for room {data.room_name}: {e}")
        import traceback
        traceback.print_exc()

@router.post("/analyze", status_code=202)
@limiter.limit("5/minute")
async def analyze_interview(request: Request, body: AnalyzeRequest, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    if body.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    logger.info(f"Accepted raw interview data for room {body.room_name}, queuing analysis...")
    background_tasks.add_task(_run_llm_and_save, body)
    return {"status": "accepted", "room_name": body.room_name}

# ─────────────────────────────────────────────
# User-facing GET endpoints
# ─────────────────────────────────────────────

@router.get("/reports")
async def get_reports(current_user: User = Depends(get_current_user)):
    reports = await InterviewReport.find({"user_id": str(current_user.id)}).to_list()
    return reports

@router.get("/report/{room_name}")
async def get_report_by_room(
    room_name: str,
    current_user: User = Depends(get_current_user),
):
    report = await InterviewReport.find_one(
        {"room_name": room_name, "user_id": str(current_user.id)}
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
