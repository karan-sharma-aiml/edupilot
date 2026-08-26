import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings
import logging
import re

logger = logging.getLogger(__name__)

async def send_email(to_email: str, subject: str, html_body: str):
    """Send email via SMTP. Falls back to console logging in development."""
    try:
        if not settings.SMTP_USER or settings.SMTP_USER == "your-email@gmail.com":
            # Development fallback - log to console
            logger.info(f"\n{'='*50}\nEMAIL TO: {to_email}\nSUBJECT: {subject}\n{'='*50}")
            print(f"\n[EMAIL] TO: {to_email}")
            print(f"  SUBJECT: {subject}")
            # Extract link from HTML for easy testing
            links = re.findall(r'href="([^"]+)"', html_body)
            for link in links:
                print(f"  LINK: {link}")
            print()
            return True
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"EduPilot <{settings.SMTP_USER}>"
        msg['To'] = to_email
        msg.attach(MIMEText(html_body, 'html'))
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        print(f"\n[EMAIL WARNING] Send failed - TO: {to_email}, SUBJECT: {subject}")
        return False

async def send_verification_email(to_email: str, name: str, token: str):
    verify_url = f"{settings.FRONTEND_URL}/auth/verify-email/{token}"
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #fff; margin-bottom: 8px;">Welcome to EduPilot!</h2>
        <p style="color: #a1a1aa;">Hi {name}, please verify your email to get started.</p>
        <a href="{verify_url}" style="display: inline-block; background: linear-gradient(to right, #3b82f6, #8b5cf6); color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0;">Verify Email</a>
        <p style="color: #71717a; font-size: 14px;">Or copy this link: {verify_url}</p>
    </div>
    """
    await send_email(to_email, "Verify your EduPilot account", html)

async def send_reset_email(to_email: str, name: str, token: str):
    reset_url = f"{settings.FRONTEND_URL}/auth/reset-password/{token}"
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #fff;">Reset Your Password</h2>
        <p style="color: #a1a1aa;">Hi {name}, we received a request to reset your password.</p>
        <a href="{reset_url}" style="display: inline-block; background: linear-gradient(to right, #3b82f6, #8b5cf6); color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0;">Reset Password</a>
        <p style="color: #71717a; font-size: 14px;">This link expires in 1 hour.</p>
        <p style="color: #71717a; font-size: 14px;">If you didn't request this, please ignore this email.</p>
    </div>
    """
    await send_email(to_email, "Reset your EduPilot password", html)

async def send_welcome_email(to_email: str, name: str):
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #fff;">You're all set!</h2>
        <p style="color: #a1a1aa;">Hi {name}, your EduPilot account is verified and ready.</p>
        <p style="color: #a1a1aa;">Start your personalized learning journey today.</p>
        <a href="{settings.FRONTEND_URL}/dashboard" style="display: inline-block; background: linear-gradient(to right, #3b82f6, #8b5cf6); color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0;">Go to Dashboard</a>
    </div>
    """
    await send_email(to_email, "Welcome to EduPilot!", html)
