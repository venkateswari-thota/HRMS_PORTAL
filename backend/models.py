from typing import List, Optional
from beanie import Document
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class Admin(Document):
    admin_id: Optional[str] = None
    email: EmailStr
    password_hash: str

    class Settings:
        name = "admins"

class Employee(Document):
    emp_id: str
    name: str
    email: EmailStr
    personal_email: Optional[EmailStr] = None # Personal email for credentials
    password_hash: str
    work_lat: float
    work_lng: float
    geofence_radius: float  # in meters
    face_photos: List[str]  # Paths or URLs to stored images
    std_check_in: str = "09:00"       # HH:MM format
    std_check_out: str = "18:00"      # HH:MM format

    class Settings:
        name = "employees"

class Attendance(Document):
    emp_id: str             # Link to Employee.emp_id or internal ID
    date: str               # YYYY-MM-DD
    check_in_time: Optional[datetime] = None      # First check-in of the day
    last_in_time: Optional[datetime] = None       # Most recent check-in
    last_out_time: Optional[datetime] = None      # Most recent check-out
    worked_hours: Optional[str] = None  # Format: "HH:MM:SS"
    status: str             # Present, Late, Half-Day, Absent, EXCEPTION_APPROVED
    
    class Settings:
        name = "attendance"

class Request(Document):
    emp_id: str
    type: str               # "CHECK_IN" or "CHECK_OUT"
    reason: str
    timestamp: datetime
    location_lat: float
    location_lng: float
    location_failure: bool = False
    face_failure: bool = False
    current_location_coordinates: Optional[str] = None
    face_image: Optional[str] = None  # Captured image if face matching failed
    status: str = "PENDING" # PENDING, APPROVED, REJECTED
    
    class Settings:
        name = "requests"

class Approved(Document):
    """Approved requests moved from requests collection"""
    emp_id: str
    type: str               # "CHECK_IN" or "CHECK_OUT"
    reason: str
    timestamp: datetime     # Original request timestamp
    approved_at: datetime   # When admin approved
    location_lat: float
    location_lng: float
    location_failure: bool = False
    face_failure: bool = False
    current_location_coordinates: Optional[str] = None
    face_image: Optional[str] = None # Captured image from original request
    status: str = "APPROVED"  # Always APPROVED
    
    class Settings:
        name = "approved"

class LeaveRequest(Document):
    emp_id: str
    leave_type: str        # Loss of Pay, Paternity, Comp Off, WFH, Paid Leave
    from_date: str         # YYYY-MM-DD
    to_date: str           # YYYY-MM-DD
    from_session: str      # Session 1, Session 2
    to_session: str        # Session 1, Session 2
    reason: str
    attachment_url: Optional[str] = None
    applied_on: datetime = Field(default_factory=datetime.now)
    status: str = "PENDING"

    class Settings:
        name = "leave_requests"

class LeaveApproved(Document):
    emp_id: str
    leave_type: str
    from_date: str
    to_date: str
    from_session: str
    to_session: str
    reason: str
    attachment_url: Optional[str] = None
    applied_on: datetime
    approved_at: datetime = Field(default_factory=datetime.now)
    status: str = "APPROVED"

    class Settings:
        name = "leave_approved"

class LeaveRejected(Document):
    emp_id: str
    leave_type: str
    from_date: str
    to_date: str
    from_session: str
    to_session: str
    reason: str
    attachment_url: Optional[str] = None
    applied_on: datetime
    rejected_at: datetime = Field(default_factory=datetime.now)
    status: str = "REJECTED"

    class Settings:
        name = "leave_rejected"

class LeaveWithdrawn(Document):
    emp_id: str
    leave_type: str
    from_date: str
    to_date: str
    from_session: str
    to_session: str
    reason: str
    attachment_url: Optional[str] = None
    applied_on: datetime
    withdrawn_at: datetime = Field(default_factory=datetime.now)
    status: str = "WITHDRAWN"

    class Settings:
        name = "leave_withdrawn"

class LeaveBalance(Document):
    emp_id: str
    loss_of_pay: int = 0
    optional_holiday: int = 0
    comp_off: int = 0
    paternity_leave: int = 0
    wfh_contract: int = 0
    paid_leave: int = 0
    last_updated: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "leave_balances"

class Holiday(Document):
    date: str       # YYYY-MM-DD
    reason: str
    year: int
    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "holiday_calendar"
