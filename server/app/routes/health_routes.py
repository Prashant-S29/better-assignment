from flask import Blueprint, current_app, jsonify
from sqlalchemy import text

from app import db

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health():
    status = {
        "status": "ok",
        "db": "disconnected",
        "ai": "unconfigured",
        "email": "unconfigured",
    }

    # DB check
    try:
        db.session.execute(text("SELECT 1"))
        status["db"] = "connected"
    except Exception as e:
        current_app.logger.warning("DB health check failed: %s", e)
        status["db"] = "disconnected"
        status["status"] = "degraded"

    # AI check — just confirm key is present
    if current_app.config.get("OPENAI_API_KEY"):
        status["ai"] = "configured"

    # Email check
    if current_app.config.get("GMAIL_USER") and current_app.config.get(
        "GMAIL_APP_PASSWORD"
    ):
        status["email"] = "configured"

    http_status = 200 if status["status"] == "ok" else 207
    return jsonify({"success": True, "data": status}), http_status
