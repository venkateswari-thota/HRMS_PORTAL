from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from contextlib import asynccontextmanager
from fastapi import FastAPI
import os

from .models import Admin, Employee, Attendance, Request, Approved, LeaveRequest, LeaveApproved, LeaveRejected, LeaveWithdrawn, LeaveBalance, Holiday

# MongoDB URL
MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://venkateswari:venky12345@cluster0.iimbsjk.mongodb.net/")
DB_NAME = "hrms"

async def init_db():
    client = AsyncIOMotorClient(MONGO_URL)
    database = client[DB_NAME]
    
    # Initialize Beanie with the Document classes
    await init_beanie(database, document_models=[
        Admin, Employee, Attendance, Request, Approved,
        LeaveRequest, LeaveApproved, LeaveRejected, LeaveWithdrawn, LeaveBalance, Holiday
    ])

