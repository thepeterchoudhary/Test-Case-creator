"""
/api/signoff
------------
Generates the QA Sign-Off document (Excel + plain text).
"""

import os
import uuid
from datetime import date

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from app.services.gemini_service import generate_signoff
from app.utils.excel_utils import build_signoff_excel

router = APIRouter()

OUTPUT_DIR = os.path.join(
    os.path.dirname(__file__), "..", "..", "outputs"
)
os.makedirs(OUTPUT_DIR, exist_ok=True)


class SignOffRequest(BaseModel):
    ticket_number:       str = ""
    module:              str = ""
    requirement_summary: str = ""
    review_summary:      dict = {}
    reviewed_test_cases: List[dict] = []
    template_text:       str = ""   # user-provided sign-off template text
    created_by:          str = "<name>"


class SignOffResponse(BaseModel):
    signoff_text: str
    excel_file:   str


@router.post("/", response_model=SignOffResponse)
async def signoff(req: SignOffRequest):
    try:
        text = generate_signoff(
            ticket_number=req.ticket_number,
            module=req.module,
            requirement=req.requirement_summary,
            review_summary=req.review_summary,
            reviewed_test_cases=req.reviewed_test_cases,
            template_text=req.template_text,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sign-off generation failed: {str(e)}")

    today = date.today().strftime("%Y%m%d")
    fname = f"signoff_{req.ticket_number or 'QA'}_{today}_{uuid.uuid4().hex[:6]}.xlsx"
    output_path = os.path.join(OUTPUT_DIR, fname)

    metadata = {
        "ticket_number": req.ticket_number,
        "module":        req.module,
        "created_by":    req.created_by,
    }
    build_signoff_excel(text, metadata, output_path)

    return SignOffResponse(
        signoff_text=text,
        excel_file=f"/outputs/{fname}",
    )
