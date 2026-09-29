"""
/api/review
-----------
Reviews already-generated test cases after manual execution.
"""

import os
import uuid
from datetime import date

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from app.services.gemini_service import review_test_cases
from app.utils.excel_utils import build_review_excel

router = APIRouter()

OUTPUT_DIR = os.path.join(
    os.path.dirname(__file__), "..", "..", "outputs"
)
os.makedirs(OUTPUT_DIR, exist_ok=True)


class ReviewRequest(BaseModel):
    original_test_cases: List[dict]
    execution_notes:     str = ""
    user_instruction:    str = ""
    file_paths:          List[str] = []   # executed Excel + screenshots
    # metadata for Excel header
    ticket_number: str = ""
    module:        str = ""
    version:       str = "1"
    created_by:    str = "<name>"


class ReviewResponse(BaseModel):
    reviewed_test_cases: list
    review_summary:      dict
    excel_file:          str


@router.post("/", response_model=ReviewResponse)
async def review(req: ReviewRequest):
    try:
        result = review_test_cases(
            original_test_cases=req.original_test_cases,
            execution_notes=req.execution_notes,
            file_paths=req.file_paths,
            user_instruction=req.user_instruction,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI review failed: {str(e)}")

    reviewed   = result["reviewed_test_cases"]
    rev_summary = result.get("review_summary", {})

    if not reviewed:
        raise HTTPException(status_code=422, detail="AI returned no reviewed test cases.")

    today = date.today().strftime("%Y%m%d")
    fname = f"reviewed_{req.ticket_number or 'TC'}_{today}_{uuid.uuid4().hex[:6]}.xlsx"
    output_path = os.path.join(OUTPUT_DIR, fname)

    metadata = {
        "ticket_number": req.ticket_number,
        "module":        req.module,
        "version":       req.version,
        "created_by":    req.created_by,
        "executed_by":   req.created_by,
        "summary": {
            "not_run": rev_summary.get("not_run", 0),
            "passed":  rev_summary.get("passed", 0),
            "failed":  rev_summary.get("failed", 0),
            "skipped": rev_summary.get("skipped", 0),
            "blocked": rev_summary.get("blocked", 0),
        },
    }
    build_review_excel(reviewed, metadata, output_path)

    return ReviewResponse(
        reviewed_test_cases=reviewed,
        review_summary=rev_summary,
        excel_file=f"/outputs/{fname}",
    )
