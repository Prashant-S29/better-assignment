from app.models.user import User
from app import db


def _signup(client, email="test@example.com", password="password123"):
    return client.post("/api/auth/signup", json={"email": email, "password": password})


class TestSignup:
    def test_signup_creates_unverified_user(self, client, app, mock_email_service):
        res = _signup(client)
        assert res.status_code == 201
        with app.app_context():
            user = User.query.filter_by(email="test@example.com").first()
            assert user is not None
            assert user.is_verified is False

    def test_signup_sends_otp_email(self, client, mock_email_service):
        _signup(client)
        assert mock_email_service.called

    def test_duplicate_email_returns_409(self, client, mock_email_service):
        _signup(client)
        res = _signup(client)
        assert res.status_code == 409
        assert res.get_json()["error"]["code"] == "USER_EXISTS"

    def test_invalid_email_returns_422(self, client):
        res = client.post(
            "/api/auth/signup", json={"email": "notanemail", "password": "password123"})
        assert res.status_code == 422

    def test_short_password_returns_422(self, client):
        res = client.post(
            "/api/auth/signup", json={"email": "test@example.com", "password": "short"})
        assert res.status_code == 422


class TestLogin:
    def test_cannot_login_before_verification(self, client, mock_email_service):
        _signup(client)
        res = client.post(
            "/api/auth/login", json={"email": "test@example.com", "password": "password123"})
        assert res.status_code == 403
        assert res.get_json()["error"]["code"] == "ACCOUNT_NOT_VERIFIED"

    def test_invalid_credentials_returns_401(self, client):
        res = client.post(
            "/api/auth/login", json={"email": "nobody@example.com", "password": "password123"})
        assert res.status_code == 401

    def test_login_returns_tokens(self, client, app, mock_email_service):
        _signup(client)
        with app.app_context():
            user = User.query.filter_by(email="test@example.com").first()
            user.is_verified = True
            db.session.commit()

        res = client.post(
            "/api/auth/login", json={"email": "test@example.com", "password": "password123"})
        assert res.status_code == 200
        data = res.get_json()["data"]
        assert "access_token" in data
        assert "refresh_token" in data


class TestOTPVerify:
    def test_wrong_otp_returns_422(self, client, mock_email_service):
        _signup(client)
        res = client.post("/api/auth/verify-otp", json={
            "email": "test@example.com", "code": "000000", "purpose": "signup"
        })
        assert res.status_code == 422
        assert res.get_json()["error"]["code"] == "OTP_INVALID"

    def test_invalid_otp_format_returns_422(self, client):
        res = client.post("/api/auth/verify-otp", json={
            "email": "test@example.com", "code": "abc", "purpose": "signup"
        })
        assert res.status_code == 422


class TestHealthAfterAuth:
    def test_health_still_returns_ok(self, client):
        """M2 stability gate — health endpoint unaffected by auth changes."""
        res = client.get("/api/health")
        assert res.status_code in (200, 207)
        assert res.get_json()["success"] is True
