from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timezone
import math
from backend.models import Attendance, Employee, Request
from typing import Optional

router = APIRouter(prefix="/attendance", tags=["Attendance"])

# Haversine Formula for Distance logic
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371e3 # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi/2) * math.sin(delta_phi/2) + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda/2) * math.sin(delta_lambda/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c # Distance in meters

@router.get("/time")
async def get_server_time():
    """Trusted Time Source for Clients"""
    return {"iso_time": datetime.now(timezone.utc).isoformat()}

@router.get("/profile")
async def get_employee_profile(emp_id: str): # In real usage, extract from JWT dependency
    emp = await Employee.find_one(Employee.emp_id == emp_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {
        "emp_id": emp.emp_id,
        "name": emp.name,
        "work_lat": emp.work_lat,
        "work_lng": emp.work_lng,
        "geofence_radius": emp.geofence_radius,
        "face_photos": emp.face_photos # URLs to "Cloud"
    }

class CheckInPayload(BaseModel):
    emp_id: str
    lat: float
    lng: float
    # face_match_score: float # Validated strictly on client, but in real High Security, we'd send the image to verify again here. 
    # For this prototype, we trust the Client's 'FaceCheck' component result if signed (JWT).

@router.post("/check-in")
async def check_in(data: CheckInPayload):
    emp = await Employee.find_one(Employee.emp_id == data.emp_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    # Verify Location
    dist = calculate_distance(data.lat, data.lng, emp.work_lat, emp.work_lng)
    if dist > emp.geofence_radius:
        raise HTTPException(status_code=403, detail=f"Location Violation: You are {int(dist)}m away from work location.")

    # Record Attendance
    today = datetime.now().strftime("%Y-%m-%d")
    existing = await Attendance.find_one(Attendance.emp_id == emp.emp_id, Attendance.date == today)
    
    if existing and existing.check_in_time:
         return {"message": "Already checked in", "record": existing}
         
    if not existing:
        record = Attendance(
            emp_id=emp.emp_id, 
            date=today, 
            check_in_time=datetime.now(), 
            status="PRESENT" # Logic for Late can go here
        )
        await record.create()
    else:
        # Update existing (if somehow created without check-in)
        existing.check_in_time = datetime.now()
        await existing.save()

    return {"message": "Check-in Successful"}

@router.post("/check-out")
async def check_out(data: CheckInPayload):
    emp = await Employee.find_one(Employee.emp_id == data.emp_id)
    if not emp:
         raise HTTPException(status_code=404, detail="Employee not found")
    
    # Verify Location (Check-out also requires location usually? User said "Check IN and CHECK OUT Date & Time & Location")
    dist = calculate_distance(data.lat, data.lng, emp.work_lat, emp.work_lng)
    if dist > emp.geofence_radius:
        raise HTTPException(status_code=403, detail="Location Violation during Check-out.")

    today = datetime.now().strftime("%Y-%m-%d")
    record = await Attendance.find_one(Attendance.emp_id == emp.emp_id, Attendance.date == today)
    
    if not record or not record.check_in_time:
        raise HTTPException(status_code=400, detail="Cannot Check-out without Check-in")
        
    record.check_out_time = datetime.now()
    await record.save()
    
    return {"message": "Check-out Successful"}

class RequestPayload(BaseModel):
    emp_id: str
    type: str # IN or OUT
    reason: str
    lat: float
    lng: float

@router.post("/request")
async def submit_request(data: RequestPayload):
    req = Request(
        emp_id=data.emp_id,
        type=data.type,
        reason=data.reason,
        timestamp=datetime.now(),
        location_lat=data.lat,
        location_lng=data.lng,
        status="PENDING"
    )
    await req.create()
    return {"message": "Request Submitted to Admin"}
