from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, Request
from pydantic import BaseModel
from typing import Dict, Any, Optional

import fitz # PyMuPDF
from beanie import PydanticObjectId
from app.models.resume import Resume
from app.models.user import User

from app.services import ai_service
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/cover-letter", tags=["Cover Letter"])

class CoverLetterResponse(BaseModel):
    cover_letter: str

@router.post("/generate", response_model=CoverLetterResponse)
async def generate_cover_letter(
    job_description: str = Form(""),
    resume_id: Optional[str] = Form(None),
    resume_file: Optional[UploadFile] = File(None),
    user: User = Depends(get_current_user)
):
    """Generate a tailored cover letter using the AI service."""
    if not job_description or not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required.")

    resume_text = ""
    clean_resume_id = (resume_id or "").strip()

    if clean_resume_id and clean_resume_id not in ("null", "undefined", "new"):
        try:
            resume = await Resume.get(PydanticObjectId(clean_resume_id))
            if not resume or resume.user_id != user.id:
                raise HTTPException(status_code=404, detail="Resume not found.")
            resume_text = resume.extracted_text or ""
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid resume ID.")
    elif resume_file and resume_file.filename:
        if not resume_file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")

        try:
            content = await resume_file.read()
            doc = fitz.open(stream=content, filetype="pdf")
            for page in doc:
                resume_text += page.get_text() + "\n"
            doc.close()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Either an existing resume or a PDF file must be provided.")

    if not resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not extract readable text from the provided resume. Please ensure the PDF is text-based and contains readable content."
        )

    try:
        content = await ai_service.generate_cover_letter(
            resume_text=resume_text.strip(),
            job_description=job_description.strip()
        )
        return {"cover_letter": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate cover letter: {str(e)}")

