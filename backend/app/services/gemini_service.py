"""
Gemini AI Service
-----------------
Uses the current google-genai SDK (v2.x).
The provider is isolated here so it can be swapped out later.
"""

import os
import json
import re
import base64
import mimetypes
from pathlib import Path
from typing import Optional

from google import genai
from google.genai import types as gtypes
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL    = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
FALLBACK_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
]


def _get_client() -> genai.Client:
    if not GEMINI_API_KEY:
        raise ValueError(
            "GEMINI_API_KEY is not set. "
            "Please add it to the .env file in the backend folder."
        )
    return genai.Client(api_key=GEMINI_API_KEY)


def _clean_json(raw: str) -> str:
    """Strip markdown code fences that Gemini sometimes wraps JSON in."""
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return raw.strip()


def _repair_truncated_json(raw: str) -> str:
    """
    Attempt to repair a JSON string that was truncated mid-stream.
    Strategy: find the last complete test_case object and close the structure.
    """
    # Find the last complete closing brace for a test case object
    # Walk backwards to find the last valid '}' that closes a test case
    depth = 0
    last_good_pos = -1
    in_string = False
    escape_next = False

    for i, ch in enumerate(raw):
        if escape_next:
            escape_next = False
            continue
        if ch == '\\' and in_string:
            escape_next = True
            continue
        if ch == '"' and not escape_next:
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 1:
                # We're back at the top-level object depth — a test case just closed
                last_good_pos = i

    if last_good_pos == -1:
        return raw  # Can't repair, return as-is

    # Truncate to the last complete test case and close the JSON structure
    repaired = raw[:last_good_pos + 1]

    # Close the test_cases array and the root object with a minimal summary
    repaired += (
        '\n  ],\n'
        '  "summary": {\n'
        '    "total": 0,\n'
        '    "high": 0, "medium": 0, "low": 0,\n'
        '    "assumptions": [],\n'
        '    "missing_info": [],\n'
        '    "coverage_notes": "Response was truncated by the model — partial results returned."\n'
        '  }\n'
        '}'
    )
    return repaired


def _parse_json_response(raw: str) -> dict:
    """
    Robustly parse a JSON response from Gemini.
    Tries clean parse first, then truncation repair, then regex extraction.
    """
    cleaned = _clean_json(raw)

    # Attempt 1: clean parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Attempt 2: repair truncated JSON
    try:
        repaired = _repair_truncated_json(cleaned)
        return json.loads(repaired)
    except (json.JSONDecodeError, Exception):
        pass

    # Attempt 3: extract whatever JSON object exists via regex
    match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    # Attempt 4: extract just the test_cases array
    array_match = re.search(r'"test_cases"\s*:\s*(\[.*?\])', cleaned, re.DOTALL)
    if array_match:
        try:
            tcs = json.loads(array_match.group(1))
            return {"test_cases": tcs, "summary": {}}
        except json.JSONDecodeError:
            pass

    return {}


def _read_file_parts(file_path: str) -> list:
    """
    Convert an uploaded file into Gemini content parts.
    Returns a list of Part objects or plain strings.
    """
    path = Path(file_path)
    if not path.exists():
        return []

    suffix = path.suffix.lower()
    mime, _ = mimetypes.guess_type(str(path))

    # Images – inline data
    if suffix in (".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"):
        with open(path, "rb") as f:
            data = f.read()
        mime = mime or "image/png"
        return [gtypes.Part.from_bytes(data=data, mime_type=mime)]

    # PDF – inline data
    if suffix == ".pdf":
        with open(path, "rb") as f:
            data = f.read()
        return [gtypes.Part.from_bytes(data=data, mime_type="application/pdf")]

    # Plain text
    if suffix in (".txt", ".csv", ".md"):
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
            return [f"\n[Attached file: {path.name}]\n{text}\n"]
        except Exception:
            return []

    # DOCX
    if suffix in (".doc", ".docx"):
        try:
            import docx
            doc = docx.Document(str(path))
            text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
            return [f"\n[Attached DOCX: {path.name}]\n{text}\n"]
        except Exception:
            return [f"\n[Attached DOCX: {path.name} – could not extract text]\n"]

    # Excel
    if suffix in (".xls", ".xlsx"):
        try:
            import openpyxl
            wb = openpyxl.load_workbook(str(path), data_only=True)
            parts = [f"\n[Attached Excel: {path.name}]\n"]
            for sheet in wb.sheetnames:
                ws = wb[sheet]
                parts.append(f"\n--- Sheet: {sheet} ---\n")
                for row in ws.iter_rows(values_only=True):
                    row_text = " | ".join(
                        str(c) if c is not None else "" for c in row
                    )
                    if row_text.strip(" |"):
                        parts.append(row_text + "\n")
            return parts
        except Exception:
            return [f"\n[Attached Excel: {path.name} – could not extract text]\n"]

    return []


