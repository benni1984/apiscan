import pytest
from unittest.mock import patch


@pytest.fixture
def seeded(auth_client):
    apiary1 = auth_client.post("/api/v1/apiaries", json={
        "name": "Riverside", "latitude": 48.85, "longitude": 2.35, "is_public": True
    }).json()
    apiary2 = auth_client.post("/api/v1/apiaries", json={
        "name": "No GPS", "is_public": True
    }).json()

    for apiary, n_hives in [(apiary1, 2), (apiary2, 1)]:
        for i in range(n_hives):
            token = auth_client.post("/api/v1/qr-batches", json={"count": 1}).json()["tokens"][0]["token"]
            hive = auth_client.post("/api/v1/hives/initialize", json={
                "qr_token": token, "apiary_id": apiary["id"],
                "name": f"Hive {i+1}", "hive_type": "langstroth"
            }).json()
            auth_client.post(f"/api/v1/hives/{hive['id']}/inspections", json={
                "date": "2026-04-01", "varroa_count": 3, "mood": "calm"
            })

    return apiary1, apiary2


def test_global_stats(client, seeded):
    r = client.get("/api/v1/public/stats")
    assert r.status_code == 200
    data = r.json()
    assert data["apiary_count"] == 2
    assert data["hive_count"] == 3
    assert data["inspection_count"] == 3


def test_global_stats_map_pins_only_gps_apiaries(client, seeded):
    data = client.get("/api/v1/public/stats").json()
    # Only apiary with GPS (geocoded to city centroid) appears in pins
    assert len(data["apiaries"]) == 1
    pin = data["apiaries"][0]
    assert pin["name"] == "Riverside"
    assert pin["hive_count"] == 2
    # Coordinates must be city centroid, not exact GPS
    assert pin["latitude"] == 48.1
    assert pin["longitude"] == 11.6
    assert pin["city_name"] == "TestCity"


def test_global_stats_no_auth_required(client):
    r = client.get("/api/v1/public/stats")
    assert r.status_code == 200


def test_public_apiary_detail(client, seeded):
    apiary1, _ = seeded
    r = client.get(f"/api/v1/public/apiaries/{apiary1['id']}")
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Riverside"
    assert data["hive_count"] == 2
    assert data["inspection_count"] == 2
    assert data["average_varroa"] == 3.0
    assert data["mood_distribution"]["calm"] == 2
    assert len(data["hives"]) == 2
    # Location privacy: city centroid, not exact GPS
    assert data["latitude"] == 48.1
    assert data["longitude"] == 11.6
    assert data["city_name"] == "TestCity"
    assert "address" not in data


def test_public_apiary_detail_no_auth(client, seeded):
    apiary1, _ = seeded
    r = client.get(f"/api/v1/public/apiaries/{apiary1['id']}")
    assert r.status_code == 200


def test_public_apiary_not_found(client):
    r = client.get("/api/v1/public/apiaries/does-not-exist")
    assert r.status_code == 404


def test_private_apiary_returns_404(client, auth_client):
    private = auth_client.post("/api/v1/apiaries", json={
        "name": "Secret apiary", "latitude": 50.0, "longitude": 10.0
        # is_public defaults to False
    }).json()
    r = client.get(f"/api/v1/public/apiaries/{private['id']}")
    assert r.status_code == 404


def test_private_apiary_excluded_from_stats(client, auth_client):
    auth_client.post("/api/v1/apiaries", json={"name": "Private", "latitude": 50.0, "longitude": 10.0})
    data = client.get("/api/v1/public/stats").json()
    assert data["apiary_count"] == 0
    assert len(data["apiaries"]) == 0


def test_public_apiary_no_inspections(client, seeded):
    _, apiary2 = seeded
    r = client.get(f"/api/v1/public/apiaries/{apiary2['id']}")
    assert r.status_code == 200
    data = r.json()
    assert data["average_varroa"] == 3.0
    assert data["last_inspection_date"] is not None


def test_public_hides_user_data(client, seeded):
    apiary1, _ = seeded
    data = client.get(f"/api/v1/public/apiaries/{apiary1['id']}").json()
    assert "user_id" not in data
    assert "email" not in data
    for hive in data["hives"]:
        assert "qr_token" not in hive
        assert "user_id" not in hive


