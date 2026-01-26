"""
Check Employee Records in MongoDB
Run this to see why venky is seeing john's data
"""
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['hrms_db']

print("=" * 60)
print("EMPLOYEE RECORDS CHECK")
print("=" * 60)

# Get venky's record
venky = db.employees.find_one({'emp_id': 'venky'})
if venky:
    print("\n✅ VENKY'S RECORD:")
    print(f"   emp_id: {venky.get('emp_id')}")
    print(f"   name: {venky.get('name')}")
    print(f"   email: {venky.get('email')}")  # ← This is the problem!
    print(f"   personal_email: {venky.get('personal_email')}")
else:
    print("\n❌ Venky not found in database!")

# Get john's record for comparison
john = db.employees.find_one({'emp_id': 'john'})
if john:
    print("\n✅ JOHN'S RECORD:")
    print(f"   emp_id: {john.get('emp_id')}")
    print(f"   name: {john.get('name')}")
    print(f"   email: {john.get('email')}")
    print(f"   personal_email: {john.get('personal_email')}")
else:
    print("\n❌ John not found in database!")

# Check if venky has john's email
if venky and john:
    print("\n" + "=" * 60)
    print("DIAGNOSIS:")
    print("=" * 60)
    if venky.get('email') == john.get('email'):
        print("🐛 BUG CONFIRMED: Venky has John's email!")
        print(f"   Venky's email: {venky.get('email')}")
        print(f"   John's email: {john.get('email')}")
        print("\n💡 FIX: Update venky's email to correct value")
        print(f"   Suggested: venky@prag.in or venkateswari@prag.in")
    else:
        print("✅ Emails are different (good)")
        print(f"   Venky's email: {venky.get('email')}")
        print(f"   John's email: {john.get('email')}")

print("\n" + "=" * 60)
print("ALL EMPLOYEES:")
print("=" * 60)
all_emps = db.employees.find({}, {'emp_id': 1, 'name': 1, 'email': 1})
for emp in all_emps:
    print(f"  {emp.get('emp_id'):10} | {emp.get('name'):25} | {emp.get('email')}")

print("\n" + "=" * 60)
