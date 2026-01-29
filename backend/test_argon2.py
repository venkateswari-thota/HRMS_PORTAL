from passlib.context import CryptContext
import sys

try:
    pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
    hashed = pwd_context.hash("testpassword")
    print(f"Hashing succeeded: {hashed}")
except Exception as e:
    print(f"Hashing failed: {e}")
    print(f"Error type: {type(e)}")
    import traceback
    traceback.print_exc()
