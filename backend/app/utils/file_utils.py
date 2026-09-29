"""
File Utilities
--------------
Handles saving uploaded files and extracting plain text from them.
"""

import os
import uuid
from pathlib import Path

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def save_upload(file_bytes: bytes, original_filename: str) -> str:
    """Save uploaded bytes to disk and return the full path."""
    ext = Path(original_filename).suffix
    filename = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(file_bytes)
    return path


def extract_text(file_path: str) -> str:
    """Best-effort text extraction from any supported file type."""
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix in (".txt", ".csv", ".md"):
        return path.read_text(encoding="utf-8", errors="ignore")

    if suffix in (".doc", ".docx"):
        try:
            import docx
            doc = docx.Document(str(path))
            return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        except Exception:
            return ""

    if suffix in (".xls", ".xlsx"):
        try:
            import openpyxl
            wb = openpyxl.load_workbook(str(path), data_only=True)
            lines = []
            for sheet in wb.sheetnames:
                ws = wb[sheet]
                for row in ws.iter_rows(values_only=True):
                    row_text = " | ".join(str(c) if c is not None else "" for c in row)
                    if row_text.strip(" |"):
                        lines.append(row_text)
            return "\n".join(lines)
        except Exception:
            return ""

    if suffix == ".pdf":
        try:
            import pdfplumber
            with pdfplumber.open(str(path)) as pdf:
                return "\n".join(
                    page.extract_text() or "" for page in pdf.pages
                )
        except Exception:
            return ""

    return ""
