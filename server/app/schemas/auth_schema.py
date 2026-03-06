from typing import Literal

from pydantic import BaseModel, EmailStr, field_validator


class SignupInput(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class OTPVerifyInput(BaseModel):
    email: EmailStr
    code: str
    purpose: Literal["signup", "reset"]

    @field_validator("code")
    @classmethod
    def code_must_be_digits(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("OTP code must be exactly 6 digits.")
        return v


class ResetPasswordInput(BaseModel):
    email: EmailStr


class ResetPasswordConfirmInput(BaseModel):
    email: EmailStr
    code: str
    new_password: str

    @field_validator("code")
    @classmethod
    def code_must_be_digits(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("OTP code must be exactly 6 digits.")
        return v

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class RefreshTokenInput(BaseModel):
    refresh_token: str


class LogoutInput(BaseModel):
    refresh_token: str
