"""
Fix Venky's Email in MongoDB
Run this AFTER confirming the correct email
"""
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['hrms_db']

# IMPORTANT: Change this to venky's CORRECT email
CORRECT_EMAIL = "venky@prag.in"  # ← UPDATE THIS!

print("=" * 60)
print("FIXING VENKY'S EMAIL")
print("=" * 60)

# Get current record
venky_before = db.employees.find_one({'emp_id': 'venky'})
if not venky_before:
    print("❌ Venky not found in database!")
    exit(1)

print(f"\n📋 BEFORE:")
print(f"   emp_id: {venky_before.get('emp_id')}")
print(f"   name: {venky_before.get('name')}")
print(f"   email: {venky_before.get('email')}")

# Update email
result = db.employees.update_one(
    {'emp_id': 'venky'},
    {'$set': {'email': CORRECT_EMAIL}}
)

if result.modified_count > 0:
    print(f"\n✅ Updated venky's email to: {CORRECT_EMAIL}")
else:
    print(f"\n⚠️ No changes made (email might already be correct)")

# Verify update
venky_after = db.employees.find_one({'emp_id': 'venky'})
print(f"\n📋 AFTER:")
print(f"   emp_id: {venky_after.get('emp_id')}")
print(f"   name: {venky_after.get('name')}")
print(f"   email: {venky_after.get('email')}")

print("\n" + "=" * 60)
print("✅ FIX COMPLETE!")
print("=" * 60)
print("\nNext steps:")
print("1. Logout venky from the application")
print("2. Login again as venky")
print("3. Check profile page - should show venky's data now")
print(f"4. Verify S3 folder exists: employees/{CORRECT_EMAIL}/")
print("5. Upload venky's face images to that S3 folder")
print("\n" + "=" * 60)
