
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie, Document
from typing import Optional
from datetime import datetime
import os

class Request(Document):
    emp_id: str
    status: str = "PENDING"
    class Settings:
        name = "requests"

class Approved(Document):
    emp_id: str
    class Settings:
        name = "approved"

async def check():
    client = AsyncIOMotorClient("mongodb+srv://venkateswari:venky12345@cluster0.iimbsjk.mongodb.net/")
    database = client["hrms"]
    await init_beanie(database, document_models=[Request, Approved])
    
    pending = await Request.find_all().to_list()
    approved = await Approved.find_all().to_list()
    
    print(f"--- Database Diagnostics ---")
    print(f"Pending Requests in DB: {len(pending)}")
    for r in pending:
        print(f"  - Request: {r.id} | Emp: {r.emp_id} | Status: {r.status}")
        
    print(f"Approved Requests in DB: {len(approved)}")
    for a in approved:
        print(f"  - Approved: {a.id} | Emp: {a.emp_id}")

if __name__ == "__main__":
    asyncio.run(check())
