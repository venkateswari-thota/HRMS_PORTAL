from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, UploadFile, File, Form
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List
from backend.models import Employee, Admin, Request, Attendance, Approved
from backend.utils import create_access_token, get_password_hash
from backend.s3_service import S3Service
import random
import string

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

from backend.email_utils import send_credentials_email

class UpdateEmployeePayload(BaseModel):
    emp_id: str
    personal_email: EmailStr
    work_lat: float
    work_lng: float
    geofence_radius: float
    std_check_in: str
    std_check_out: str

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
    all_docs = await Employee.get_motor_collection().find().to_list(length=1000)
    results = []
    for doc in all_docs:
        try:
            # Manually handle missing fields for older records
            results.append({
                "emp_id": doc.get("emp_id", "N/A"),
                "name": doc.get("name", "Unknown"),
                "email": doc.get("email", "N/A"),
                "personal_email": doc.get("personal_email", ""),
                "work_location": {
                    "lat": doc.get("work_lat", 0.0),
                    "lng": doc.get("work_lng", 0.0)
                },
                "geofence_radius": doc.get("geofence_radius", 100.0),
                "std_check_in": doc.get("std_check_in", "09:00"),
                "std_check_out": doc.get("std_check_out", "18:00"),
                "image_count": len(doc.get("face_photos", [])) if doc.get("face_photos") else 0
            })
        except Exception as e:
            print(f"⚠️ Error parsing employee doc {doc.get('_id')}: {e}")
            continue
    return results
@router.post("/employee/update")
async def update_employee(data: UpdateEmployeePayload):
    # 1. Validation
    if not data.personal_email.lower().endswith("@gmail.com"):
        raise HTTPException(status_code=400, detail="enter the valid mail")
    
    # 2. Find Employee
    emp = await Employee.find_one(Employee.emp_id == data.emp_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # 3. Update Fields
    emp.personal_email = data.personal_email
    emp.work_lat = data.work_lat
    emp.work_lng = data.work_lng
    emp.geofence_radius = data.geofence_radius
    emp.std_check_in = data.std_check_in
    emp.std_check_out = data.std_check_out
    
    await emp.save()
    return {"message": "Employee updated successfully"}

@router.get("/requests")
async def get_all_requests():
    """
    Return ALL requests (PENDING, APPROVED, REJECTED)
    """
    reqs = await Request.find().to_list()
    print(f"📊 DEBUG: Found {len(reqs)} total requests in DB")
    
    # Manually serialize to avoid ObjectId issues
    results = []
    for r in reqs:
        d = r.dict()
        d["id"] = str(r.id)
        results.append(d)
    return results

class ApprovalPayload(BaseModel):
    request_id: str
    action: str # APPROVE or REJECT

@router.post("/requests/review")
async def review_request(data: ApprovalPayload):
    req = await Request.get(data.request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Request already processed")
    
    if data.action == "REJECT":
        # Just delete rejected requests
        await req.delete()
        return {"message": "Request Rejected"}

    if data.action == "APPROVE":
        # Get employee details
        emp = await Employee.find_one(Employee.emp_id == req.emp_id)
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # Get the date from request timestamp
        request_date = req.timestamp.strftime("%Y-%m-%d")
        
        if req.type == "CHECK_IN":
            # Create attendance record with standard check-in time
            std_time_str = f"{request_date} {emp.std_check_in}"
            std_check_in_time = datetime.strptime(std_time_str, "%Y-%m-%d %H:%M")
            
            # Check if attendance already exists
            existing = await Attendance.find_one(
                Attendance.emp_id == req.emp_id,
                Attendance.date == request_date
            )
            
            if existing:
                # Update existing record and reset session
                existing.check_in_time = std_check_in_time
                existing.last_in_time = std_check_in_time
                existing.last_out_time = None
                existing.worked_hours = None
                existing.status = "EXCEPTION_APPROVED"
                await existing.save()
            else:
                attendance = Attendance(
                    emp_id=req.emp_id,
                    date=request_date,
                    check_in_time=std_check_in_time,
                    last_in_time=std_check_in_time,
                    last_out_time=None,
                    worked_hours=None,
                    status="EXCEPTION_APPROVED"
                )
                await attendance.create()
        
        elif req.type == "CHECK_OUT":
            # Find existing attendance record
            attendance = await Attendance.find_one(
                Attendance.emp_id == req.emp_id,
                Attendance.date == request_date
            )
            
            if not attendance:
                raise HTTPException(
                    status_code=400,
                    detail="No check-in record found for this date. Cannot approve check-out."
                )
            
            # Parse std_check_out time
            std_time_str = f"{request_date} {emp.std_check_out}"
            std_check_out_time = datetime.strptime(std_time_str, "%Y-%m-%d %H:%M")
            
            # Update checkout times
            attendance.last_out_time = std_check_out_time
            
            # Calculate worked hours using last_in_time and last_out_time
            if attendance.last_in_time and attendance.last_out_time:
                diff = attendance.last_out_time - attendance.last_in_time
                seconds = diff.total_seconds()
                hours = int(seconds // 3600)
                minutes = int((seconds % 3600) // 60)
                secs = int(seconds % 60)
                attendance.worked_hours = f"{hours}:{minutes:02d}:{secs:02d}"
            
            await attendance.save()
        
        # Move to approved collection
        approved = Approved(
            emp_id=req.emp_id,
            type=req.type,
            reason=req.reason,
            timestamp=req.timestamp,
            approved_at=datetime.now(),
            location_lat=req.location_lat,
            location_lng=req.location_lng,
            location_failure=req.location_failure,
            face_failure=req.face_failure,
            current_location_coordinates=req.current_location_coordinates,
            face_image=req.face_image, 
            status="APPROVED"
        )
        await approved.create()
        
        # Delete from requests collection
        await req.delete()
        
        return {"message": "Request Approved & Moved to Approved Collection"}
    
    raise HTTPException(status_code=400, detail="Invalid action")

@router.get("/approved")
async def get_approved_requests():
    """Get all approved requests from approved collection"""
    approved = await Approved.find().sort("-approved_at").to_list()
    print(f"✅ DEBUG: Found {len(approved)} approved requests in DB")
    
    # Manually serialize to avoid ObjectId issues
    results = []
    for a in approved:
        d = a.dict()
        d["id"] = str(a.id)
        results.append(d)
    return results


