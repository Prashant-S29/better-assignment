import json
import logging
from typing import Generator

from flask import current_app
from app import db
from app.models.review import Review
from app.schemas.review_schema import ReviewRequest
import app.services.github_service as github_service
import app.services.ai_service as ai_service
from app.middleware.error_handler import AIValidationError, NotFoundError, ForbiddenError

logger = logging.getLogger(__name__)


def create_and_stream_review(pr_url: str, user_id: str) -> Generator[str, None, None]:
    """
    Full review pipeline as an SSE generator.

    Yields:
        data: {"token": "..."}          — per AI token
        data: {"done": true, "review_id": "..."}  — on success
        data: {"error": "..."}          — on failure

    DB is always left in a terminal state (completed or failed) — never stuck pending.
    """
    review = None

    try:
        # 1. Validate URL + fetch metadata + check size limit
        owner, repo, number = github_service.parse_pr_url(pr_url)
        metadata = github_service.fetch_pr_metadata(owner, repo, number)
        github_service.check_size_limit(metadata)

        # 2. Create review row — status: pending
        review = Review(
            user_id=user_id,
            pr_url=pr_url,
            pr_title=metadata.title,
            pr_diff_size=metadata.total_changes,
            status="pending",
        )
        db.session.add(review)
        db.session.commit()

        # 3. Fetch diff
        diff_text = github_service.fetch_pr_diff(owner, repo, number)

        # 4. Stream AI tokens + accumulate
        accumulated = ""
        for token in ai_service.generate_review_stream(metadata.title, diff_text):
            accumulated += token
            yield f"data: {json.dumps({'token': token})}\n\n"

        # 5. Validate accumulated output against AIReviewOutput schema
        validated = ai_service.validate_ai_output(accumulated)

        # 6. Save completed review
        review.status = "completed"
        review.result_json = validated.model_dump()
        db.session.commit()

        logger.info("Review completed: %s", review.id)
        yield f"data: {json.dumps({'done': True, 'review_id': review.id})}\n\n"

    except AIValidationError as e:
        # AI returned bad output — mark failed, surface error
        if review:
            review.status = "failed"
            review.error_message = str(e)
            db.session.commit()
        yield f"data: {json.dumps({'error': e.message})}\n\n"

    except Exception as e:
        # Any other failure — mark failed, never leave pending
        if review:
            review.status = "failed"
            review.error_message = str(e)
            db.session.commit()
        logger.error("Review pipeline failed: %s", str(e))
        # Re-raise typed errors so error_handler returns correct HTTP code
        raise


def get_review_by_id(review_id: str, user_id: str) -> Review:
    review = Review.query.get(review_id)
    if not review:
        raise NotFoundError()
    if review.user_id != user_id:
        raise ForbiddenError()
    return review


def get_reviews_for_user(user_id: str) -> list[Review]:
    return (
        Review.query
        .filter_by(user_id=user_id)
        .order_by(Review.created_at.desc())
        .all()
    )


def get_review_by_share_code(share_code: str, user_id: str) -> Review:
    """Share links require auth but any logged-in user can view."""
    review = Review.query.filter_by(share_code=share_code).first()
    if not review:
        raise NotFoundError()
    return review
