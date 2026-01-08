from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, UploadFile, File, Form
from pydantic import BaseModel, EmailStr
from typing import List
from backend.models import Employee, Admin
from backend.utils import create_access_token, get_password_hash
from backend.s3_service import S3Service
import random
import string

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

from backend.email_utils import send_credentials_email

# Allowed image formats
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
MIN_IMAGES = 3
MAX_IMAGES = 6

def generate_random_password(length=8):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

def validate_image_file(file: UploadFile) -> bool:
    """Validate image file format and size"""
    # Check extension
    filename = file.filename.lower()
    if not any(filename.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        return False
    
    # Check file size (read first to get size)
    file.file.seek(0, 2)  # Seek to end
    size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if size > MAX_FILE_SIZE:
        return False
    
    return True

@router.post("/employee/register")
async def register_employee(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    email: EmailStr = Form(...),
    personal_email: EmailStr = Form(...),
    work_lat: float = Form(...),
    work_lng: float = Form(...),
    geofence_radius: float = Form(...),
    std_check_in: str = Form(...),
    std_check_out: str = Form(...),
    face_images: List[UploadFile] = File(...)
):
    """
    Register employee with face images uploaded to S3
    """
    # Validate image count
    if len(face_images) < MIN_IMAGES:
        raise HTTPException(
            status_code=400, 
            detail=f"Minimum {MIN_IMAGES} face images required. You uploaded {len(face_images)}."
        )
    
    if len(face_images) > MAX_IMAGES:
        raise HTTPException(
            status_code=400, 
            detail=f"Maximum {MAX_IMAGES} face images allowed. You uploaded {len(face_images)}."
        )
    
    # Validate each image
    for idx, img in enumerate(face_images):
        if not validate_image_file(img):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image {idx + 1}: '{img.filename}'. Only JPG, PNG, WEBP allowed. Max size 5MB."
            )
    
    # Check existing employee
    if await Employee.find_one(Employee.email == email):
        raise HTTPException(status_code=400, detail="Employee email already exists")
    
    # Upload images to S3
    try:
        # Read image bytes
        image_bytes_list = []
        image_names = []
        for img in face_images:
            content = await img.read()
            image_bytes_list.append(content)
            image_names.append(img.filename)
            await img.seek(0)  # Reset file pointer
        
        # Upload to S3 using email as folder name
        s3_urls = S3Service.upload_employee_images(
            employee_email=email,
            image_files=image_bytes_list,
            image_names=image_names
        )
        
        print(f"✅ Uploaded {len(s3_urls)} images to S3 for {email}")
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload images to S3: {str(e)}"
        )
    
    # Generate employee details
    temp_password = generate_random_password()
    hashed = get_password_hash(temp_password)
    
    # Generate EMP ID
    count = await Employee.count()
    emp_id = f"PRAGEMP{count + 1:03d}"

    # Create employee record
    emp = Employee(
        emp_id=emp_id,
        name=name,
        email=email,
        personal_email=personal_email,
        password_hash=hashed,
        work_lat=work_lat,
        work_lng=work_lng,
        geofence_radius=geofence_radius,
        face_photos=s3_urls,  # Store S3 URLs
        std_check_in=std_check_in,
        std_check_out=std_check_out
    )
    
    await emp.create()
    
    # Send credentials email in background
    background_tasks.add_task(
        send_credentials_email,
        to_email=personal_email,
        emp_id=emp_id,
        password=temp_password,
        name=name,
        org_email=email,
        check_in=std_check_in,
        check_out=std_check_out
    )
    
    return {
        "message": "Employee registered successfully",
        "emp_id": emp_id,
        "images_uploaded": len(s3_urls)
    }

@router.get("/employees")
async def list_employees():
    employees = await Employee.find_all().to_list()
    return [
        {
            "emp_id": emp.emp_id,
            "name": emp.name,
            "email": emp.email,
            "work_location": {"lat": emp.work_lat, "lng": emp.work_lng},
            "geofence_radius": emp.geofence_radius,
            "image_count": len(emp.face_photos) if emp.face_photos else 0
        }
        for emp in employees
    ]
from backend.models import Request, Attendance
from datetime import datetime

@router.get("/requests")
async def get_pending_requests():
    # Return all Pending
    reqs = await Request.find(Request.status == "PENDING").to_list()
    return reqs

class ApprovalPayload(BaseModel):
    request_id: str
    action: str # APPROVE or REJECT

@router.post("/requests/review")
async def review_request(data: ApprovalPayload):
    from bson import ObjectId
    req = await Request.get(data.request_id) # Beanie uses Pydantic ObjectId usually, but let's see
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if data.action == "REJECT":
        req.status = "REJECTED"
        await req.save()
        return {"message": "Request Rejected"}

    if data.action == "APPROVE":
        req.status = "APPROVED"
        await req.save()
        
        # Mark Attendance
        today = req.timestamp.strftime("%Y-%m-%d")
        existing = await Attendance.find_one(Attendance.emp_id == req.emp_id, Attendance.date == today)

        if req.type == "CHECK_IN":
            if not existing:
                att = Attendance(
                    emp_id=req.emp_id,
                    date=today,
                    check_in_time=req.timestamp,
                    status="PRESENT (APPROVED)"
                )
                await att.create()
            else:
                 existing.check_in_time = req.timestamp
                 await existing.save()
        elif req.type == "CHECK_OUT":
             if existing:
                 existing.check_out_time = req.timestamp
                 await existing.save()
             else:
                 # Check out without check in? 
                 pass 

        return {"message": "Request Approved & Attendance Marked"}
