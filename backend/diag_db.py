import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from backend.models import Admin, Employee
from dotenv import load_dotenv
import os

# Load Environment Variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

async def diag():
    MONGO_URL = os.getenv("MONGO_URL")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client["hrms"]
    await init_beanie(db, document_models=[Admin, Employee])
    
    admins = await Admin.find_all().to_list()
    employees = await Employee.find_all().to_list()
    
    print(f"--- DIAGNOSTICS ---")
    print(f"Admins found: {len(admins)}")
    for a in admins:
        print(f" - ID: {a.admin_id}, Email: {a.email}")
        
    print(f"Employees found: {len(employees)}")
    for e in employees:
        print(f" - ID: {e.emp_id}, Email: {e.email}, Personal Email: {e.personal_email}")
    print(f"--- END DIAGNOSTICS ---")

if __name__ == "__main__":
    asyncio.run(diag())
