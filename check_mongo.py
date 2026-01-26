
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = "mongodb+srv://venkateswari:venky12345@cluster0.iimbsjk.mongodb.net/"
DB_NAME = "hrms"

async def check_db():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print(f"--- Checking Database: {DB_NAME} ---")
    collections = await db.list_collection_names()
    print(f"Collections found: {collections}")
    
    for coll_name in collections:
        count = await db[coll_name].count_documents({})
        print(f"Collection: {coll_name} | Document count: {count}")
        if count > 0:
            doc = await db[coll_name].find_one()
            print(f"Sample from {coll_name}: {doc.get('_id')} | status: {doc.get('status')}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_db())
