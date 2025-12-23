from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from backend.models import Admin, Employee
from backend.utils import verify_password, create_access_token, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["Authentication"])

class AdminLogin(BaseModel):
    email: str
    password: str
    # captcha_token: str # TODO: Verify Captcha

class EmployeeLogin(BaseModel):
    email: str
    password: str
    # captcha_token: str # TODO: Verify Captcha

class AdminSignup(BaseModel):
    email: str
    password: str

@router.post("/admin/signup")
async def admin_signup(data: AdminSignup):
    # Check if exists
    exists = await Admin.find_one(Admin.email == data.email)
    if exists:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    hashed = get_password_hash(data.password)
    admin = Admin(email=data.email, password_hash=hashed)
    await admin.create()
    return {"message": "Admin created successfully"}

@router.post("/admin/login")
async def admin_login(data: AdminLogin):
    # TODO: Verify Captcha here
    admin = await Admin.find_one(Admin.email == data.email)
    if not admin or not verify_password(data.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(
        data={"sub": admin.email, "role": "admin"},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer", "role": "admin"}

@router.post("/employee/login")
async def employee_login(data: EmployeeLogin):
    # TODO: Verify Captcha here
    emp = await Employee.find_one(Employee.email == data.email)
    if not emp or not verify_password(data.password, emp.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(
        data={"sub": emp.emp_id, "role": "employee", "name": emp.name},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer", "role": "employee"}
