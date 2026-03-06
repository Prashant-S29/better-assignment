import random
import string
import logging
from datetime import datetime, timezone, timedelta

import bcrypt
import jwt

from flask import current_app
from app import db
from app.models.user import User
from app.models.otp import OTP
from app.models.refresh_token import RefreshToken
from app.services.email_service import send_otp_email
from app.middleware.error_handler import (
    UserAlreadyExistsError, InvalidCredentialsError, AccountNotVerifiedError,
    OTPInvalidError, AuthenticationError, TokenExpiredError, TokenInvalidError
)

logger = logging.getLogger(__name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _hash(value: str) -> str:
    return bcrypt.hashpw(value.encode(), bcrypt.gensalt()).decode()


def _verify(value: str, hashed: str) -> bool:
    return bcrypt.checkpw(value.encode(), hashed.encode())


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def _issue_tokens(user_id: str) -> dict:
    config = current_app.config
    now = datetime.now(timezone.utc)

    access_payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(minutes=config["JWT_ACCESS_TOKEN_EXPIRES_MINUTES"]),
        "type": "access",
    }
    refresh_payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(days=config["JWT_REFRESH_TOKEN_EXPIRES_DAYS"]),
        "type": "refresh",
    }

    access_token = jwt.encode(
        access_payload, config["JWT_SECRET"], algorithm="HS256")
    refresh_token = jwt.encode(
        refresh_payload, config["JWT_SECRET"], algorithm="HS256")

    # Store hashed refresh token
    rt = RefreshToken(
        user_id=user_id,
        token_hash=_hash(refresh_token),
        expires_at=now +
        timedelta(days=config["JWT_REFRESH_TOKEN_EXPIRES_DAYS"]),
    )
    db.session.add(rt)
    db.session.commit()

    return {"access_token": access_token, "refresh_token": refresh_token}


# ── Service functions ─────────────────────────────────────────────────────────

def signup(email: str, password: str) -> dict:
    email = email.lower().strip()

    if User.query.filter_by(email=email).first():
        raise UserAlreadyExistsError()

    user = User(email=email, password_hash=_hash(password), is_verified=False)
    db.session.add(user)
    db.session.commit()

    _send_otp(user, "signup")
    logger.info("New user signed up: %s", email)
    return {"message": "Account created. Check your email for a verification code."}


def verify_otp(email: str, code: str, purpose: str) -> dict:
    email = email.lower().strip()
    user = User.query.filter_by(email=email).first()
    if not user:
        raise OTPInvalidError()

    otp = (
        OTP.query
        .filter_by(user_id=user.id, purpose=purpose, used=False)
        .order_by(OTP.created_at.desc())
        .first()
    )

    if not otp or otp.is_expired() or not _verify(code, otp.code_hash):
        raise OTPInvalidError()

    otp.used = True

    if purpose == "signup":
        user.is_verified = True

    db.session.commit()

    if purpose == "signup":
        tokens = _issue_tokens(user.id)
        return {**tokens, "user": {"id": user.id, "email": user.email}}

    return {"message": "Code verified. You may now reset your password."}


def login(email: str, password: str) -> dict:
    email = email.lower().strip()
    user = User.query.filter_by(email=email).first()

    if not user or not _verify(password, user.password_hash):
        raise InvalidCredentialsError()

    if not user.is_verified:
        raise AccountNotVerifiedError()

    tokens = _issue_tokens(user.id)
    logger.info("User logged in: %s", email)
    return {**tokens, "user": {"id": user.id, "email": user.email}}


def refresh_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token, current_app.config["JWT_SECRET"], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise TokenExpiredError()
    except jwt.InvalidTokenError:
        raise TokenInvalidError()

    if payload.get("type") != "refresh":
        raise TokenInvalidError()

    # Find matching token in DB
    user_id = payload["sub"]
    stored_tokens = RefreshToken.query.filter_by(
        user_id=user_id, revoked=False).all()
    matching = next(
        (rt for rt in stored_tokens if _verify(token, rt.token_hash)), None)

    if not matching or not matching.is_valid():
        raise TokenInvalidError()

    # Issue new access token only
    now = datetime.now(timezone.utc)
    access_payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(minutes=current_app.config["JWT_ACCESS_TOKEN_EXPIRES_MINUTES"]),
        "type": "access",
    }
    access_token = jwt.encode(
        access_payload, current_app.config["JWT_SECRET"], algorithm="HS256")
    return {"access_token": access_token}


def request_reset(email: str) -> dict:
    email = email.lower().strip()
    user = User.query.filter_by(email=email).first()
    # Always return success — don't leak whether email exists
    if user and user.is_verified:
        _send_otp(user, "reset")
    return {"message": "If an account exists, a reset code has been sent."}


def confirm_reset(email: str, code: str, new_password: str) -> dict:
    email = email.lower().strip()
    user = User.query.filter_by(email=email).first()
    if not user:
        raise OTPInvalidError()

    otp = (
        OTP.query
        .filter_by(user_id=user.id, purpose="reset", used=False)
        .order_by(OTP.created_at.desc())
        .first()
    )

    if not otp or otp.is_expired() or not _verify(code, otp.code_hash):
        raise OTPInvalidError()

    otp.used = True
    user.password_hash = _hash(new_password)
    db.session.commit()

    logger.info("Password reset for user: %s", email)
    return {"message": "Password updated successfully."}


def logout(token: str) -> dict:
    try:
        payload = jwt.decode(
            token, current_app.config["JWT_SECRET"], algorithms=["HS256"])
    except jwt.InvalidTokenError:
        # Token invalid — treat as already logged out
        return {"message": "Logged out."}

    user_id = payload.get("sub")
    if user_id:
        stored_tokens = RefreshToken.query.filter_by(
            user_id=user_id, revoked=False).all()
        for rt in stored_tokens:
            if _verify(token, rt.token_hash):
                rt.revoked = True
                break
        db.session.commit()

    return {"message": "Logged out."}


# ── Internal ──────────────────────────────────────────────────────────────────

def _send_otp(user: User, purpose: str) -> None:
    code = _generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    otp = OTP(
        user_id=user.id,
        code_hash=_hash(code),
        purpose=purpose,
        expires_at=expires_at,
    )
    db.session.add(otp)
    db.session.commit()

    send_otp_email(user.email, code, purpose)
