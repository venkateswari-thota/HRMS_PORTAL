import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Credentials (In Production use Env Vars)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "prag.venkateswari@gmail.com"
SENDER_PASSWORD = "Prag@login1234" # Note: User might need App Password if 2FA is on

def send_credentials_email(to_email: str, emp_id: str, password: str, name: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = "Your HRMS Login Credentials"

        body = f"""
        <html>
        <body>
            <h2>Welcome to the Team, {name}!</h2>
            <p>Your HRMS account has been created.</p>
            <p><strong>Login Details:</strong></p>
            <ul>
                <li><strong>Emp ID:</strong> {emp_id}</li>
                <li><strong>Password:</strong> {password}</li>
            </ul>
            <p>Please login at the Employee Portal and change your password if prompted.</p>
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
