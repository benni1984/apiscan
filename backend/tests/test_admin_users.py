"""Tests for admin user management endpoints."""
import pytest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _register(client, email="user@example.com", name="User"):
    client.post("/api/v1/auth/register", json={
        "email": email, "password": "password123", "name": name, "locale": "en",
    })
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    return resp.json()["access_token"]


def _user_id(client, token):
    resp = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    return resp.json()["id"]


# ---------------------------------------------------------------------------
# GET /admin/users
# ---------------------------------------------------------------------------

def test_list_users_returns_all_users(admin_client):
    _register(admin_client, "alice@example.com", "Alice")
    _register(admin_client, "bob@example.com", "Bob")
    resp = admin_client.get("/api/v1/admin/users")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 3  # admin + alice + bob
    emails = [u["email"] for u in data["items"]]
    assert "alice@example.com" in emails
    assert "bob@example.com" in emails


def test_list_users_ordered_newest_first(admin_client):
    _register(admin_client, "first@example.com", "First")
    _register(admin_client, "second@example.com", "Second")
    resp = admin_client.get("/api/v1/admin/users")
    items = resp.json()["items"]
    # Newest created_at should be first
    assert items[0]["created_at"] >= items[-1]["created_at"]


def test_list_users_search_by_email(admin_client):
    _register(admin_client, "findme@example.com", "FindMe")
    _register(admin_client, "other@example.com", "Other")
    resp = admin_client.get("/api/v1/admin/users?q=findme")
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["email"] == "findme@example.com"


def test_list_users_filter_by_supporter(admin_client):
    tok = _register(admin_client, "supporter@example.com", "Sup")
    uid = _user_id(admin_client, tok)
    admin_client.put(f"/api/v1/admin/users/{uid}/supporter", json={"is_supporter": True})

    resp = admin_client.get("/api/v1/admin/users?supporter=true")
    assert resp.status_code == 200
    emails = [u["email"] for u in resp.json()["items"]]
    assert "supporter@example.com" in emails
    assert "admin@example.com" not in emails  # admin is not a supporter


def test_list_users_pagination(admin_client):
    for i in range(5):
        _register(admin_client, f"pg{i}@example.com", f"User{i}")
    resp = admin_client.get("/api/v1/admin/users?per_page=2&page=1")
    data = resp.json()
    assert len(data["items"]) == 2
    assert data["per_page"] == 2
    assert data["pages"] >= 3


def test_list_users_requires_admin(auth_client):
    resp = auth_client.get("/api/v1/admin/users")
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# GET /admin/users/{id}
# ---------------------------------------------------------------------------

def test_get_user_detail_returns_profile_and_counts(admin_client):
    tok = _register(admin_client, "detail@example.com", "Detail")
    uid = _user_id(admin_client, tok)
    resp = admin_client.get(f"/api/v1/admin/users/{uid}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "detail@example.com"
    assert data["apiary_count"] == 0
    assert data["hive_count"] == 0
    assert data["inspection_count"] == 0


def test_get_user_detail_not_found(admin_client):
    resp = admin_client.get("/api/v1/admin/users/nonexistent-id")
    assert resp.status_code == 404
    assert resp.json()["detail"]["code"] == "USER_NOT_FOUND"


def test_get_user_detail_requires_admin(auth_client):
    resp = auth_client.get("/api/v1/admin/users/some-id")
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# PUT /admin/users/{id}/supporter
# ---------------------------------------------------------------------------

def test_set_supporter_true(admin_client):
    tok = _register(admin_client, "sup@example.com", "Sup")
    uid = _user_id(admin_client, tok)
    resp = admin_client.put(f"/api/v1/admin/users/{uid}/supporter", json={"is_supporter": True})
    assert resp.status_code == 200
    assert resp.json()["is_supporter"] is True


def test_set_supporter_false(admin_client):
    tok = _register(admin_client, "nosup@example.com", "NoSup")
    uid = _user_id(admin_client, tok)
    admin_client.put(f"/api/v1/admin/users/{uid}/supporter", json={"is_supporter": True})
    resp = admin_client.put(f"/api/v1/admin/users/{uid}/supporter", json={"is_supporter": False})
    assert resp.status_code == 200
    assert resp.json()["is_supporter"] is False


def test_set_supporter_not_found(admin_client):
    resp = admin_client.put("/api/v1/admin/users/nonexistent/supporter", json={"is_supporter": True})
    assert resp.status_code == 404


def test_set_supporter_requires_admin(auth_client):
    resp = auth_client.put("/api/v1/admin/users/some-id/supporter", json={"is_supporter": True})
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# DELETE /admin/users/{id}
# ---------------------------------------------------------------------------

def test_delete_user_removes_user(admin_client):
    tok = _register(admin_client, "gone@example.com", "Gone")
    uid = _user_id(admin_client, tok)
    resp = admin_client.delete(f"/api/v1/admin/users/{uid}")
    assert resp.status_code == 204
    assert admin_client.get(f"/api/v1/admin/users/{uid}").status_code == 404


def test_delete_user_not_found(admin_client):
    resp = admin_client.delete("/api/v1/admin/users/nonexistent-id")
    assert resp.status_code == 404


def test_delete_user_cannot_delete_self(admin_client):
    admin_resp = admin_client.get("/api/v1/users/me")
    admin_id = admin_resp.json()["id"]
    resp = admin_client.delete(f"/api/v1/admin/users/{admin_id}")
    assert resp.status_code == 400
    assert resp.json()["detail"]["code"] == "CANNOT_DELETE_SELF"


def test_delete_user_requires_admin(auth_client):
    resp = auth_client.delete("/api/v1/admin/users/some-id")
    assert resp.status_code == 403
