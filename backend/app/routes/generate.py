"""
/api/generate
-------------
Generates test cases (manual or automation) from a requirement/ticket.
"""

import os
import uuid
from datetime import date

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional

from app.services.gemini_service import generate_test_cases
from app.utils.excel_utils import build_test_case_excel

router = APIRouter()

OUTPUT_DIR = os.path.join(
    os.path.dirname(__file__), "..", "..", "outputs"
)
os.makedirs(OUTPUT_DIR, exist_ok=True)


class GenerateRequest(BaseModel):
    ticket_number: str = ""
    requirement:   str = ""   # optional when file_paths are provided
    module:        str = ""
    version:       str = "1"
    created_by:    str = "<name>"
    tc_type:       str = "manual"   # "manual" | "automation"
    app_url:       str = ""
    file_paths:    List[str] = []   # server paths from /upload


class GenerateResponse(BaseModel):
    test_cases:  list
    summary:     dict
    excel_file:  str   # relative URL to download


@router.post("/", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    if not req.requirement.strip() and not req.file_paths:
        raise HTTPException(
            status_code=400,
            detail="Please provide a requirement text or attach at least one document.",
        )
    try:
        result = generate_test_cases(
            ticket_number=req.ticket_number,
            requirement=req.requirement,
            module=req.module,
            version=req.version,
            created_by=req.created_by,
            file_paths=req.file_paths,
            tc_type=req.tc_type,
            app_url=req.app_url,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    test_cases = result["test_cases"]
    summary    = result.get("summary", {})

    if not test_cases:
        raise HTTPException(
            status_code=422,
            detail="AI returned no test cases. Check your requirement or API key.",
        )

    # Build Excel
    today = date.today().strftime("%Y%m%d")
    fname = f"testcases_{req.ticket_number or 'TC'}_{today}_{uuid.uuid4().hex[:6]}.xlsx"
    output_path = os.path.join(OUTPUT_DIR, fname)

    metadata = {
        "ticket_number": req.ticket_number,
        "module":        req.module,
        "version":       req.version,
        "created_by":    req.created_by,
        "summary": {
            "not_run": len(test_cases),
            "passed":  0,
            "failed":  0,
            "skipped": 0,
            "blocked": 0,
        },
    }
    build_test_case_excel(test_cases, metadata, output_path)

    return GenerateResponse(
        test_cases=test_cases,
        summary=summary,
        excel_file=f"/outputs/{fname}",
    )