def _generate(prompt_parts: list, file_paths: list[str]) -> str:
    """
    Build a single Content object and call Gemini.
    Automatically falls back through FALLBACK_MODELS on 503/404.
    """
    client = _get_client()

    all_parts: list[gtypes.Part] = []

    for p in prompt_parts:
        if isinstance(p, str):
            all_parts.append(gtypes.Part.from_text(text=p))
        elif isinstance(p, gtypes.Part):
            all_parts.append(p)

    for fp in file_paths:
        for part in _read_file_parts(fp):
            if isinstance(part, str):
                all_parts.append(gtypes.Part.from_text(text=part))
            elif isinstance(part, gtypes.Part):
                all_parts.append(part)

    if not all_parts:
        raise ValueError("No content to send to Gemini.")

    content = gtypes.Content(role="user", parts=all_parts)

    # Build the ordered list of models to try
    models_to_try = [GEMINI_MODEL] + [m for m in FALLBACK_MODELS if m != GEMINI_MODEL]

    last_error = None
    for model in models_to_try:
        try:
            response = client.models.generate_content(
                model=model,
                contents=[content],
                config=gtypes.GenerateContentConfig(
                    temperature=0.3,
                    max_output_tokens=16384,
                ),
            )
            # response.text can be None when output tokens are exhausted
            if response.text is None:
                try:
                    return response.candidates[0].content.parts[0].text or ""
                except Exception:
                    return ""
            return response.text

        except Exception as e:
            err_str = str(e)
            # Retry with next model only for availability / not-found errors
            if any(code in err_str for code in ["503", "UNAVAILABLE", "404", "NOT_FOUND"]):
                last_error = e
                continue
            # Any other error (auth, quota, bad request) – raise immediately
            raise

    raise RuntimeError(
        f"All Gemini models are currently unavailable. Last error: {last_error}"
    )


# ---------------------------------------------------------------------------
# Shared system persona
# ---------------------------------------------------------------------------
SYSTEM_PERSONA = (
    "You are a Senior QA Engineer with 15+ years of experience in software testing. "
    "You think like an experienced QA professional – beyond the literal requirement text "
    "you identify realistic testing risks, edge cases, and quality gaps. "
    "You write professional, clear, atomic, and reproducible test cases. "
    "You never invent unsupported business requirements, but you do make reasonable QA assumptions "
    "when details are missing, and you clearly mark them as assumptions."
)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def _normalize_generated_test_cases(test_cases: list[dict]) -> list[dict]:
    """Return generated cases using only the sample workbook's 11 fields."""
    priority_aliases = {"HIGH": "P1", "MEDIUM": "P2", "LOW": "P3"}
    normalized = []
    for index, case in enumerate(test_cases, start=1):
        if not isinstance(case, dict):
            continue
        priority = str(case.get("priority", "P2")).strip().upper()
        priority = priority_aliases.get(priority, priority)
        if priority not in {"P1", "P2", "P3"}:
            priority = "P2"
        normalized.append({
            "test_case_id": f"TC_{index:03d}",
            "title": case.get("title", ""),
            "description_scenario": case.get("description_scenario", ""),
            "precondition": case.get("precondition", ""),
            "test_steps": case.get("test_steps", ""),
            "expected_results": case.get("expected_results", ""),
            "status": "NOT RUN",
            "actual_results": "",
            "bug_ticket_link": case.get("bug_ticket_link", ""),
            "priority": priority,
            "remarks": case.get("remarks", ""),
        })
    return normalized

