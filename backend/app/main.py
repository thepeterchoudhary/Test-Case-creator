from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import generate, review, signoff, upload
import os

app = FastAPI(
    title="AI Test Case Generator",
    description="AI-powered test case generation and review system using Gemini",
    version="1.0.0",
)

# CORS – allow the React dev server
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    # Add your Vercel frontend URL here after deploying:
    # "https://your-app.vercel.app",
]

# Also read from env variable so you don't need to redeploy backend
import os as _os
_extra = _os.getenv("ALLOWED_ORIGIN", "")
if _extra:
    ALLOWED_ORIGINS.append(_extra)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated output files
os.makedirs("outputs", exist_ok=True)
os.makedirs("uploads", exist_ok=True)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# Routers
app.include_router(upload.router,   prefix="/api/upload",   tags=["Upload"])
app.include_router(generate.router, prefix="/api/generate", tags=["Generate"])
app.include_router(review.router,   prefix="/api/review",   tags=["Review"])
app.include_router(signoff.router,  prefix="/api/signoff",  tags=["SignOff"])


@app.get("/api/health")
def health():
    return {"status": "ok", "message": "AI Test Case Generator is running"}
