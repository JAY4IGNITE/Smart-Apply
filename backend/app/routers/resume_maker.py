import json
import os
import subprocess
import tempfile
import logging
from typing import Dict, Any, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, Response
from starlette.concurrency import run_in_threadpool
from beanie import PydanticObjectId
import urllib.parse
import filetype

from app.middleware.auth_middleware import get_current_user
from app.middleware.admin_middleware import get_admin_user
from app.models.resume_template import ResumeTemplate
from app.models.resume import Resume
from app.models.user import User
from app.services import storage_service, ai_service, latex_service
from app.rate_limiter import limiter
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class SmartFillRequest(BaseModel):
    resume_id: Optional[str] = None

router = APIRouter(prefix="/api/resume-maker", tags=["resume-maker"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.get("/templates")
@limiter.limit("20/minute")
async def get_templates(request: Request, user: User = Depends(get_current_user)):
    """Fetch all available resume templates."""
    templates = await ResumeTemplate.find_all().to_list()
    return {"templates": templates}


@router.post("/templates")
@limiter.limit("5/minute")
async def create_template(
    request: Request,
    name: str = Form(...),
    description: str = Form(""),
    latex_code: str = Form(...),
    required_fields: str = Form("[]"),  # JSON string of list of strings
    image: UploadFile = File(...),
    user: User = Depends(get_admin_user)
):
    """(Admin only) Create a new resume template."""
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WEBP images are allowed")

    contents = await image.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image size exceeds 5 MB limit")

    kind = filetype.guess(contents)
    if kind is None or kind.mime not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid image content")

    try:
        parsed_fields = json.loads(required_fields)
        if not isinstance(parsed_fields, list):
            raise ValueError
    except Exception:
        raise HTTPException(status_code=400, detail="required_fields must be a JSON array of strings")

    safe_filename = urllib.parse.quote(image.filename or "template.png")
    
    # Upload to R2 / Cloud
    key = await run_in_threadpool(
        storage_service.upload_file,
        file_bytes=contents,
        original_filename=safe_filename,
        folder="resume_templates",
        content_type=kind.mime,
    )
    url = storage_service.get_file_url(key)

    template = ResumeTemplate(
        name=name,
        description=description,
        image_url=url,
        latex_code=latex_code,
        required_fields=parsed_fields
    )
    await template.insert()

    return {"message": "Template created successfully", "template": template}


@router.post("/templates/{template_id}/compile")
@limiter.limit("5/minute")
async def compile_template(
    request: Request,
    template_id: str,
    data: Dict[str, Any],
    user: User = Depends(get_current_user)
):
    """Compile a resume template with user data."""
    try:
        template = await ResumeTemplate.get(PydanticObjectId(template_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Template ID")
        
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Replace placeholders. e.g. {{Name}} -> John Doe
    latex_content = template.latex_code
    for field in template.required_fields:
        value = data.get(field, "")
        value = str(value).replace("&", "\\&").replace("%", "\\%").replace("$", "\\$")
        latex_content = latex_content.replace(f"{{{{{field}}}}}", value)

    def run_pdflatex():
        temp_dir = tempfile.mkdtemp()
        tex_file_path = os.path.join(temp_dir, "resume.tex")
        pdf_file_path = os.path.join(temp_dir, "resume.pdf")

        with open(tex_file_path, "w", encoding="utf-8") as f:
            f.write(latex_content)

        try:
            subprocess.run(
                ["pdflatex", "-interaction=nonstopmode", "resume.tex"],
                cwd=temp_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True,
                timeout=15
            )
            subprocess.run(
                ["pdflatex", "-interaction=nonstopmode", "resume.tex"],
                cwd=temp_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True,
                timeout=15
            )
        except subprocess.CalledProcessError as e:
            log_path = os.path.join(temp_dir, "resume.log")
            log_content = ""
            if os.path.exists(log_path):
                with open(log_path, "r", encoding="utf-8") as f:
                    log_content = f.read()
            raise ValueError(f"LaTeX compilation failed: {e.stderr.decode('utf-8')}\nLog: {log_content}")
        except FileNotFoundError:
            raise ValueError("pdflatex command not found.")
        except subprocess.TimeoutExpired:
            raise ValueError("LaTeX compilation timed out.")

        if not os.path.exists(pdf_file_path):
            raise ValueError("PDF file was not generated.")

        with open(pdf_file_path, "rb") as pf:
            return pf.read()

    # Prefer cloud compilation (works on Render without texlive), fallback to local pdflatex
    pdf_bytes = None
    cloud_error = None
    try:
        pdf_bytes = await latex_service.compile_latex_to_pdf(latex_content)
    except Exception as e:
        cloud_error = str(e)
        logger.warning(f"Cloud LaTeX compilation failed ({cloud_error}), falling back to local pdflatex...")

    if not pdf_bytes:
        try:
            pdf_bytes = await run_in_threadpool(run_pdflatex)
        except Exception as local_e:
            err_msg = cloud_error or str(local_e)
            raise HTTPException(status_code=500, detail=f"Failed to compile LaTeX: {err_msg}")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=resume.pdf"}
    )

@router.post("/templates/{template_id}/smart-fill")
@limiter.limit("5/minute")
async def smart_fill_template(
    request: Request,
    template_id: str,
    payload: SmartFillRequest,
    user: User = Depends(get_current_user)
):
    """Smart fill a resume template form using an existing parsed resume."""
    try:
        template = await ResumeTemplate.get(PydanticObjectId(template_id))
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
            
        resume_text = ""
        if payload.resume_id:
            resume = await Resume.get(PydanticObjectId(payload.resume_id))
            if resume and resume.user_id == user.id:
                resume_text = resume.extracted_text

        user_profile = {
            "full_name": user.full_name,
            "bio": user.bio,
            "phone": user.phone,
            "skills": user.skills,
            "education": [dict(e) for e in user.education] if user.education else [],
            "experience": [dict(e) for e in user.experience] if user.experience else [],
            "linkedin_url": user.linkedin_url,
            "github_url": user.github_url,
            "portfolio_url": user.portfolio_url
        }
            
        filled_data = await ai_service.smart_fill_resume_fields(
            resume_text=resume_text, 
            required_fields=template.required_fields,
            user_profile=user_profile
        )
        
        return {"filled_data": filled_data}
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to smart fill: {str(e)}")
