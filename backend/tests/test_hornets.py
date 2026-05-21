"""Tests for the Hornet Tracker endpoints (all public, no auth required)."""


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------


def test_stats_empty_db(client):
    r = client.get("/api/v1/hornets/stats")
    assert r.status_code == 200
    data = r.json()
    assert data["total_caught"] == 0
    assert data["total_nests"] == 0
    assert data["destroyed_nests"] == 0
    assert data["pending_sightings"] == 0
    assert data["confirmed_sightings"] == 0


def test_stats_no_auth_required(client):
    assert client.get("/api/v1/hornets/stats").status_code == 200


def test_stats_aggregates_catches(client):
    client.post("/api/v1/hornets/catches", json={"count": 5})
    client.post("/api/v1/hornets/catches", json={"count": 3})
    data = client.get("/api/v1/hornets/stats").json()
    assert data["total_caught"] == 8


def test_stats_counts_nests_and_destroyed(client):
    client.post("/api/v1/hornets/nests", json={"latitude": 48.0, "longitude": 2.0})
    client.post("/api/v1/hornets/nests", json={"latitude": 49.0, "longitude": 3.0})
    # Manually confirm a nest as destroyed via DB
    from app.models import HornetNest
    from tests.conftest import TestingSession
    db = TestingSession()
    try:
        nest = db.query(HornetNest).first()
        nest.status = "destroyed"
        db.commit()
    finally:
        db.close()
    data = client.get("/api/v1/hornets/stats").json()
    assert data["total_nests"] == 2
    assert data["destroyed_nests"] == 1


def test_stats_counts_sightings(client):
    client.post("/api/v1/hornets/sightings", json={"photo_url": "https://blob.example.com/1.jpg"})
    data = client.get("/api/v1/hornets/stats").json()
    assert data["pending_sightings"] == 1
    assert data["confirmed_sightings"] == 0


# ---------------------------------------------------------------------------
# Catches
# ---------------------------------------------------------------------------


def test_report_catch_minimal(client):
    r = client.post("/api/v1/hornets/catches", json={"count": 1})
    assert r.status_code == 201
    data = r.json()
    assert data["count"] == 1
    assert data["latitude"] is None
    assert data["longitude"] is None
    assert "id" in data
    assert "created_at" in data


