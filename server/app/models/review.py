import secrets
import uuid
from datetime import datetime, timezone

from app import db


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    pr_url = db.Column(db.Text, nullable=False)
    pr_title = db.Column(db.Text, nullable=True)
    pr_diff_size = db.Column(db.Integer, nullable=True)
    share_code = db.Column(
        db.String(12),
        unique=True,
        nullable=False,
        default=lambda: secrets.token_hex(
            6
        ),  # always secrets.token_hex — never uuid/random
    )
    status = db.Column(
        db.String(20),
        db.CheckConstraint(
            "status IN ('pending', 'completed', 'failed')", name="ck_review_status"
        ),
        nullable=False,
        default="pending",
    )
    result_json = db.Column(db.JSON, nullable=True)  # null until status = completed
    error_message = db.Column(db.Text, nullable=True)  # populated if status = failed
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user = db.relationship("User", back_populates="reviews")

    def __repr__(self):
        return f"<Review {self.id} status={self.status} pr={self.pr_url}>"
