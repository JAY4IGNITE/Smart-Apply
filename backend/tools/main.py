import os
import sys
import logging
from contextlib import asynccontextmanager

# Add parent directory to sys.path so app modules are resolvable
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.rate_limiter import limiter
from app.config import settings
from app.database import close_db, init_db
from app.routers import resume_maker, cover_letter, code_execution, upload

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(name)s - %(message)s")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle for Tools & Export Service."""
    if settings.ENVIRONMENT == "production":
        assert settings.SECRET_KEY != "change-this-in-production", "SECRET_KEY must be changed in production"

    await init_db()
    yield
    await close_db()

app = FastAPI(
    title="Smart Apply - Tools & Export Service",
    description="Tools backend microservice for PDF generation, cover letter export, code execution sandbox, and uploads.",
    version="1.0.0",
    lifespan=lifespan,
)

@app.middleware("http")
async def set_secure_headers(request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──
origins = [
    "https://www.smartapplies.app",
    "https://smartapplies.app",
    "https://smartapply-frontend.onrender.com",
]
if settings.FRONTEND_URL and settings.FRONTEND_URL not in origins:
    origins.append(settings.FRONTEND_URL)

if settings.ENVIRONMENT != "production":
    origins.extend(["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://localhost:8000", "http://localhost:8001", "http://localhost:8002"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.api_route("/ping", methods=["GET", "HEAD", "POST", "OPTIONS"])
async def ping():
    return {"status": "ok", "service": "tools"}

# ── Tools & Export API Routers ──
app.include_router(resume_maker.router)
app.include_router(cover_letter.router)
app.include_router(code_execution.router)
app.include_router(upload.router)
