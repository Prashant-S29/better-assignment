from unittest.mock import patch, MagicMock
import urllib.error
import pytest

from app.schemas.review_schema import PRMetadata
from app.middleware.error_handler import (
    InvalidPRURLError, PrivateRepoError,
    GitHubRateLimitError, PRTooLargeError
)


class TestParsePrUrl:
    def test_valid_url_parses_correctly(self, app):
        with app.app_context():
            from app.services.github_service import parse_pr_url
            owner, repo, number = parse_pr_url(
                "https://github.com/torvalds/linux/pull/999")
            assert owner == "torvalds"
            assert repo == "linux"
            assert number == 999

    def test_invalid_url_raises(self, app):
        with app.app_context():
            from app.services.github_service import parse_pr_url
            with pytest.raises(InvalidPRURLError):
                parse_pr_url("https://github.com/owner/repo")


class TestFetchPrMetadata:
    def _mock_response(self, data: dict):
        import json
        mock = MagicMock()
        mock.read.return_value = json.dumps(data).encode()
        mock.__enter__ = lambda s: s
        mock.__exit__ = MagicMock(return_value=False)
        return mock

    def test_returns_pr_metadata(self, app):
        with app.app_context():
            from app.services.github_service import fetch_pr_metadata
            mock_res = self._mock_response({
                "title": "Add login endpoint",
                "additions": 120,
                "deletions": 30,
            })
            with patch("urllib.request.urlopen", return_value=mock_res):
                meta = fetch_pr_metadata("owner", "repo", 1)
                assert meta.title == "Add login endpoint"
                assert meta.total_changes == 150

    def test_404_raises_private_repo_error(self, app):
        with app.app_context():
            from app.services.github_service import fetch_pr_metadata
            with patch("urllib.request.urlopen", side_effect=urllib.error.HTTPError(
                url="", code=404, msg="Not Found", hdrs=None, fp=None
            )):
                with pytest.raises(PrivateRepoError):
                    fetch_pr_metadata("owner", "repo", 1)

    def test_403_raises_rate_limit_error(self, app):
        with app.app_context():
            from app.services.github_service import fetch_pr_metadata
            with patch("urllib.request.urlopen", side_effect=urllib.error.HTTPError(
                url="", code=403, msg="Forbidden", hdrs=None, fp=None
            )):
                with pytest.raises(GitHubRateLimitError):
                    fetch_pr_metadata("owner", "repo", 1)


class TestCheckSizeLimit:
    def test_pr_within_limit_passes(self, app):
        with app.app_context():
            from app.services.github_service import check_size_limit
            meta = PRMetadata(title="Test", additions=250, deletions=249)
            check_size_limit(meta)  # should not raise

    def test_pr_exactly_at_limit_passes(self, app):
        with app.app_context():
            from app.services.github_service import check_size_limit
            meta = PRMetadata(title="Test", additions=250, deletions=250)
            check_size_limit(meta)  # 500 exactly — passes

    def test_pr_over_limit_raises(self, app):
        with app.app_context():
            from app.services.github_service import check_size_limit
            meta = PRMetadata(title="Test", additions=300, deletions=201)
            with pytest.raises(PRTooLargeError):
                check_size_limit(meta)
