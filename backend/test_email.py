import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Credentials
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "venkateswarithota456@gmail.com"
SENDER_PASSWORD = "jzfh pkxs rasn scwk"

def test_email():
    try:
        print(f"Connecting to {SMTP_SERVER}:{SMTP_PORT}...")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.set_debuglevel(1) # Enable debug output
        server.starttls()
        print("Logging in...")
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        print("Login Successful!")
        
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = "venkateswarithota@pragyatmika.in" # Send to self
        msg['Subject'] = "Test Email"
        msg.attach(MIMEText("This is a test email.", 'plain'))
        
        server.send_message(msg)
        print("Email Sent Successfully!")
        server.quit()
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_email()
