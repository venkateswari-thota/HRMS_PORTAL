from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import uuid

router = APIRouter(tags=["Uploads"])

UPLOAD_DIR = "backend/static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    # Validate image
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    
    # Generate unique name
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Return URL (Relative to server root)
    return {"url": f"/static/uploads/{filename}"}
