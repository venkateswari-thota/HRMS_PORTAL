from dotenv import load_dotenv
import os

# Load Environment Variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# --- CONFIGURATION ---
# Your OLD personal connection string (Provided via manual input if needed)
SOURCE_URL = os.getenv("SOURCE_MONGO_URL", "mongodb://localhost:27017") 
SOURCE_DB_NAME = "hrms"

# Your NEW AWS-hosted connection string
TARGET_URL = os.getenv("MONGO_URL")
TARGET_DB_NAME = os.getenv("DB_NAME", "hrms")

def migrate():
    print("🚀 Starting Data Migration to AWS...")
    
    try:
        # Connect to both databases
        source_client = MongoClient(SOURCE_URL)
        target_client = MongoClient(TARGET_URL)
        
        source_db = source_client[SOURCE_DB_NAME]
        target_db = target_client[TARGET_DB_NAME]
        
        # Get all collections from the source
        collections = source_db.list_collection_names()
        
        for coll_name in collections:
            # Skip system collections
            if coll_name.startswith("system."):
                continue
                
            print(f"📦 Migrating collection: {coll_name}...")
            
            # Get all documents
            documents = list(source_db[coll_name].find())
            
            if documents:
                # Clear target collection first to avoid duplicates
                target_db[coll_name].delete_many({})
                # Insert all documents
                target_db[coll_name].insert_many(documents)
                print(f" ✅ Successfully moved {len(documents)} documents.")
            else:
                print(f" ℹ️ Collection is empty, skipping.")
                
        print("\n🎉 MIGRATION COMPLETE!")
        print("Your data is now safely stored on the AWS-hosted cluster.")
        
    except Exception as e:
        print(f"❌ Error during migration: {str(e)}")
    finally:
        source_client.close()
        target_client.close()

if __name__ == "__main__":
    migrate()
