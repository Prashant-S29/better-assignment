from unittest.mock import MagicMock

import pytest

from app import create_app
from app import db as _db
from app.config import TestConfig


@pytest.fixture(scope="session")
def app():
    """Session-scoped Flask app using TestConfig (SQLite in-memory)."""
    _app = create_app(TestConfig())
    with _app.app_context():
        _db.create_all()
        yield _app
        _db.drop_all()


@pytest.fixture(scope="function")
def client(app):
    """Test client for HTTP requests."""
    return app.test_client()


@pytest.fixture(scope="function", autouse=True)
def clean_db(app):
    """Roll back DB changes after each test."""
    with app.app_context():
        yield
        _db.session.rollback()
        # Clear all tables
        for table in reversed(_db.metadata.sorted_tables):
            _db.session.execute(table.delete())
        _db.session.commit()


@pytest.fixture
def mock_email_service(monkeypatch):
    """Prevent real emails from being sent in tests."""
    mock = MagicMock(return_value=None)
    monkeypatch.setattr("app.services.email_service.send_email", mock)
    return mock


@pytest.fixture
def mock_openai(monkeypatch):
    """Mock OpenAI to return a fixture review response."""
    mock_response = MagicMock()
    mock_response.choices[0].message.content = """{
        "summary": "This PR adds a login endpoint.",
        "architecture": {"observations": "Clean separation of concerns.", "score": 4},
        "quality": {"observations": "Readable and well-named.", "score": 4},
        "correctness": {"observations": "Logic appears correct.", "score": 4},
        "security": {"observations": "Password hashed correctly.", "score": 5},
        "error_handling": {"observations": "Missing some edge cases.", "score": 3},
        "overall_score": 4.0
    }"""
    monkeypatch.setattr(
        "app.services.ai_service.openai_client.chat.completions.create",
        MagicMock(return_value=mock_response),
    )
    return mock_response


@pytest.fixture
def mock_github(monkeypatch):
    """Mock GitHub API responses."""
    metadata = {
        "title": "Add login endpoint",
        "additions": 120,
        "deletions": 30,
        "total_changes": 150,
    }
    diff = "diff --git a/auth.py b/auth.py\n+def login(): pass"

    monkeypatch.setattr(
        "app.services.github_service.fetch_pr_metadata",
        MagicMock(return_value=metadata),
    )
    monkeypatch.setattr(
        "app.services.github_service.fetch_pr_diff", MagicMock(return_value=diff)
    )
    return {"metadata": metadata, "diff": diff}
