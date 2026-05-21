import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_verification_email(email: str, name: str, token: str):
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Verify your InferMesh account"
        msg["From"] = f"InferMesh <{settings.GMAIL_USER}>"
        msg["To"] = email

        html = f"""
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <div style="margin-bottom: 32px;">
                <div style="width: 32px; height: 32px; background: #5865f2; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-weight: 700; font-size: 15px;">I</span>
                </div>
                <span style="font-weight: 600; font-size: 16px; vertical-align: middle; margin-left: 8px;">InferMesh</span>
            </div>
            <h1 style="font-size: 22px; font-weight: 600; margin: 0 0 8px; color: #111;">Verify your email</h1>
            <p style="color: #666; font-size: 14px; margin: 0 0 28px; line-height: 1.6;">
                Hi {name}, click the button below to verify your email address and activate your account.
            </p>
            <a href="{verify_url}" style="display: inline-block; padding: 12px 24px; background: #5865f2; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">
                Verify email address
            </a>
            <p style="color: #aaa; font-size: 12px; margin: 24px 0 0;">
                If you did not create an account, ignore this email.
            </p>
        </div>
        """

        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.GMAIL_USER, settings.GMAIL_APP_PASSWORD)
            server.sendmail(settings.GMAIL_USER, email, msg.as_string())

        print(f"Verification email sent to {email}")
    except Exception as e:
        print(f"Email send failed: {e}")
