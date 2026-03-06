import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app
from app.middleware.error_handler import EmailSendError

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, body_html: str) -> None:
    """Send an email via Google SMTP. Raises EmailSendError on failure."""
    gmail_user = current_app.config["GMAIL_USER"]
    gmail_password = current_app.config["GMAIL_APP_PASSWORD"]

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"ReviewBot <{gmail_user}>"
    msg["To"] = to
    msg.attach(MIMEText(body_html, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(gmail_user, gmail_password)
            server.sendmail(gmail_user, to, msg.as_string())
        logger.info("Email sent to %s | subject: %s", to, subject)
    except smtplib.SMTPException as e:
        logger.error("Failed to send email to %s: %s", to, str(e))
        raise EmailSendError()


def send_otp_email(to: str, code: str, purpose: str) -> None:
    """Compose and send OTP email for signup or password reset."""
    if purpose == "signup":
        subject = "Verify your ReviewBot account"
        heading = "Verify your email"
        message = "Use the code below to complete your signup. It expires in 10 minutes."
    else:
        subject = "Reset your ReviewBot password"
        heading = "Reset your password"
        message = "Use the code below to reset your password. It expires in 10 minutes."

    body_html = f"""
    <div style="font-family:monospace;max-width:480px;margin:0 auto;padding:2rem;background:#0a0a0a;color:#f0f0f0;">
        <h2 style="font-size:1.25rem;margin-bottom:0.5rem;">{heading}</h2>
        <p style="color:#999;font-size:0.875rem;margin-bottom:2rem;">{message}</p>
        <div style="background:#111;border:1px solid #222;border-radius:8px;padding:1.5rem;text-align:center;margin-bottom:2rem;">
            <span style="font-size:2rem;font-weight:700;letter-spacing:0.5em;color:#e8ff47;">{code}</span>
        </div>
        <p style="color:#666;font-size:0.75rem;">If you didn't request this, ignore this email.</p>
    </div>
    """
    send_email(to, subject, body_html)
