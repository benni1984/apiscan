import pytest


@pytest.fixture
def hive_with_inspections(auth_client):
    apiary = auth_client.post("/api/v1/apiaries", json={"name": "Garden"}).json()
    batch = auth_client.post("/api/v1/qr-batches", json={"count": 1}).json()
    token = batch["tokens"][0]["token"]
    hive = auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": token, "apiary_id": apiary["id"], "name": "H1", "hive_type": "langstroth"
    }).json()
    for payload in [
        {"date": "2026-03-01", "varroa_count": 2, "brood_frames": 4, "mood": "calm", "queen_seen": True},
        {"date": "2026-04-01", "varroa_count": 4, "brood_frames": 6, "mood": "nervous", "queen_seen": True},
        {"date": "2026-04-15", "varroa_count": 3, "brood_frames": 5, "mood": "calm", "swarm_cells_seen": True},
    ]:
        auth_client.post(f"/api/v1/hives/{hive['id']}/inspections", json=payload)
    return apiary, hive


def test_hive_stats(auth_client, hive_with_inspections):
    _, hive = hive_with_inspections
    r = auth_client.get(f"/api/v1/hives/{hive['id']}/stats")
    assert r.status_code == 200
    data = r.json()
    assert data["inspection_count"] == 3
    assert len(data["varroa_trend"]) == 3
    assert data["swarm_cells_count"] == 1
    assert data["mood_distribution"]["calm"] == 2


def test_hive_stats_preset(auth_client, hive_with_inspections):
    _, hive = hive_with_inspections
    r = auth_client.get(f"/api/v1/hives/{hive['id']}/stats?preset=30d")
    assert r.status_code == 200
    assert r.json()["period"]["preset"] == "30d"


def test_apiary_stats(auth_client, hive_with_inspections):
    apiary, _ = hive_with_inspections
    r = auth_client.get(f"/api/v1/apiaries/{apiary['id']}/stats")
    assert r.status_code == 200
    data = r.json()
    assert data["hive_count"] == 1
    assert data["inspections_total"] == 3


def test_overview_stats(auth_client, hive_with_inspections):
    r = auth_client.get("/api/v1/stats/overview")
    assert r.status_code == 200
    data = r.json()
    assert data["apiary_count"] == 1
    assert data["hive_count"] == 1
    assert data["inspections_total"] == 3


# ── community heatmap ─────────────────────────────────────────────────────────

@pytest.fixture
def heatmap_seed(auth_client):
    """Public apiary with GPS + inspections covering all four metrics."""
    apiary = auth_client.post("/api/v1/apiaries", json={
        "name": "Public Farm", "latitude": 48.5, "longitude": 11.5, "is_public": True
    }).json()
    batch = auth_client.post("/api/v1/qr-batches", json={"count": 1}).json()
    token = batch["tokens"][0]["token"]
    hive = auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": token, "apiary_id": apiary["id"], "name": "H1", "hive_type": "langstroth"
    }).json()
    auth_client.post(f"/api/v1/hives/{hive['id']}/inspections", json={
        "date": "2026-04-01", "varroa_count": 3, "mood": "calm",
        "brood_frames": 5, "swarm_cells_seen": True,
    })
    auth_client.post(f"/api/v1/hives/{hive['id']}/inspections", json={
        "date": "2026-04-15", "varroa_count": 1, "mood": "calm",
        "brood_frames": 6, "swarm_cells_seen": False,
    })
    return apiary, hive


def test_community_heatmap_returns_geojson(auth_client, heatmap_seed):
    r = auth_client.get("/api/v1/stats/community-heatmap")
    assert r.status_code == 200
    data = r.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 1
    feat = data["features"][0]
    assert feat["type"] == "Feature"
    assert feat["geometry"]["type"] == "Polygon"


def test_community_heatmap_properties(auth_client, heatmap_seed):
    data = auth_client.get("/api/v1/stats/community-heatmap").json()
    props = data["features"][0]["properties"]
    assert props["avg_varroa"] == 2.0          # (3 + 1) / 2
    assert props["mood_score"] == 100          # both calm
    assert props["avg_brood"] == 5.5           # (5 + 6) / 2
    assert props["swarm_pct"] == 50            # 1 of 2 inspections
    assert props["apiary_count"] == 1
    assert props["inspection_count"] == 2


def test_community_heatmap_excludes_private(auth_client):
    # Private apiary — should not appear even with GPS
    apiary = auth_client.post("/api/v1/apiaries", json={
        "name": "Secret", "latitude": 48.5, "longitude": 11.5
    }).json()
    batch = auth_client.post("/api/v1/qr-batches", json={"count": 1}).json()
    token = batch["tokens"][0]["token"]
    hive = auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": token, "apiary_id": apiary["id"], "name": "H1", "hive_type": "langstroth"
    }).json()
    auth_client.post(f"/api/v1/hives/{hive['id']}/inspections", json={
        "date": "2026-04-01", "varroa_count": 5
    })
    data = auth_client.get("/api/v1/stats/community-heatmap").json()
    assert len(data["features"]) == 0


def test_community_heatmap_requires_auth(client):
    r = client.get("/api/v1/stats/community-heatmap", headers={"Authorization": "Bearer invalid"})
    assert r.status_code == 401


def test_community_heatmap_null_metrics(auth_client):
    """Inspections with no varroa/brood/mood still create a cell with nulls."""
    apiary = auth_client.post("/api/v1/apiaries", json={
        "name": "Minimal", "latitude": 48.5, "longitude": 11.5, "is_public": True
    }).json()
    batch = auth_client.post("/api/v1/qr-batches", json={"count": 1}).json()
    token = batch["tokens"][0]["token"]
    hive = auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": token, "apiary_id": apiary["id"], "name": "H1", "hive_type": "langstroth"
    }).json()
    auth_client.post(f"/api/v1/hives/{hive['id']}/inspections", json={"date": "2026-04-01"})
    data = auth_client.get("/api/v1/stats/community-heatmap").json()
    assert len(data["features"]) == 1
    props = data["features"][0]["properties"]
    assert props["avg_varroa"] is None
    assert props["mood_score"] is None
    assert props["avg_brood"] is None
    assert props["swarm_pct"] == 0
