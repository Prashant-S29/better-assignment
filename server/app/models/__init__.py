# Import all models here so SQLAlchemy/Alembic can detect them
from app.models.otp import OTP
from app.models.refresh_token import RefreshToken
from app.models.review import Review
from app.models.user import User

__all__ = ["User", "OTP", "Review", "RefreshToken"]
