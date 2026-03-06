import uuid
from datetime import datetime, timezone

from app import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.Text, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    otps = db.relationship(
        "OTP", back_populates="user", lazy="dynamic", cascade="all, delete-orphan"
    )
    reviews = db.relationship(
        "Review", back_populates="user", lazy="dynamic", cascade="all, delete-orphan"
    )
    refresh_tokens = db.relationship(
        "RefreshToken",
        back_populates="user",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<User {self.email} verified={self.is_verified}>"
