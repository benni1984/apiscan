import pytest


@pytest.fixture
def apiary(auth_client):
    r = auth_client.post("/api/v1/apiaries", json={"name": "Garden"})
    return r.json()


@pytest.fixture
def qr_token(auth_client):
    r = auth_client.post("/api/v1/qr-batches", json={"count": 1})
    return r.json()["tokens"][0]["token"]


def test_unlinked_qr_scan(auth_client, qr_token):
    r = auth_client.get(f"/api/v1/hives/by-qr/{qr_token}")
    assert r.status_code == 200
    assert r.json()["status"] == "unlinked"


def test_unknown_qr_scan(auth_client):
    r = auth_client.get("/api/v1/hives/by-qr/does-not-exist")
    assert r.status_code == 404
    assert r.json()["detail"]["code"] == "QR_TOKEN_NOT_FOUND"


def test_initialize_hive(auth_client, apiary, qr_token):
    r = auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": qr_token,
        "apiary_id": apiary["id"],
        "name": "Hive 1",
        "hive_type": "langstroth",
        "latitude": 48.8,
        "longitude": 2.3,
    })
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Hive 1"
    assert data["qr_token"] == qr_token


def test_linked_qr_scan(auth_client, apiary, qr_token):
    auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": qr_token, "apiary_id": apiary["id"], "name": "H1", "hive_type": "langstroth"
    })
    r = auth_client.get(f"/api/v1/hives/by-qr/{qr_token}")
    assert r.status_code == 200
    assert r.json()["name"] == "H1"


def test_double_initialize_fails(auth_client, apiary, qr_token):
    payload = {"qr_token": qr_token, "apiary_id": apiary["id"], "name": "H1", "hive_type": "langstroth"}
    auth_client.post("/api/v1/hives/initialize", json=payload)
    r = auth_client.post("/api/v1/hives/initialize", json=payload)
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "QR_TOKEN_ALREADY_LINKED"


def test_list_hives(auth_client, apiary, qr_token):
    auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": qr_token, "apiary_id": apiary["id"], "name": "H1", "hive_type": "langstroth"
    })
    r = auth_client.get(f"/api/v1/apiaries/{apiary['id']}/hives")
    assert r.json()["total"] == 1


def test_update_hive(auth_client, apiary, qr_token):
    r = auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": qr_token, "apiary_id": apiary["id"], "name": "H1", "hive_type": "langstroth"
    })
    hid = r.json()["id"]
    r2 = auth_client.put(f"/api/v1/hives/{hid}", json={"name": "Updated"})
    assert r2.json()["name"] == "Updated"


def test_delete_hive(auth_client, apiary, qr_token):
    r = auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": qr_token, "apiary_id": apiary["id"], "name": "H1", "hive_type": "langstroth"
    })
    hid = r.json()["id"]
    r2 = auth_client.delete(f"/api/v1/hives/{hid}")
    assert r2.status_code == 204
