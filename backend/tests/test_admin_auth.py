"""Tests for admin dependency and /admin/ping endpoint."""


def test_ping_as_admin(admin_client):
    resp = admin_client.get("/api/v1/admin/ping")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["email"] == "admin@example.com"


def test_ping_as_regular_user_returns_403(auth_client):
    resp = auth_client.get("/api/v1/admin/ping")
    assert resp.status_code == 403
    assert resp.json()["detail"]["code"] == "FORBIDDEN"


def test_ping_unauthenticated_returns_422(client):
    resp = client.get("/api/v1/admin/ping")
    assert resp.status_code == 422


def test_user_out_includes_admin_fields(auth_client):
    resp = auth_client.get("/api/v1/users/me")
    assert resp.status_code == 200
    data = resp.json()
    assert "is_admin" in data
    assert "is_supporter" in data
    assert data["is_admin"] is False
    assert data["is_supporter"] is False


def test_admin_user_out_shows_is_admin_true(admin_client):
    resp = admin_client.get("/api/v1/users/me")
    assert resp.status_code == 200
    assert resp.json()["is_admin"] is True
