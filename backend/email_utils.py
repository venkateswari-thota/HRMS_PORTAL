import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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
