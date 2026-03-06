from flask import Flask, jsonify
from pydantic import ValidationError

# ── Typed application exceptions ─────────────────────────────────────────────


class AppError(Exception):
    """Base class for all application errors."""

    status_code: int = 500
    code: str = "INTERNAL_ERROR"
    message: str = "An unexpected error occurred."

    def __init__(self, message: str = None):
        self.message = message or self.__class__.message
        super().__init__(self.message)


class InvalidPRURLError(AppError):
    status_code = 422
    code = "INVALID_PR_URL"
    message = "Please enter a valid GitHub PR URL (https://github.com/{owner}/{repo}/pull/{number})."


class PrivateRepoError(AppError):
    status_code = 422
    code = "PRIVATE_REPO"
    message = "This PR is from a private or non-existent repository. Only public repos are supported."


class PRTooLargeError(AppError):
    status_code = 422
    code = "PR_TOO_LARGE"
    message = "This PR exceeds the 500 changed line limit. Please submit a smaller PR."


class GitHubRateLimitError(AppError):
    status_code = 429
    code = "GITHUB_RATE_LIMIT"
    message = "GitHub API rate limit reached. Please try again in a few minutes."


class GitHubAPIError(AppError):
    status_code = 502
    code = "GITHUB_API_ERROR"
    message = "Failed to fetch PR data from GitHub."


class AIValidationError(AppError):
    status_code = 500
    code = "AI_VALIDATION_ERROR"
    message = (
        "Review generation failed due to an unexpected AI response. Please try again."
    )


class AuthenticationError(AppError):
    status_code = 401
    code = "AUTHENTICATION_ERROR"
    message = "Invalid or expired token."


class TokenMissingError(AppError):
    status_code = 401
    code = "TOKEN_MISSING"
    message = "Authentication token is required."


class TokenExpiredError(AppError):
    status_code = 401
    code = "TOKEN_EXPIRED"
    message = "Your session has expired. Please log in again."


class TokenInvalidError(AppError):
    status_code = 401
    code = "TOKEN_INVALID"
    message = "Invalid authentication token."


class ForbiddenError(AppError):
    status_code = 403
    code = "FORBIDDEN"
    message = "You do not have permission to access this resource."


class NotFoundError(AppError):
    status_code = 404
    code = "NOT_FOUND"
    message = "The requested resource was not found."


class UserAlreadyExistsError(AppError):
    status_code = 409
    code = "USER_EXISTS"
    message = "An account with this email already exists."


class InvalidCredentialsError(AppError):
    status_code = 401
    code = "INVALID_CREDENTIALS"
    message = "Invalid email or password."


class AccountNotVerifiedError(AppError):
    status_code = 403
    code = "ACCOUNT_NOT_VERIFIED"
    message = "Please verify your email address before logging in."


class OTPInvalidError(AppError):
    status_code = 422
    code = "OTP_INVALID"
    message = "Invalid or expired verification code."


class EmailSendError(AppError):
    status_code = 502
    code = "EMAIL_SEND_ERROR"
    message = "Failed to send email. Please try again."


# ── Error handler registration ────────────────────────────────────────────────


def _error_response(code: str, message: str, status: int):
    return jsonify(
        {"success": False, "error": {"code": code, "message": message}}
    ), status


def register_error_handlers(app: Flask):

    @app.errorhandler(AppError)
    def handle_app_error(e: AppError):
        return _error_response(e.code, e.message, e.status_code)

    @app.errorhandler(ValidationError)
    def handle_validation_error(e: ValidationError):
        errors = [
            {"field": ".".join(str(loc) for loc in err["loc"]), "message": err["msg"]}
            for err in e.errors()
        ]
        return jsonify(
            {
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request validation failed.",
                    "details": errors,
                },
            }
        ), 422

    @app.errorhandler(404)
    def handle_404(e):
        return _error_response(
            "NOT_FOUND", "The requested resource was not found.", 404
        )

    @app.errorhandler(405)
    def handle_405(e):
        return _error_response("METHOD_NOT_ALLOWED", "Method not allowed.", 405)

    @app.errorhandler(Exception)
    def handle_generic(e: Exception):
        app.logger.exception("Unhandled exception: %s", str(e))
        return _error_response("INTERNAL_ERROR", "An unexpected error occurred.", 500)
