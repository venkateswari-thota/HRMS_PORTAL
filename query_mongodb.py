"""
Direct MongoDB Query - Check Employee Data
This bypasses Python and directly queries MongoDB
"""

import subprocess
import json

# MongoDB query to get all employees
mongo_query = """
db.employees.find({}, {
    emp_id: 1,
    name: 1,
    email: 1,
    personal_email: 1,
    _id: 0
}).pretty()
"""

print("=" * 70)
print("QUERYING MONGODB DIRECTLY")
print("=" * 70)

try:
    # Run mongo shell command
    result = subprocess.run(
        ['mongosh', 'hrms_db', '--quiet', '--eval', mongo_query],
        capture_output=True,
        text=True,
        timeout=10
    )
    
    if result.returncode == 0:
        print("\n✅ MongoDB Query Results:\n")
        print(result.stdout)
    else:
        print(f"\n❌ Error: {result.stderr}")
        print("\nTrying alternative method...")
        
        # Try with mongo (older version)
        result2 = subprocess.run(
            ['mongo', 'hrms_db', '--quiet', '--eval', mongo_query],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result2.returncode == 0:
            print("\n✅ MongoDB Query Results:\n")
            print(result2.stdout)
        else:
            print(f"\n❌ Error: {result2.stderr}")
            print("\n⚠️ Please run this command manually:")
            print(f"\nmongosh hrms_db --eval '{mongo_query}'")
            
except FileNotFoundError:
    print("\n❌ MongoDB shell not found in PATH")
    print("\n📝 Manual Steps:")
    print("1. Open MongoDB Compass")
    print("2. Connect to: mongodb://localhost:27017")
    print("3. Select database: hrms_db")
    print("4. Select collection: employees")
    print("5. Look for venky and john records")
    print("6. Check if they have the SAME email field")
    
except Exception as e:
    print(f"\n❌ Error: {e}")

print("\n" + "=" * 70)
print("WHAT TO LOOK FOR:")
print("=" * 70)
print("1. Does venky exist in the database?")
print("2. Does venky have the SAME email as john?")
print("3. What email did venky use to login?")
print("\nIf venky and john have the SAME email:")
print("  → Login will return the FIRST matching record")
print("  → This is why venky sees john's data!")
print("\n" + "=" * 70)