def test_report_catch_with_location(client):
    r = client.post("/api/v1/hornets/catches", json={
        "count": 3,
        "latitude": 48.8566,
        "longitude": 2.3522,
        "reporter_name": "Alice",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["count"] == 3
    assert data["latitude"] == 48.8566
    assert data["longitude"] == 2.3522


def test_report_catch_default_count(client):
    r = client.post("/api/v1/hornets/catches", json={})
    assert r.status_code == 201
    assert r.json()["count"] == 1


def test_report_catch_count_validation_too_low(client):
    r = client.post("/api/v1/hornets/catches", json={"count": 0})
    assert r.status_code == 422


def test_report_catch_count_validation_too_high(client):
    r = client.post("/api/v1/hornets/catches", json={"count": 1001})
    assert r.status_code == 422


def test_report_catch_no_auth_required(client):
    r = client.post("/api/v1/hornets/catches", json={"count": 2})
    assert r.status_code == 201


# ---------------------------------------------------------------------------
# Nests
# ---------------------------------------------------------------------------


def test_report_nest_success(client):
    r = client.post("/api/v1/hornets/nests", json={
        "latitude": 48.8566,
        "longitude": 2.3522,
        "reporter_name": "Bob",
        "notes": "Under the roof",
        "photo_url": "https://blob.example.com/nest.jpg",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["latitude"] == 48.8566
    assert data["longitude"] == 2.3522
    assert data["status"] == "found"
    assert data["reporter_name"] == "Bob"
    assert data["notes"] == "Under the roof"
    assert data["photo_url"] == "https://blob.example.com/nest.jpg"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_report_nest_missing_latitude(client):
    r = client.post("/api/v1/hornets/nests", json={"longitude": 2.35})
    assert r.status_code == 422


def test_report_nest_missing_longitude(client):
    r = client.post("/api/v1/hornets/nests", json={"latitude": 48.85})
    assert r.status_code == 422


def test_report_nest_lat_out_of_range(client):
    r = client.post("/api/v1/hornets/nests", json={"latitude": 100.0, "longitude": 2.0})
    assert r.status_code == 422


def test_report_nest_lon_out_of_range(client):
    r = client.post("/api/v1/hornets/nests", json={"latitude": 48.0, "longitude": 200.0})
    assert r.status_code == 422


def test_report_nest_no_auth_required(client):
    r = client.post("/api/v1/hornets/nests", json={"latitude": 48.0, "longitude": 2.0})
    assert r.status_code == 201


def test_get_nests_geojson_empty(client):
    r = client.get("/api/v1/hornets/nests")
    assert r.status_code == 200
    data = r.json()
    assert data["type"] == "FeatureCollection"
    assert data["features"] == []


def test_get_nests_geojson_structure(client):
    client.post("/api/v1/hornets/nests", json={"latitude": 48.8566, "longitude": 2.3522})
    r = client.get("/api/v1/hornets/nests")
    assert r.status_code == 200
    data = r.json()
    assert len(data["features"]) == 1
    feature = data["features"][0]
    assert feature["type"] == "Feature"
    assert feature["geometry"]["type"] == "Point"
    # GeoJSON order: [longitude, latitude]
    assert feature["geometry"]["coordinates"] == [2.3522, 48.8566]
    props = feature["properties"]
    assert props["status"] == "found"
    assert "id" in props
    assert "created_at" in props


def test_get_nests_no_auth_required(client):
    assert client.get("/api/v1/hornets/nests").status_code == 200


# ---------------------------------------------------------------------------
# Sightings
# ---------------------------------------------------------------------------


def test_submit_sighting_success(client):
    r = client.post("/api/v1/hornets/sightings", json={
        "photo_url": "https://blob.example.com/s1.jpg",
        "description": "Spotted near flowers",
        "reporter_name": "Carol",
        "latitude": 48.0,
        "longitude": 2.0,
    })
    assert r.status_code == 201
    data = r.json()
    assert data["photo_url"] == "https://blob.example.com/s1.jpg"
    assert data["status"] == "pending"
    assert data["yes_votes"] == 0
    assert data["no_votes"] == 0
    assert data["description"] == "Spotted near flowers"
    assert "id" in data
    assert "created_at" in data


def test_submit_sighting_missing_photo_url(client):
    r = client.post("/api/v1/hornets/sightings", json={"description": "No photo"})
    assert r.status_code == 422


def test_submit_sighting_no_auth_required(client):
    r = client.post("/api/v1/hornets/sightings", json={"photo_url": "https://blob.example.com/x.jpg"})
    assert r.status_code == 201


def test_list_sightings_empty(client):
    r = client.get("/api/v1/hornets/sightings")
    assert r.status_code == 200
    data = r.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["page"] == 1


def test_list_sightings_pagination(client):
    for i in range(5):
        client.post("/api/v1/hornets/sightings", json={"photo_url": f"https://blob.example.com/{i}.jpg"})
    r = client.get("/api/v1/hornets/sightings?page=1&per_page=3")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 5
    assert data["pages"] == 2
    assert len(data["items"]) == 3


def test_list_sightings_no_auth_required(client):
    assert client.get("/api/v1/hornets/sightings").status_code == 200


# ---------------------------------------------------------------------------
# Voting
# ---------------------------------------------------------------------------


def _create_sighting(client, photo_url="https://blob.example.com/v.jpg"):
    return client.post("/api/v1/hornets/sightings", json={"photo_url": photo_url}).json()["id"]


def test_vote_yes(client):
    sid = _create_sighting(client)
    r = client.post(f"/api/v1/hornets/sightings/{sid}/vote", json={"vote": "yes"})
    assert r.status_code == 204
    items = client.get("/api/v1/hornets/sightings").json()["items"]
    assert items[0]["yes_votes"] == 1
    assert items[0]["no_votes"] == 0


def test_vote_no(client):
    sid = _create_sighting(client)
    client.post(f"/api/v1/hornets/sightings/{sid}/vote", json={"vote": "no"})
    items = client.get("/api/v1/hornets/sightings").json()["items"]
    assert items[0]["no_votes"] == 1


def test_vote_invalid_value(client):
    sid = _create_sighting(client)
    r = client.post(f"/api/v1/hornets/sightings/{sid}/vote", json={"vote": "maybe"})
    assert r.status_code == 422


def test_vote_not_found(client):
    r = client.post("/api/v1/hornets/sightings/does-not-exist/vote", json={"vote": "yes"})
    assert r.status_code == 404


def test_vote_auto_confirm(client):
    """yes > 2× no AND total ≥ 5 triggers automatic confirmation."""
    sid = _create_sighting(client)
    # 2 no votes first
    for _ in range(2):
        client.post(f"/api/v1/hornets/sightings/{sid}/vote", json={"vote": "no"})
    # 3 yes votes — total=5, yes(3) < no*2(4), not yet confirmed
    for _ in range(3):
        client.post(f"/api/v1/hornets/sightings/{sid}/vote", json={"vote": "yes"})
    items = client.get("/api/v1/hornets/sightings").json()["items"]
    assert items[0]["status"] == "pending"

    # 2 more yes votes → total=7, yes(5) > no*2(4), confirmed
    for _ in range(2):
        client.post(f"/api/v1/hornets/sightings/{sid}/vote", json={"vote": "yes"})
    items = client.get("/api/v1/hornets/sightings").json()["items"]
    assert items[0]["status"] == "confirmed"


def test_vote_no_auth_required(client):
    sid = _create_sighting(client)
    r = client.post(f"/api/v1/hornets/sightings/{sid}/vote", json={"vote": "yes"})
    assert r.status_code == 204


# ---------------------------------------------------------------------------
# Admin override
# ---------------------------------------------------------------------------


def test_admin_set_status_confirmed(admin_client):
    sid = _create_sighting(admin_client)
    r = admin_client.put(f"/api/v1/admin/hornets/sightings/{sid}/status", json={"status": "confirmed"})
    assert r.status_code == 204
    items = admin_client.get("/api/v1/hornets/sightings").json()["items"]
    assert items[0]["status"] == "confirmed"


def test_admin_set_status_rejected(admin_client):
    sid = _create_sighting(admin_client)
    r = admin_client.put(f"/api/v1/admin/hornets/sightings/{sid}/status", json={"status": "rejected"})
    assert r.status_code == 204
    items = admin_client.get("/api/v1/hornets/sightings").json()["items"]
    assert items[0]["status"] == "rejected"


def test_admin_set_status_invalid(admin_client):
    sid = _create_sighting(admin_client)
    r = admin_client.put(f"/api/v1/admin/hornets/sightings/{sid}/status", json={"status": "pending"})
    assert r.status_code == 422


def test_admin_set_status_not_found(admin_client):
    r = admin_client.put("/api/v1/admin/hornets/sightings/does-not-exist/status", json={"status": "confirmed"})
    assert r.status_code == 404


def test_admin_set_status_requires_admin(client):
    """Unauthenticated request: missing Authorization header → 422 (required header).
    This matches the existing backend behaviour for all protected endpoints."""
    sid = _create_sighting(client)
    r = client.put(f"/api/v1/admin/hornets/sightings/{sid}/status", json={"status": "confirmed"})
    # Missing Authorization header → FastAPI header-validation error (422)
    assert r.status_code == 422
