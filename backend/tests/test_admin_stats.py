"""Tests for GET /admin/stats."""


def _register_and_login(client, email, name="User"):
    client.post("/api/v1/auth/register", json={
        "email": email, "password": "password123", "name": name, "locale": "en",
    })
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    token = resp.json()["access_token"]
    return token


def test_stats_returns_all_expected_fields(admin_client):
    resp = admin_client.get("/api/v1/admin/stats")
    assert resp.status_code == 200
    data = resp.json()
    for field in [
        "preset", "total_users", "new_users_in_period", "supporter_count",
        "total_apiaries", "public_apiaries", "total_hives", "total_inspections",
        "active_users_30d", "signups_by_day",
    ]:
        assert field in data, f"missing field: {field}"


def test_stats_default_preset_is_30d(admin_client):
    resp = admin_client.get("/api/v1/admin/stats")
    assert resp.json()["preset"] == "30d"


def test_stats_preset_all(admin_client):
    resp = admin_client.get("/api/v1/admin/stats?preset=all")
    assert resp.status_code == 200
    assert resp.json()["preset"] == "all"


def test_stats_preset_365d(admin_client):
    resp = admin_client.get("/api/v1/admin/stats?preset=365d")
    assert resp.status_code == 200
    assert resp.json()["preset"] == "365d"


def test_stats_invalid_preset_returns_422(admin_client):
    resp = admin_client.get("/api/v1/admin/stats?preset=7d")
    assert resp.status_code == 422


def test_stats_total_users_counts_all(admin_client):
    _register_and_login(admin_client, "u1@example.com")
    _register_and_login(admin_client, "u2@example.com")
    resp = admin_client.get("/api/v1/admin/stats?preset=all")
    # admin + 2 new users
    assert resp.json()["total_users"] >= 3


def test_stats_new_users_in_period_matches_total_for_fresh_db(admin_client):
    # All users were just created so new_users_in_period should equal total_users for 30d
    _register_and_login(admin_client, "fresh@example.com")
    resp = admin_client.get("/api/v1/admin/stats?preset=30d")
    data = resp.json()
    assert data["new_users_in_period"] == data["total_users"]


def test_stats_supporter_count(admin_client):
    tok = _register_and_login(admin_client, "sup@example.com")
    uid = admin_client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {tok}"}).json()["id"]
    admin_client.put(f"/api/v1/admin/users/{uid}/supporter", json={"is_supporter": True})

    resp = admin_client.get("/api/v1/admin/stats?preset=all")
    assert resp.json()["supporter_count"] == 1


def test_stats_signups_by_day_has_entry_for_today(admin_client):
    resp = admin_client.get("/api/v1/admin/stats?preset=30d")
    days = resp.json()["signups_by_day"]
    assert len(days) >= 1
    # Each entry has date (YYYY-MM-DD) and count
    assert all("date" in d and "count" in d for d in days)
    assert all(d["count"] > 0 for d in days)


def test_stats_signups_by_day_ordered_chronologically(admin_client):
    _register_and_login(admin_client, "order@example.com")
    resp = admin_client.get("/api/v1/admin/stats?preset=all")
    days = [d["date"] for d in resp.json()["signups_by_day"]]
    assert days == sorted(days)


def test_stats_public_apiaries_counted_separately(admin_client):
    tok = _register_and_login(admin_client, "ap@example.com")
    headers = {"Authorization": f"Bearer {tok}"}
    admin_client.post("/api/v1/apiaries", json={"name": "Public Apiary", "is_public": True}, headers=headers)
    admin_client.post("/api/v1/apiaries", json={"name": "Private Apiary", "is_public": False}, headers=headers)

    resp = admin_client.get("/api/v1/admin/stats?preset=all")
    data = resp.json()
    assert data["total_apiaries"] >= 2
    assert data["public_apiaries"] >= 1
    assert data["public_apiaries"] < data["total_apiaries"]


def test_stats_requires_admin(auth_client):
    resp = auth_client.get("/api/v1/admin/stats")
    assert resp.status_code == 403
