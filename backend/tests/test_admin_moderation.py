"""Tests for admin map moderation endpoints."""


def _register_and_login(client, email, name="User"):
    client.post("/api/v1/auth/register", json={
        "email": email, "password": "password123", "name": name, "locale": "en",
    })
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    return resp.json()["access_token"]


def _create_apiary(client, token, name="Test Apiary", is_public=True, lat=None, lon=None):
    resp = client.post("/api/v1/apiaries", json={
        "name": name, "is_public": is_public,
        "latitude": lat, "longitude": lon,
    }, headers={"Authorization": f"Bearer {token}"})
    return resp.json()["id"]


# ---------------------------------------------------------------------------
# GET /admin/apiaries
# ---------------------------------------------------------------------------

def test_list_public_apiaries_only_returns_public(admin_client):
    tok = _register_and_login(admin_client, "owner@example.com")
    _create_apiary(admin_client, tok, "Public One", is_public=True)
    _create_apiary(admin_client, tok, "Private One", is_public=False)

    resp = admin_client.get("/api/v1/admin/apiaries")
    assert resp.status_code == 200
    names = [a["name"] for a in resp.json()["items"]]
    assert "Public One" in names
    assert "Private One" not in names


def test_list_public_apiaries_includes_owner_email(admin_client):
    tok = _register_and_login(admin_client, "apiowner@example.com")
    _create_apiary(admin_client, tok, "My Apiary", is_public=True)

    resp = admin_client.get("/api/v1/admin/apiaries")
    items = resp.json()["items"]
    emails = [a["owner_email"] for a in items]
    assert "apiowner@example.com" in emails


def test_list_public_apiaries_includes_hive_count(admin_client):
    resp = admin_client.get("/api/v1/admin/apiaries")
    assert resp.status_code == 200
    for item in resp.json()["items"]:
        assert "hive_count" in item
        assert item["hive_count"] >= 0


def test_list_public_apiaries_pagination(admin_client):
    tok = _register_and_login(admin_client, "pagown@example.com")
    for i in range(5):
        _create_apiary(admin_client, tok, f"Apiary {i}", is_public=True)

    resp = admin_client.get("/api/v1/admin/apiaries?per_page=2&page=1")
    data = resp.json()
    assert len(data["items"]) == 2
    assert data["total"] >= 5
    assert data["pages"] >= 3


def test_list_public_apiaries_requires_admin(auth_client):
    resp = auth_client.get("/api/v1/admin/apiaries")
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# GET /admin/apiaries/flagged
# ---------------------------------------------------------------------------

def test_flagged_apiaries_empty_when_none_flagged(admin_client):
    tok = _register_and_login(admin_client, "clean@example.com")
    _create_apiary(admin_client, tok, "Normal", is_public=True, lat=48.0, lon=11.0)

    resp = admin_client.get("/api/v1/admin/apiaries/flagged")
    assert resp.status_code == 200
    # Normal apiary should not be in flagged list
    names = [a["name"] for a in resp.json()]
    assert "Normal" not in names


def test_flagged_apiaries_detects_invalid_latitude(admin_client):
    tok = _register_and_login(admin_client, "badlat@example.com")
    _create_apiary(admin_client, tok, "Bad Lat Apiary", is_public=True, lat=200.0, lon=11.0)

    resp = admin_client.get("/api/v1/admin/apiaries/flagged")
    assert resp.status_code == 200
    names = [a["name"] for a in resp.json()]
    assert "Bad Lat Apiary" in names


def test_flagged_apiaries_detects_invalid_longitude(admin_client):
    tok = _register_and_login(admin_client, "badlon@example.com")
    _create_apiary(admin_client, tok, "Bad Lon Apiary", is_public=True, lat=48.0, lon=200.0)

    resp = admin_client.get("/api/v1/admin/apiaries/flagged")
    assert resp.status_code == 200
    names = [a["name"] for a in resp.json()]
    assert "Bad Lon Apiary" in names


def test_flagged_apiaries_only_includes_public(admin_client):
    tok = _register_and_login(admin_client, "privbad@example.com")
    _create_apiary(admin_client, tok, "Private Bad Coords", is_public=False, lat=200.0, lon=11.0)

    resp = admin_client.get("/api/v1/admin/apiaries/flagged")
    names = [a["name"] for a in resp.json()]
    assert "Private Bad Coords" not in names


def test_flagged_apiaries_requires_admin(auth_client):
    resp = auth_client.get("/api/v1/admin/apiaries/flagged")
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# PUT /admin/apiaries/{id}/set-private
# ---------------------------------------------------------------------------

def test_set_apiary_private_clears_public_flag(admin_client):
    tok = _register_and_login(admin_client, "mod@example.com")
    apiary_id = _create_apiary(admin_client, tok, "Will Be Private", is_public=True)

    resp = admin_client.put(f"/api/v1/admin/apiaries/{apiary_id}/set-private")
    assert resp.status_code == 200
    assert resp.json()["is_public"] is False


def test_set_apiary_private_removes_from_public_list(admin_client):
    tok = _register_and_login(admin_client, "mod2@example.com")
    apiary_id = _create_apiary(admin_client, tok, "Removed From Map", is_public=True)

    admin_client.put(f"/api/v1/admin/apiaries/{apiary_id}/set-private")
    resp = admin_client.get("/api/v1/admin/apiaries")
    ids = [a["id"] for a in resp.json()["items"]]
    assert apiary_id not in ids


def test_set_apiary_private_not_found(admin_client):
    resp = admin_client.put("/api/v1/admin/apiaries/nonexistent/set-private")
    assert resp.status_code == 404
    assert resp.json()["detail"]["code"] == "APIARY_NOT_FOUND"


def test_set_apiary_private_requires_admin(auth_client):
    resp = auth_client.put("/api/v1/admin/apiaries/any-id/set-private")
    assert resp.status_code == 403
