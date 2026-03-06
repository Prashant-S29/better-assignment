import os
from dotenv import load_dotenv

load_dotenv()


def _require(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise RuntimeError(
            f"Required environment variable '{key}' is not set.")
    return value


class Config:
    # Flask
    SECRET_KEY: str = _require("SECRET_KEY")
    DEBUG: bool = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    # Database
    SQLALCHEMY_DATABASE_URI: str = _require("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    SQLALCHEMY_ENGINE_OPTIONS: dict = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

    # JWT
    JWT_SECRET: str = _require("JWT_SECRET")
    JWT_ACCESS_TOKEN_EXPIRES_MINUTES: int = int(
        os.getenv("JWT_ACCESS_EXPIRES_MINUTES", "15"))
    JWT_REFRESH_TOKEN_EXPIRES_DAYS: int = int(
        os.getenv("JWT_REFRESH_EXPIRES_DAYS", "7"))

    # OpenAI
    OPENAI_API_KEY: str = _require("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")

    # Google SMTP
    GMAIL_USER: str = _require("GMAIL_USER")
    GMAIL_APP_PASSWORD: str = _require("GMAIL_APP_PASSWORD")

    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # PR size limit
    PR_MAX_LINES: int = int(os.getenv("PR_MAX_LINES", "4000"))


class TestConfig(Config):
    """Overrides for test environment — skips required env var checks."""
    TESTING: bool = True
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///:memory:"
    SECRET_KEY: str = "test-secret"
    JWT_SECRET: str = "test-jwt-secret"
    OPENAI_API_KEY: str = "test-openai-key"
    GMAIL_USER: str = "test@gmail.com"
    GMAIL_APP_PASSWORD: str = "test-password"

    def __init__(self):
        # Skip _require() calls from parent
        pass
