from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class AtsCheckRequest(BaseModel):
    resume_text: str
    job_description: str


class AtsCheckResponse(BaseModel):
    score: int = 0
    matched_keywords: List[str] = []
    missing_keywords: List[str] = []
    suggestions: List[str] = []


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    reply: str


class InterviewQuestionRequest(BaseModel):
    role: str
    difficulty: str  # "easy", "medium", "hard"


class InterviewQuestionResponse(BaseModel):
    question: str
    category: str = ""
    tips: str = ""


class InterviewEvaluateRequest(BaseModel):
    question: str
    answer: str
    role: str


class InterviewEvaluateResponse(BaseModel):
    score: int = 0
    strengths: List[str] = []
    weaknesses: List[str] = []
    improved_answer: str = ""


class IdeaClarificationQuestion(BaseModel):
    id: str
    question: str
    options: List[str] = []
    purpose: str = ""


class IdeaAnalyzeRequest(BaseModel):
    raw_idea: str
    target_format: Optional[str] = "cursor"


class IdeaAnalyzeResponse(BaseModel):
    refined_title: str
    one_liner: str
    category: str
    estimated_complexity: int = 5
    suggested_stack: List[str] = []
    initial_analysis: str = ""
    clarifying_questions: List[IdeaClarificationQuestion] = []


class IdeaPromptGenerateRequest(BaseModel):
    raw_idea: str
    refined_title: Optional[str] = ""
    target_format: str = "cursor"  # "cursor", "v0", "claude", "architecture"
    clarification_answers: Optional[Dict[str, str]] = {}
    additional_notes: Optional[str] = ""


class IdeaPromptGenerateResponse(BaseModel):
    prompt_title: str
    target_format: str
    master_prompt: str
    suggested_filename: str
    architecture_summary: Dict[str, Any] = {}