def test_global_stats_empty_db(client):
    r = client.get("/api/v1/public/stats")
    assert r.status_code == 200
    data = r.json()
    assert data["apiary_count"] == 0
    assert data["hive_count"] == 0
    assert data["inspection_count"] == 0
    assert data["apiaries"] == []


def test_location_privacy_exact_coords_not_exposed(client, seeded):
    apiary1, _ = seeded
    data = client.get(f"/api/v1/public/apiaries/{apiary1['id']}").json()
    # Exact coords (48.85, 2.35) must not appear — only city centroid
    assert data["latitude"] != 48.85
    assert data["longitude"] != 2.35


def test_location_privacy_geocoder_fallback(auth_client, client):
    with patch("app.routers.apiaries.reverse_geocode_city", return_value=None):
        auth_client.post("/api/v1/apiaries", json={
            "name": "Fallback Apiary", "latitude": 48.85, "longitude": 2.35, "is_public": True
        })
    data = client.get("/api/v1/public/stats").json()
    assert len(data["apiaries"]) == 1
    pin = data["apiaries"][0]
    # Fallback: round to 1 decimal (~11 km precision)
    assert pin["latitude"] == round(48.85, 1)
    assert pin["longitude"] == round(2.35, 1)
    assert pin["city_name"] is None


def test_private_apiary_city_coords_not_public(auth_client, client):
    auth_client.post("/api/v1/apiaries", json={
        "name": "Private", "latitude": 48.85, "longitude": 2.35
        # is_public defaults to False
    })
    data = client.get("/api/v1/public/stats").json()
    assert data["apiary_count"] == 0
    assert data["apiaries"] == []


# ── Heatmap ───────────────────────────────────────────────────────────────────

def test_heatmap_empty_returns_geojson(client):
    r = client.get("/api/v1/public/heatmap")
    assert r.status_code == 200
    data = r.json()
    assert data["type"] == "FeatureCollection"
    assert data["features"] == []


def test_heatmap_no_auth_required(client):
    assert client.get("/api/v1/public/heatmap").status_code == 200


def test_heatmap_aggregates_varroa_by_grid_cell(client, seeded):
    data = client.get("/api/v1/public/heatmap").json()
    assert len(data["features"]) >= 1
    feature = data["features"][0]
    assert feature["type"] == "Feature"
    assert feature["geometry"]["type"] == "Polygon"
    props = feature["properties"]
    assert props["avg_varroa"] == 3.0
    assert props["apiary_count"] >= 1
    assert props["inspection_count"] >= 1


def test_heatmap_polygon_has_five_coordinates(client, seeded):
    data = client.get("/api/v1/public/heatmap").json()
    coords = data["features"][0]["geometry"]["coordinates"][0]
    assert len(coords) == 5
    assert coords[0] == coords[4]  # closed ring


def test_heatmap_excludes_private_apiaries(client, auth_client):
    token = auth_client.post("/api/v1/qr-batches", json={"count": 1}).json()["tokens"][0]["token"]
    private = auth_client.post("/api/v1/apiaries", json={
        "name": "Secret", "latitude": 51.5, "longitude": -0.1
    }).json()
    hive = auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": token, "apiary_id": private["id"], "name": "H", "hive_type": "langstroth"
    }).json()
    auth_client.post(f"/api/v1/hives/{hive['id']}/inspections", json={"date": "2026-04-01", "varroa_count": 99})
    data = client.get("/api/v1/public/heatmap").json()
    all_varroa = [f["properties"]["avg_varroa"] for f in data["features"]]
    assert 99.0 not in all_varroa


def test_heatmap_excludes_inspections_without_varroa(client, auth_client):
    token = auth_client.post("/api/v1/qr-batches", json={"count": 1}).json()["tokens"][0]["token"]
    apiary = auth_client.post("/api/v1/apiaries", json={
        "name": "No Varroa", "latitude": 52.0, "longitude": 13.0, "is_public": True
    }).json()
    hive = auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": token, "apiary_id": apiary["id"], "name": "H", "hive_type": "langstroth"
    }).json()
    auth_client.post(f"/api/v1/hives/{hive['id']}/inspections", json={"date": "2026-04-01", "mood": "calm"})
    data = client.get("/api/v1/public/heatmap").json()
    assert data["features"] == []
