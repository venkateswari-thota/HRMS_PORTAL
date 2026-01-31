from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv
import os

from .models import Admin, Employee, Attendance, Request, Approved, LeaveRequest, LeaveApproved, LeaveRejected, LeaveWithdrawn, LeaveBalance, Holiday, WorkLocation

# Load Environment Variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# MongoDB Configuration
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "hrms")

async def init_db():
    client = AsyncIOMotorClient(MONGO_URL)
    database = client[DB_NAME]
    
    # Initialize Beanie with the Document classes
    await init_beanie(database, document_models=[
        Admin, Employee, Attendance, Request, Approved,
        LeaveRequest, LeaveApproved, LeaveRejected, LeaveWithdrawn, LeaveBalance, Holiday, WorkLocation
    ])

