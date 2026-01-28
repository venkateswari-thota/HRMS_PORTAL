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
    email = data.email.strip().lower()
    # Check if exists
    exists = await Admin.find_one(Admin.email == email)
    if exists:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    # Generate unique admin_id (ADM001, ADM002...)
    count = await Admin.count()
    admin_id = f"ADM{str(count + 1).zfill(3)}"
    
    hashed = get_password_hash(data.password)
    admin = Admin(
        admin_id=admin_id,
        email=email, 
        password_hash=hashed
    )
    await admin.create()
    return {"message": f"Admin created successfully with ID: {admin_id}"}

@router.post("/admin/login")
async def admin_login(data: AdminLogin):
    email = data.email.strip().lower()
    # TODO: Verify Captcha here
    admin = await Admin.find_one(Admin.email == email)
    if not admin or not verify_password(data.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(
        data={"sub": admin.email, "role": "admin"},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer", "role": "admin"}

@router.post("/employee/login")
async def employee_login(data: EmployeeLogin):
    email = data.email.strip().lower()
    # TODO: Verify Captcha here
    emp = await Employee.find_one(Employee.email == email)
    if not emp or not verify_password(data.password, emp.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(
        data={"sub": emp.emp_id, "role": "employee", "name": emp.name},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer", "role": "employee", "name": emp.name, "emp_id": emp.emp_id}
