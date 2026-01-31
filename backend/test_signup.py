import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from backend.models import Admin
from backend.utils import get_password_hash
from dotenv import load_dotenv
import os

# Load Environment Variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

async def test_signup():
    MONGO_URL = os.getenv("MONGO_URL")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client["hrms"]
    await init_beanie(db, document_models=[Admin])
    
    email = "test_admin_unique@gmail.com"
    password = "password123"
    
    # Check if exists
    exists = await Admin.find_one(Admin.email == email)
    if exists:
        print("Test Admin already exists")
        return
    
    count = await Admin.count()
    admin_id = f"ADM{str(count + 1).zfill(3)}"
    hashed = get_password_hash(password)
    
    admin = Admin(admin_id=admin_id, email=email, password_hash=hashed)
    try:
        await admin.create()
        print(f"Successfully created admin: {admin_id}")
    except Exception as e:
        print(f"Error creating admin: {e}")

if __name__ == "__main__":
    asyncio.run(test_signup())
