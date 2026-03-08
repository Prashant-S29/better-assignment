import logging
import urllib.request
import urllib.error
import json

from app.schemas.review_schema import PRMetadata
from app.middleware.error_handler import (
    InvalidPRURLError, PrivateRepoError,
    GitHubRateLimitError, GitHubAPIError, PRTooLargeError
)
from flask import current_app

logger = logging.getLogger(__name__)

GITHUB_API_BASE = "https://api.github.com"


def _github_headers(accept: str = "application/vnd.github.v3+json") -> dict:
    headers = {
        "Accept": accept,
        "User-Agent": "ReviewBot/1.0",
    }
    token = current_app.config.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def parse_pr_url(url: str) -> tuple[str, str, int]:
    """Extract (owner, repo, pr_number) from a validated GitHub PR URL."""
    # URL already validated by ReviewRequest schema — just parse
    parts = url.rstrip("/").split("/")
    # https://github.com/{owner}/{repo}/pull/{number}
    try:
        owner = parts[3]
        repo = parts[4]
        number = int(parts[6])
        return owner, repo, number
    except (IndexError, ValueError):
        raise InvalidPRURLError()


def fetch_pr_metadata(owner: str, repo: str, number: int) -> PRMetadata:
    """Fetch PR title, additions, deletions from GitHub API."""
    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/pulls/{number}"
    req = urllib.request.Request(
        url,
        headers=_github_headers("application/vnd.github.v3+json")
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            data = json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        if e.code == 404:
            raise PrivateRepoError()
        if e.code == 403:
            raise GitHubRateLimitError()
        raise GitHubAPIError(f"GitHub API returned {e.code}")
    except urllib.error.URLError as e:
        raise GitHubAPIError(f"Failed to reach GitHub: {e.reason}")

    return PRMetadata(
        title=data.get("title", "Untitled PR"),
        additions=data.get("additions", 0),
        deletions=data.get("deletions", 0),
    )


def check_size_limit(metadata: PRMetadata) -> None:
    """Raise PRTooLargeError if PR exceeds configured line limit."""
    limit = current_app.config["PR_MAX_LINES"]
    if metadata.total_changes > limit:
        raise PRTooLargeError(
            f"This PR has {metadata.total_changes} changed lines, "
            f"which exceeds the {limit} line limit."
        )


def fetch_pr_diff(owner: str, repo: str, number: int) -> str:
    """Fetch raw unified diff text for a PR."""
    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/pulls/{number}"
    req = urllib.request.Request(
        url,
        headers=_github_headers("application/vnd.github.v3.diff")
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            return res.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            raise PrivateRepoError()
        if e.code == 403:
            raise GitHubRateLimitError()
        raise GitHubAPIError(f"GitHub API returned {e.code}")
    except urllib.error.URLError as e:
        raise GitHubAPIError(f"Failed to reach GitHub: {e.reason}")
