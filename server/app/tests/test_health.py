def test_health_returns_200(client):
    """M0 smoke test — server is alive."""
    res = client.get("/api/health")
    assert res.status_code in (200, 207)
    data = res.get_json()
    assert data["success"] is True
    assert "status" in data["data"]


def test_health_response_shape(client):
    """Health response always includes all expected keys."""
    res = client.get("/api/health")
    data = res.get_json()["data"]
    assert "status" in data
    assert "db" in data
    assert "ai" in data
    assert "email" in data


def test_404_returns_correct_shape(client):
    """Global 404 handler returns standard error shape."""
    res = client.get("/api/nonexistent")
    assert res.status_code == 404
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "NOT_FOUND"