def generate_test_cases(
    ticket_number: str,
    requirement:   str,
    module:        str,
    version:       str,
    created_by:    str,
    file_paths:    list[str],
    tc_type:       str = "manual",
    app_url:       str = "",
) -> dict:
    type_instruction = ""
    if tc_type == "automation":
        type_instruction = (
            "\nFocus on AUTOMATION test cases. Identify automation candidates, "
            "user actions, assertions, test data, and regression candidates. "
            "Skip scenarios clearly unsuitable for automation."
        )
        if app_url:
            type_instruction += f"\nApplication URL: {app_url}"
    else:
        type_instruction = "\nGenerate comprehensive MANUAL test cases."

    prompt = f"""{SYSTEM_PERSONA}

## Task: Generate Test Cases

Ticket Number: {ticket_number}
Module / Functionality Area: {module}
Version: {version}
Created By: {created_by}

## Requirement / Acceptance Criteria:
{requirement if requirement.strip() else "[No text requirement provided — please analyse the attached document(s) and extract all requirements, acceptance criteria, user journeys, and business rules from them to generate test cases.]"}
{type_instruction}

## Coverage Required:
- Functional: positive, negative, happy path, alternate flows, business rules
- UI: field validations, buttons, labels, messages, dropdowns, tables, pagination, sorting, filtering, navigation
- Boundary & Edge Cases: min, max, empty, null, special characters, invalid formats, duplicates, large input
- Error Handling: invalid input, missing fields, server errors, timeouts, session expiration
- Security (where applicable): auth, authorization, role-based access, unauthorized access
- Data Validation: create/update/delete, duplicates, data integrity
- Integration (where applicable): API, third-party, notifications
- Regression: scenarios affected by this change

## Mandatory Test Case Format:
Use only these 11 fields for each test case, in this exact order. Do not add,
rename, remove, or reorder fields:
1. test_case_id (TC_001, TC_002, ...)
2. title
3. description_scenario
4. precondition
5. test_steps
6. expected_results
7. status (always "NOT RUN" for newly generated cases)
8. actual_results (empty string)
9. bug_ticket_link (empty string unless a defect link is provided)
10. priority (P1, P2, or P3 only; P1=highest, P3=lowest)
11. remarks (empty string unless a concise note is needed)
The generated Excel must use the supplied sample workbook's layout and exact
column headings. Do not substitute another test-case format.

## Output Format (pure JSON, no markdown fences):
{{
  "test_cases": [
    {{
      "test_case_id": "TC_001",
      "title": "Short descriptive title",
      "description_scenario": "Detailed scenario description",
      "precondition": "Any required preconditions",
      "test_steps": "1. Step one\\n2. Step two\\n3. Step three",
      "expected_results": "Precise, measurable expected outcome",
    "status": "NOT RUN",
    "actual_results": "",
    "bug_ticket_link": "",
    "priority": "P1|P2|P3",
    "remarks": ""
    }}
  ],
  "summary": {{
    "total": 0,
    "high": 0,
    "medium": 0,
    "low": 0,
    "assumptions": [],
    "missing_info": [],
    "coverage_notes": ""
  }}
}}

Rules:
- test_case_id format: TC_001, TC_002, ...
- Use only the 11 test-case fields and exact order listed above
- Status must be NOT RUN; priority must be P1, P2, or P3
- Each test case must be clear, unique, atomic, reproducible, and professionally written
- Expected results must be specific – never write "system should work correctly"
- Output ONLY the JSON object, no other text, no markdown fences
"""

    raw = _generate([prompt], file_paths)

    parsed = _parse_json_response(raw)
    return {
        "test_cases":   _normalize_generated_test_cases(parsed.get("test_cases", [])),
        "summary":      parsed.get("summary", {}),
        "raw_response": raw,
    }


