from flask import Blueprint, jsonify, g
from app.middleware.auth_middleware import require_auth
import app.services.review_service as review_service

share_bp = Blueprint("share", __name__)


@share_bp.get("/<hex_code>")
@require_auth
def get_shared_review(hex_code: str):
    review = review_service.get_review_by_share_code(hex_code, g.user_id)
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
