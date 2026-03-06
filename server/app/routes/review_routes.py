from flask import Blueprint, request, jsonify, g, Response, stream_with_context
from app.schemas.review_schema import ReviewRequest
from app.middleware.auth_middleware import require_auth
import app.services.review_service as review_service

review_bp = Blueprint("reviews", __name__)


def _body() -> dict:
    return request.get_json(silent=True) or {}


@review_bp.post("")
@require_auth
def submit_review():
    data = ReviewRequest(**_body())
    return Response(
        stream_with_context(
            review_service.create_and_stream_review(data.pr_url, g.user_id)
        ),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # disable Nginx buffering on Render
        }
    )


@review_bp.get("")
@require_auth
def list_reviews():
    reviews = review_service.get_reviews_for_user(g.user_id)
    return jsonify({"success": True, "data": [
        {
            "id": r.id,
            "pr_url": r.pr_url,
            "pr_title": r.pr_title,
            "share_code": r.share_code,
            "status": r.status,
            "overall_score": r.result_json.get("overall_score") if r.result_json else None,
            "created_at": r.created_at.isoformat(),
        }
        for r in reviews
    ]}), 200


@review_bp.get("/<review_id>")
@require_auth
def get_review(review_id: str):
    review = review_service.get_review_by_id(review_id, g.user_id)
    return jsonify({"success": True, "data": {
        "id": review.id,
        "pr_url": review.pr_url,
        "pr_title": review.pr_title,
        "pr_diff_size": review.pr_diff_size,
        "share_code": review.share_code,
        "status": review.status,
        "result_json": review.result_json,
        "error_message": review.error_message,
        "created_at": review.created_at.isoformat(),
    }}), 200
