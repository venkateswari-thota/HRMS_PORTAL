import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# Credentials (In Production use Env Vars)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "venkateswarithota456@gmail.com"
SENDER_PASSWORD = "jzfh pkxs rasn scwk" # Note: User might need App Password if 2FA is on

def send_credentials_email(to_email: str, emp_id: str, password: str, name: str, org_email: str, check_in: str, check_out: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = "Your HRMS Login Credentials"

        # Login Hours text
        login_hours = f"{check_in} - {check_out} IST"

        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>Dear {name},</p>
            
            <p>Greetings of the day !</p>
            
            <p>Please find your Login Details for attendance on HRMS:</p>
            
            <p>
                <strong>URL :</strong> <a href="http://localhost:3000/auth/employee/signin">http://localhost:3000/auth/employee/signin</a><br>
                <strong>User ID :</strong> {org_email}<br>
                <strong>Password :</strong> {password}   (You May Change the password after first use)
            </p>
            
            <p><strong>Your Login Hours are :</strong> {login_hours} (GMT+5.30 Hrs.)</p>
            
            <br>
            
            <p>For Email Communications, Your Active Gmail ID is :</p>
            
            <p>
                <strong>Email Account :</strong> {org_email}<br>
                <strong>Password       :</strong> {password}
            </p>
            
            <br>
            <p>Best Regards,<br>HR Team<br>Pragyatmika Intelligence</p>
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def send_attendance_request_email(emp_name: str, admin_email: str, emp_id: str, type: str, reason: str, lat: float, lng: float):
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = admin_email
        msg['Subject'] = f"Attendance Exception Request: {type} - {emp_id}"

        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Attendance Exception Request</h2>
            <p><strong>Employee Name:</strong> {emp_name}</p>
            <p><strong>Employee ID:</strong> {emp_id}</p>
            <p><strong>Request Type:</strong> {type}</p>
            <p><strong>Reason:</strong> {reason}</p>
            <p><strong>Location:</strong> {lat}, {lng}</p>
            <p><strong>Timestamp:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <br>
            <p>Please login to Admin Portal to Approve/Reject this request.</p>
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"✅ Email sent to admin: {admin_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False

def send_leave_application_email(emp_name: str, admin_email: str, emp_id: str, leave_type: str, from_date: str, to_date: str, reason: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = admin_email
        msg['Subject'] = f"New Leave Application: {emp_name} ({emp_id})"

        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #2563eb;">New Leave Application</h2>
            <p><strong>Employee Name:</strong> {emp_name}</p>
            <p><strong>Employee ID:</strong> {emp_id}</p>
            <p><strong>Leave Type:</strong> {leave_type}</p>
            <p><strong>Duration:</strong> {from_date} to {to_date}</p>
            <p><strong>Reason:</strong> {reason}</p>
            <p><strong>Applied On:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <br>
            <p>Please login to the Admin Portal to review this application.</p>
            <p>Best Regards,<br>HRMS Notification System</p>
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"✅ Leave application email sent to admin: {admin_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send leave application email: {e}")
        return False

def send_leave_review_email(emp_name: str, emp_email: str, action: str, leave_type: str, from_date: str, to_date: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = emp_email
        msg['Subject'] = f"Leave Application Status: {action}"

        status_color = "#16a34a" if action == "APPROVED" else "#dc2626"

        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Leave Application Update</h2>
            <p>Dear {emp_name},</p>
            <p>Your leave application for <strong>{leave_type}</strong> from <strong>{from_date}</strong> to <strong>{to_date}</strong> has been <strong style="color: {status_color}; text-decoration: underline;">{action}</strong> by the administration.</p>
            <br>
            <p>You can check the details in your Employee Portal.</p>
            <br>
            <p>Best Regards,<br>HR Team<br>Pragyatmika Intelligence</p>
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"✅ Leave review email sent to employee: {emp_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send leave review email: {e}")
        return False
