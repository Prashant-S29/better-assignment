from unittest.mock import MagicMock, patch
import pytest
from app.middleware.error_handler import AIValidationError


VALID_AI_RESPONSE = """{
    "summary": "Adds a login endpoint with JWT auth.",
    "architecture": {"observations": "Clean separation.", "score": 4},
    "quality": {"observations": "Well named.", "score": 4},
    "correctness": {"observations": "Logic is correct.", "score": 5},
    "security": {"observations": "Passwords hashed.", "score": 5},
    "error_handling": {"observations": "Missing some edge cases.", "score": 3},
    "overall_score": 4.2
}"""


class TestValidateAiOutput:
    def test_valid_output_parses_correctly(self, app):
        with app.app_context():
            from app.services.ai_service import validate_ai_output
            result = validate_ai_output(VALID_AI_RESPONSE)
            assert result.overall_score == 4.2
            assert result.security.score == 5

    def test_malformed_json_raises_ai_validation_error(self, app):
        with app.app_context():
            from app.services.ai_service import validate_ai_output
            with pytest.raises(AIValidationError):
                validate_ai_output("not valid json {{{")

    def test_missing_field_raises_ai_validation_error(self, app):
        with app.app_context():
            from app.services.ai_service import validate_ai_output
            with pytest.raises(AIValidationError):
                # missing all sections
                validate_ai_output('{"summary": "test"}')

    def test_score_out_of_range_raises_ai_validation_error(self, app):
        with app.app_context():
            from app.services.ai_service import validate_ai_output
            bad = VALID_AI_RESPONSE.replace('"score": 4', '"score": 9', 1)
            with pytest.raises(AIValidationError):
                validate_ai_output(bad)


class TestBuildPrompts:
    def test_system_prompt_contains_json_instruction(self, app):
        with app.app_context():
            from app.services.ai_service import build_system_prompt
            prompt = build_system_prompt()
            assert "JSON" in prompt
            assert "overall_score" in prompt

    def test_diff_truncated_when_too_long(self, app):
        with app.app_context():
            from app.services.ai_service import build_user_prompt
            long_diff = "x" * 20000
            result = build_user_prompt("Test PR", long_diff)
            assert "[diff truncated]" in result
            assert len(result) < 15000
