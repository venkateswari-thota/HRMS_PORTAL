import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from backend.models import Employee
from backend.utils import get_password_hash
from dotenv import load_dotenv
import os

# Load Environment Variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

async def create_test_emp():
    MONGO_URL = os.getenv("MONGO_URL")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client["hrms"]
    await init_beanie(db, document_models=[Employee])
    
    email = "test_emp_work@company.com"
    p_email = "test_emp_personal@gmail.com"
    password = "password123"
    
    # Check
    exists = await Employee.find_one(Employee.email == email)
    if exists:
        print("Employee already exists")
        return
    
    hashed = get_password_hash(password)
    emp = Employee(
        emp_id="TESTEMP001",
        name="Test Employee",
        email=email,
        personal_email=p_email,
        password_hash=hashed,
        work_lat=0.0,
        work_lng=0.0,
        geofence_radius=100.0,
        face_photos=[],
        std_check_in="09:00",
        std_check_out="18:00"
    )
    await emp.create()
    print("Employee created")

if __name__ == "__main__":
    asyncio.run(create_test_emp())
