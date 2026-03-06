import uuid
from datetime import datetime, timezone

from app import db


class OTP(db.Model):
    __tablename__ = "otps"

    id = db.Column(db.String(36), primary_key=True,
                   default=lambda: str(uuid.uuid4()))
    user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    code_hash = db.Column(db.Text, nullable=False)
    purpose = db.Column(
        db.String(10),
        db.CheckConstraint("purpose IN ('signup', 'reset')",
                           name="ck_otp_purpose"),
        nullable=False,
    )
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    used = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user = db.relationship("User", back_populates="otps")

    def is_expired(self) -> bool:
        expires = self.expires_at
        if expires.tzinfo is None:
            # SQLite returns naive datetimes — treat as UTC
            expires = expires.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) > expires

    def __repr__(self):
        return f"<OTP user={self.user_id} purpose={self.purpose} used={self.used}>"
