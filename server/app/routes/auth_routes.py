from flask import Blueprint, request, jsonify
from app.schemas.auth_schema import (
    SignupInput, OTPVerifyInput, LoginInput,
    RefreshTokenInput, ResetPasswordInput,
    ResetPasswordConfirmInput, LogoutInput
)
import app.services.auth_service as auth_service

auth_bp = Blueprint("auth", __name__)


def _body() -> dict:
    return request.get_json(silent=True) or {}


@auth_bp.post("/signup")
def signup():
    data = SignupInput(**_body())
    result = auth_service.signup(data.email, data.password)
    return jsonify({"success": True, "data": result}), 201


@auth_bp.post("/verify-otp")
def verify_otp():
    data = OTPVerifyInput(**_body())
    result = auth_service.verify_otp(data.email, data.code, data.purpose)
    return jsonify({"success": True, "data": result}), 200


@auth_bp.post("/login")
def login():
    data = LoginInput(**_body())
    result = auth_service.login(data.email, data.password)
    return jsonify({"success": True, "data": result}), 200


@auth_bp.post("/refresh")
def refresh():
    data = RefreshTokenInput(**_body())
    result = auth_service.refresh_token(data.refresh_token)
    return jsonify({"success": True, "data": result}), 200


@auth_bp.post("/reset-password")
def reset_password():
    data = ResetPasswordInput(**_body())
    result = auth_service.request_reset(data.email)
    return jsonify({"success": True, "data": result}), 200


@auth_bp.post("/reset-password/confirm")
def reset_password_confirm():
    data = ResetPasswordConfirmInput(**_body())
    result = auth_service.confirm_reset(
        data.email, data.code, data.new_password)
    return jsonify({"success": True, "data": result}), 200


@auth_bp.post("/logout")
def logout():
    data = LogoutInput(**_body())
    result = auth_service.logout(data.refresh_token)
    return jsonify({"success": True, "data": result}), 200
