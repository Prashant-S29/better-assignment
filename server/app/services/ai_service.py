import json
import logging
from typing import Generator

from openai import OpenAI
from flask import current_app
from app.schemas.review_schema import AIReviewOutput
from app.middleware.error_handler import AIValidationError

logger = logging.getLogger(__name__)

# Module-level client — instantiated once per process
_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=current_app.config["OPENAI_API_KEY"])
    return _client


def build_system_prompt() -> str:
    return """You are an expert code reviewer. Analyze the given GitHub PR diff and return a structured review.

You MUST respond with ONLY valid JSON matching this exact structure — no markdown, no explanation, just JSON:

{
  "summary": "Plain English description of what this PR does",
  "architecture": {
    "observations": "Design decisions, structure, patterns used",
    "score": 4
  },
  "quality": {
    "observations": "Readability, naming, duplication, complexity",
    "score": 4
  },
  "correctness": {
    "observations": "Logic bugs, edge cases, off-by-one errors",
    "score": 4
  },
  "security": {
    "observations": "Vulnerabilities, injection risks, secrets exposure",
    "score": 4
  },
  "error_handling": {
    "observations": "Missing try/catch, unhandled edge cases, error propagation",
    "score": 4
  },
  "overall_score": 4.0
}

Rules:
- scores are integers 1-5 (1=poor, 5=excellent)
- overall_score is a float 1.0-5.0, weighted average of all section scores
- observations must be specific and actionable, not generic
- if the diff is small or unclear, still provide best-effort observations
- NEVER include anything outside the JSON object"""


def build_user_prompt(pr_title: str, diff_text: str) -> str:
    # Truncate diff to avoid token overflow — keep within safe limit
    max_diff_chars = 12000
    if len(diff_text) > max_diff_chars:
        diff_text = diff_text[:max_diff_chars] + "\n\n[diff truncated]"

    return f"""PR Title: {pr_title}

Diff:
{diff_text}"""


def generate_review(pr_title: str, diff_text: str) -> str:
    """Non-streaming — returns full response string. Used in tests."""
    client = get_client()
    response = client.chat.completions.create(
        model=current_app.config["OPENAI_MODEL"],
        messages=[
            {"role": "system", "content": build_system_prompt()},
            {"role": "user", "content": build_user_prompt(
                pr_title, diff_text)},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content or ""


def generate_review_stream(pr_title: str, diff_text: str) -> Generator[str, None, None]:
    """Streaming — yields string tokens. Pure function: no DB, no Flask side effects."""
    client = get_client()
    stream = client.chat.completions.create(
        model=current_app.config["OPENAI_MODEL"],
        messages=[
            {"role": "system", "content": build_system_prompt()},
            {"role": "user", "content": build_user_prompt(
                pr_title, diff_text)},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
        stream=True,
    )
    for chunk in stream:
        token = chunk.choices[0].delta.content
        if token:
            yield token


def validate_ai_output(raw_json: str) -> AIReviewOutput:
    """Parse and validate AI output against AIReviewOutput schema.
    Raises AIValidationError if output is malformed — never writes bad data to DB.
    """
    try:
        data = json.loads(raw_json)
        return AIReviewOutput(**data)
    except (json.JSONDecodeError, Exception) as e:
        logger.error(
            "AI output validation failed: %s | raw: %.200s", str(e), raw_json)
        raise AIValidationError()
