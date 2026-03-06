from unittest.mock import patch, MagicMock
import pytest
from app.models.review import Review
from app import db


VALID_AI_JSON = """{
    "summary": "Adds login endpoint.",
    "architecture": {"observations": "Clean.", "score": 4},
    "quality": {"observations": "Readable.", "score": 4},
    "correctness": {"observations": "Correct.", "score": 5},
    "security": {"observations": "Secure.", "score": 5},
    "error_handling": {"observations": "OK.", "score": 3},
    "overall_score": 4.2
}"""


def _make_user(app):
    from app.models.user import User
    with app.app_context():
        u = User(email="reviewer@example.com",
                 password_hash="x", is_verified=True)
        db.session.add(u)
        db.session.commit()
        return u.id


class TestCreateAndStreamReview:
    def _run_stream(self, app, user_id, pr_url="https://github.com/owner/repo/pull/1"):
        with app.app_context():
            from app.services.review_service import create_and_stream_review
            return list(create_and_stream_review(pr_url, user_id))

    def test_completed_review_saved_to_db(self, app):
        user_id = _make_user(app)
        with (
            patch("app.services.review_service.github_service.parse_pr_url",
                  return_value=("owner", "repo", 1)),
            patch("app.services.review_service.github_service.fetch_pr_metadata",
                  return_value=MagicMock(title="Test PR", total_changes=100)),
            patch("app.services.review_service.github_service.check_size_limit"),
            patch("app.services.review_service.github_service.fetch_pr_diff",
                  return_value="diff text"),
            patch("app.services.review_service.ai_service.generate_review_stream",
                  return_value=iter([VALID_AI_JSON])),
        ):
            events = self._run_stream(app, user_id)

        with app.app_context():
            review = Review.query.filter_by(user_id=user_id).first()
            assert review is not None
            assert review.status == "completed"
            assert review.result_json is not None
            assert review.result_json["overall_score"] == 4.2

        assert any('"done": true' in e or '"done":true' in e for e in events)

    def test_failed_review_marked_in_db_on_bad_ai_output(self, app):
        user_id = _make_user(app)
        with (
            patch("app.services.review_service.github_service.parse_pr_url",
                  return_value=("owner", "repo", 1)),
            patch("app.services.review_service.github_service.fetch_pr_metadata",
                  return_value=MagicMock(title="Test PR", total_changes=100)),
            patch("app.services.review_service.github_service.check_size_limit"),
            patch("app.services.review_service.github_service.fetch_pr_diff",
                  return_value="diff text"),
            patch("app.services.review_service.ai_service.generate_review_stream",
                  return_value=iter(["not valid json"])),
        ):
            events = self._run_stream(app, user_id)

        with app.app_context():
            review = Review.query.filter_by(user_id=user_id).first()
            assert review.status == "failed"
            assert review.error_message is not None

        assert any('"error"' in e for e in events)

    def test_done_event_contains_review_id(self, app):
        user_id = _make_user(app)
        with (
            patch("app.services.review_service.github_service.parse_pr_url",
                  return_value=("owner", "repo", 1)),
            patch("app.services.review_service.github_service.fetch_pr_metadata",
                  return_value=MagicMock(title="Test PR", total_changes=100)),
            patch("app.services.review_service.github_service.check_size_limit"),
            patch("app.services.review_service.github_service.fetch_pr_diff",
                  return_value="diff text"),
            patch("app.services.review_service.ai_service.generate_review_stream",
                  return_value=iter([VALID_AI_JSON])),
        ):
            events = self._run_stream(app, user_id)

        done_events = [e for e in events if '"done"' in e]
        assert len(done_events) == 1
        import json
        done_data = json.loads(done_events[0].replace("data: ", ""))
        assert "review_id" in done_data