def review_test_cases(
    original_test_cases: list[dict],
    execution_notes:     str,
    file_paths:          list[str],
    user_instruction:    str = "",
) -> dict:
    tc_json = json.dumps(original_test_cases, indent=2)

    prompt = f"""{SYSTEM_PERSONA}

## Task: Review Executed Test Cases

{"## User Instruction:" + chr(10) + user_instruction + chr(10) if user_instruction else ""}
{"## Execution Notes:" + chr(10) + execution_notes + chr(10) if execution_notes else ""}

## Test Cases to Review:
{tc_json}

## Review Checklist:
- Was the test case executed correctly?
- Does the actual result match the expected result?
- Is the Pass/Fail status correct?
- Does evidence support the result?
- Is the test case itself correct?
- Were any important scenarios missed?
- Does the test case need modification?
- Is any defect report valid based on evidence?

## Output Format (pure JSON, no markdown fences):
{{
  "reviewed_test_cases": [
    {{
      "test_case_id": "TC_001",
      "title": "...",
      "description_scenario": "...",
      "precondition": "...",
      "test_steps": "...",
      "expected_results": "...",
    "status": "Pass|Fail|Blocked|Skip|NOT RUN",
      "actual_results": "...",
      "bug_ticket_link": "",
    "priority": "P1|P2|P3",
      "remarks": "Review comment or correction note",
      "review_action": "No Change|Modified|Added|Flagged",
      "review_comments": "Detailed review comments"
    }}
  ],
  "review_summary": {{
    "total": 0,
    "passed": 0,
    "failed": 0,
    "blocked": 0,
    "skipped": 0,
    "not_run": 0,
    "added": 0,
    "modified": 0,
    "overall_comments": ""
  }}
}}

Output ONLY the JSON object, no other text.
"""

    raw = _generate([prompt], file_paths)

    parsed = _parse_json_response(raw)
    return {
        "reviewed_test_cases": parsed.get("reviewed_test_cases", []),
        "review_summary":      parsed.get("review_summary", {}),
        "raw_response":        raw,
    }


def generate_signoff(
    ticket_number:    str,
    module:           str,
    requirement:      str,
    review_summary:   dict,
    reviewed_test_cases: list[dict],
    template_text:    str = "",
) -> str:
    tc_summary_str = json.dumps(review_summary, indent=2)
    test_cases_str = json.dumps(reviewed_test_cases, indent=2)

    prompt = f"""{SYSTEM_PERSONA}

## Task: Generate QA Sign-Off Document

Ticket Number: {ticket_number}
Module: {module}
Requirement Summary: {requirement}

## Test Execution Summary:
{tc_summary_str}

## Reviewed Test Cases:
{test_cases_str}

## Additional User Notes (content only; do not change the required format):
{template_text or "None"}

## Mandatory Sign-Off Format:
Use the exact paragraph structure of the provided Signoff_Document_TSTD_2950.docx:

Sign-off Document
Scenario 1: [Concise scenario title]
[One paragraph describing the actual verification outcome, matching the execution evidence.]
Video Evidence: [Add link here]
Scenario 2: [Concise scenario title]
[One paragraph describing the actual verification outcome.]
Video Evidence: [Add link here]

Repeat the three-line scenario block for each distinct tested flow or meaningful result.
Do not add tables, metadata sections, counts, conclusions, QA recommendations, or other headings.
Use "Verified that ..." only for passed execution. Describe failures, blocks, and skipped cases accurately.
Keep the evidence line exactly "Video Evidence: [Add link here]" unless an evidence link is supplied.
Return only plain text in this format. Do not use Markdown headings, bullets, or code fences.
"""

    return _generate([prompt], [])
