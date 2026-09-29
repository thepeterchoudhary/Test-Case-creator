"""
/api/upload
-----------
Accepts one or more files and returns their server-side paths for subsequent use.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from app.utils.file_utils import save_upload

router = APIRouter()


@router.post("/")
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Upload one or more files.
    Returns a list of {filename, path, size} objects.
    """
    results = []
    for upload in files:
        try:
            content = await upload.read()
            path = save_upload(content, upload.filename)
            results.append({
                "original_name": upload.filename,
                "server_path": path,
                "size_bytes": len(content),
            })
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save {upload.filename}: {str(e)}")

    return {"uploaded": results}
