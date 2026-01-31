import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = "mongodb+srv://venkateswari:venky12345@cluster0.iimbsjk.mongodb.net/"

async def diagnostic():
    print(f"🔍 Testing connection to: {MONGO_URL.split('@')[-1]}")
    try:
        client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        # The 'ping' command is cheap and does not require auth
        await client.admin.command('ping')
        print("✅ MongoDB is reachable and responding.")
        
        db = client["hrms"]
        collections = await db.list_collection_names()
        print(f"✅ Connected to 'hrms' database. Available collections: {collections}")
        
    except Exception as e:
        print(f"❌ MongoDB Connection Failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(diagnostic())
