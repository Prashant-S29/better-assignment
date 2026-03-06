from flask import Blueprint, request, jsonify, g
from app.schemas.review_schema import ReviewRequest
from app.middleware.auth_middleware import require_auth
import app.services.github_service as github_service

review_bp = Blueprint("reviews", __name__)


def _body() -> dict:
    return request.get_json(silent=True) or {}


@review_bp.post("")
@require_auth
def submit_review():
    data = ReviewRequest(**_body())
    owner, repo, number = github_service.parse_pr_url(data.pr_url)
    metadata = github_service.fetch_pr_metadata(owner, repo, number)
    github_service.check_size_limit(metadata)

    # Full review pipeline added in M5
    return jsonify({"success": True, "data": {
        "pr_title": metadata.title,
        "pr_diff_size": metadata.total_changes,
        "message": "PR validated. Review pipeline coming in M5."
    }}), 200


@review_bp.get("")
@require_auth
def list_reviews():
    # Implemented in M5
    return jsonify({"success": True, "data": []}), 200


@review_bp.get("/<review_id>")
@require_auth
def get_review(review_id: str):
    # Implemented in M5
    return jsonify({"success": True, "data": {}}), 200
