import sys
import os
# Add current directory to path so it can find backend.email_utils
sys.path.append(os.getcwd())

from backend.email_utils import send_leave_application_email, send_leave_review_email

def test_leave_emails():
    print("Testing Leave Application Email to Admin...")
    admin_success = send_leave_application_email(
        emp_name="Venkateswari Thota",
        admin_email="venkateswarithota456@gmail.com",
        emp_id="EMP001",
        leave_type="Paid Leave",
        from_date="2026-02-01",
        to_date="2026-02-05",
        reason="Family vacation"
    )
    
    if admin_success:
        print("✅ Admin Notification Test Passed")
    else:
        print("❌ Admin Notification Test Failed")

    print("\nTesting Leave Review Email to Employee...")
    emp_success = send_leave_review_email(
        emp_name="Venkateswari Thota",
        emp_email="venkateswarithota456@gmail.com", # Testing with same email
        action="APPROVED",
        leave_type="Paid Leave",
        from_date="2026-02-01",
        to_date="2026-02-05"
    )

    if emp_success:
        print("✅ Employee Notification Test Passed")
    else:
        print("❌ Employee Notification Test Failed")

if __name__ == "__main__":
    test_leave_emails()
