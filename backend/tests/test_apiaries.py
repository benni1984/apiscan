def test_create_and_list(auth_client):
    r = auth_client.post("/api/v1/apiaries", json={"name": "Garden"})
    assert r.status_code == 201
    assert r.json()["name"] == "Garden"
    assert r.json()["hive_count"] == 0

    r2 = auth_client.get("/api/v1/apiaries")
    assert r2.status_code == 200
    assert r2.json()["total"] == 1


def test_update(auth_client):
    r = auth_client.post("/api/v1/apiaries", json={"name": "Garden"})
    aid = r.json()["id"]
    r2 = auth_client.put(f"/api/v1/apiaries/{aid}", json={"name": "Forest"})
    assert r2.json()["name"] == "Forest"


def test_delete_empty(auth_client):
    r = auth_client.post("/api/v1/apiaries", json={"name": "Garden"})
    aid = r.json()["id"]
    r2 = auth_client.delete(f"/api/v1/apiaries/{aid}")
    assert r2.status_code == 204


def test_delete_with_hives_blocked(auth_client):
    r = auth_client.post("/api/v1/apiaries", json={"name": "Garden"})
    aid = r.json()["id"]

    batch = auth_client.post("/api/v1/qr-batches", json={"count": 1})
    token = batch.json()["tokens"][0]["token"]

    auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": token, "apiary_id": aid, "name": "H1", "hive_type": "langstroth"
    })

    r2 = auth_client.delete(f"/api/v1/apiaries/{aid}")
    assert r2.status_code == 409
    assert r2.json()["detail"]["code"] == "APIARY_HAS_HIVES"
