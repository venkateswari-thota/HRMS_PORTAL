from typing import List, Optional
from beanie import Document
from pydantic import BaseModel, EmailStr
from datetime import datetime

class Admin(Document):
    email: EmailStr
    password_hash: str

    class Settings:
        name = "admins"

class Employee(Document):
    emp_id: str
    name: str
    email: EmailStr
    personal_email: EmailStr # Personal email for credentials
    password_hash: str
    work_lat: float
    work_lng: float
    geofence_radius: float  # in meters
    face_photos: List[str]  # Paths or URLs to stored images
    std_check_in: str       # HH:MM format
    std_check_out: str      # HH:MM format

    class Settings:
        name = "employees"

class Attendance(Document):
    emp_id: str             # Link to Employee.emp_id or internal ID
    date: str               # YYYY-MM-DD
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    status: str             # Present, Late, Half-Day, Absent
    
    class Settings:
        name = "attendance"

class Request(Document):
    emp_id: str
    type: str               # "CHECK_IN" or "CHECK_OUT"
    reason: str
    timestamp: datetime
    location_lat: float
    location_lng: float
    status: str = "PENDING" # PENDING, APPROVED, REJECTED
    
    class Settings:
        name = "requests"
