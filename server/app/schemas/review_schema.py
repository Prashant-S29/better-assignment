import re
from pydantic import BaseModel, field_validator
from typing import Optional

# GitHub PR URL pattern — enforced on both server and client
GITHUB_PR_PATTERN = re.compile(
    r"^https://github\.com/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+/pull/\d+$"
)


class ReviewRequest(BaseModel):
    pr_url: str

    @field_validator("pr_url")
    @classmethod
    def validate_pr_url(cls, v: str) -> str:
        v = v.strip().rstrip("/")
        if not GITHUB_PR_PATTERN.match(v):
            raise ValueError(
                "Must be a valid GitHub PR URL: https://github.com/{owner}/{repo}/pull/{number}"
            )
        return v


class PRMetadata(BaseModel):
    """Parsed GitHub API response — never pass raw dicts from GitHub into services."""
    title: str
    additions: int
    deletions: int
    total_changes: int = 0

    def model_post_init(self, __context) -> None:
        self.total_changes = self.additions + self.deletions


# ── AI Output Schema ──────────────────────────────────────────────────────────
# This is the most critical Pydantic boundary.
# The full accumulated stream is parsed through this before any DB write.
# If OpenAI returns malformed JSON or wrong types, ValidationError is raised
# and the review is marked 'failed' — AI output is never trusted blindly.

class ReviewSection(BaseModel):
    observations: str
    score: int

    @field_validator("score")
    @classmethod
    def score_range(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Score must be between 1 and 5.")
        return v


class AIReviewOutput(BaseModel):
    summary: str
    architecture: ReviewSection
    quality: ReviewSection
    correctness: ReviewSection
    security: ReviewSection
    error_handling: ReviewSection
    overall_score: float

    @field_validator("overall_score")
    @classmethod
    def overall_score_range(cls, v: float) -> float:
        if not 1.0 <= v <= 5.0:
            raise ValueError("Overall score must be between 1.0 and 5.0.")
        return round(v, 2)