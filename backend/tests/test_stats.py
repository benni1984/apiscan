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
