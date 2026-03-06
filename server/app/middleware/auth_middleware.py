import logging
from functools import wraps
from typing import Callable

import jwt
from flask import request, g, current_app

from app.middleware.error_handler import TokenMissingError, TokenExpiredError, TokenInvalidError

logger = logging.getLogger(__name__)


def require_auth(f: Callable) -> Callable:
    """Decorator — decodes JWT, attaches user_id to flask.g. Routes never handle auth errors."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            raise TokenMissingError()

        token = auth_header[7:]

        try:
            payload = jwt.decode(
                token,
                current_app.config["JWT_SECRET"],
                algorithms=["HS256"]
            )
        except jwt.ExpiredSignatureError:
            raise TokenExpiredError()
        except jwt.InvalidTokenError:
            raise TokenInvalidError()

        if payload.get("type") != "access":
            raise TokenInvalidError()

        g.user_id = payload["sub"]
        return f(*args, **kwargs)

    return decorated
