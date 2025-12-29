from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import List
from backend.models import Employee, Admin
from backend.utils import create_access_token, get_password_hash
import random
import string

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

from backend.email_utils import send_credentials_email

class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    personal_email: EmailStr # NEW
    work_lat: float
    work_lng: float
    geofence_radius: float
    face_photos: List[str] 
    std_check_in: str
    std_check_out: str

def generate_random_password(length=8):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

@router.post("/employee/register")
async def register_employee(data: EmployeeCreate, background_tasks: BackgroundTasks):
    # Check existing
    if await Employee.find_one(Employee.email == data.email):
        raise HTTPException(status_code=400, detail="Employee email already exists")

    # Generate details
    temp_password = generate_random_password()
    hashed = get_password_hash(temp_password)
    
    # Generate EMP ID (Simple logic)
    count = await Employee.count()
    emp_id = f"PRAGEMP{count + 1:03d}"

    emp = Employee(
        emp_id=emp_id,
        name=data.name,
        email=data.email,
        personal_email=data.personal_email, # Save it
        password_hash=hashed,
        work_lat=data.work_lat,
        work_lng=data.work_lng,
        geofence_radius=data.geofence_radius,
        face_photos=data.face_photos,
        std_check_in=data.std_check_in,
        std_check_out=data.std_check_out
    )
    await emp.create()
    
    # Send Email to Personal Mail in Background
    background_tasks.add_task(send_credentials_email, data.personal_email, emp_id, temp_password, data.name, data.email, data.std_check_in, data.std_check_out)
    
    return {
        "message": "Employee registered successfully",
        "emp_id": emp_id,
        "email": data.email,
        "email_sent": True # Assumed true for async
    }

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
