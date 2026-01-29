import smtplib
from backend.logger import log_debug
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

def send_leave_request_email(emp_name: str, admin_email: str, emp_id: str, emp_org_email: str, leave_type: str, from_date: str, to_date: str, reason: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = admin_email
        msg['Reply-To'] = emp_org_email
        msg['Subject'] = f"New Leave Application: {leave_type} - {emp_name}"

        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #4f46e5;">New Leave Request Received</h2>
            <p><strong>Employee:</strong> {emp_name} ({emp_id})</p>
            <p><strong>Official Email:</strong> {emp_org_email}</p>
            <p><strong>Leave Type:</strong> {leave_type}</p>
            <p><strong>Duration:</strong> {from_date} to {to_date}</p>
            <p><strong>Reason:</strong> {reason}</p>
            <br>
            <p>Please login to the Admin Portal to review and process this application.</p>
            <br>
            <p>Best Regards,<br>HRMS System</p>
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        log_debug(f"✅ Leave Request Email sent to admin: {admin_email} (From: {emp_org_email})")
        return True
    except Exception as e:
        log_debug(f"❌ Failed to send leave request email: {e}")
        return False

def send_leave_status_email(emp_org_email: str, emp_name: str, admin_email: str, status: str, leave_type: str, from_date: str, to_date: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = emp_org_email
        msg['Reply-To'] = admin_email
        msg['Subject'] = f"Leave Application Status Update: {status}"

        # Status color
        color = "#16a34a" if status == "APPROVED" else "#dc2626"

        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Leave Application Update</h2>
            <p>Dear {emp_name},</p>
            <p>Your leave application for <strong>{leave_type}</strong> ({from_date} to {to_date}) has been <strong style="color: {color};">{status}</strong> by Management ({admin_email}).</p>
            <br>
            <p>You can check your updated leave balance in the Employee Portal.</p>
            <br>
            <p>Best Regards,<br>HR Team</p>
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        log_debug(f"✅ Leave Status Email sent to employee: {emp_org_email} (From Admin: {admin_email})")
        return True
    except Exception as e:
        log_debug(f"❌ Failed to send leave status email: {e}")
        return False

def send_attendance_status_email(emp_org_email: str, emp_name: str, admin_email: str, status: str, request_type: str, date: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = emp_org_email
        msg['Reply-To'] = admin_email
        msg['Subject'] = f"Attendance Request Status: {status}"

        # Status color
        color = "#16a34a" if status == "APPROVED" else "#dc2626"

        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Attendance Request Update</h2>
            <p>Dear {emp_name},</p>
            <p>Your attendance exception request for <strong>{request_type}</strong> on <strong>{date}</strong> has been <strong style="color: {color};">{status}</strong> by Management ({admin_email}).</p>
            <br>
            <p>Best Regards,<br>HR Team</p>
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        log_debug(f"✅ Attendance Status Email sent to employee: {emp_org_email} (From Admin: {admin_email})")
        return True
    except Exception as e:
        log_debug(f"❌ Failed to send attendance status email: {e}")
        return False
