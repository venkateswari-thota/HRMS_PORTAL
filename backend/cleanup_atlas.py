from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load Environment Variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

MONGO_URL = os.getenv("MONGO_URL")

def cleanup():
    if not MONGO_URL:
        print("❌ MONGO_URL not found in .env")
        return

    print(f"🚀 Connecting to Atlas...")
    client = MongoClient(MONGO_URL)
    
    # List of databases to delete
    databases_to_delete = ["sample_mflix"]
    
    try:
        available_dbs = client.list_database_names()
        print(f"Available databases: {available_dbs}")
        
        for db_name in databases_to_delete:
            if db_name in available_dbs:
                print(f"🗑️ Deleting database: {db_name}...")
                client.drop_database(db_name)
                print(f" ✅ Successfully deleted {db_name}.")
            else:
                print(f" ℹ️ Database {db_name} not found, skipping.")
                
        print("\n🎉 CLEANUP COMPLETE!")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    cleanup()
