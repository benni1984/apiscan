import csv
import io
import json
import pytest


@pytest.fixture
def setup(auth_client):
    apiary = auth_client.post("/api/v1/apiaries", json={"name": "Export Apiary"}).json()
    batch = auth_client.post("/api/v1/qr-batches", json={"count": 2}).json()
    hive1 = auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": batch["tokens"][0]["token"],
        "apiary_id": apiary["id"],
        "name": "Hive A",
        "hive_type": "langstroth",
    }).json()
    hive2 = auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": batch["tokens"][1]["token"],
        "apiary_id": apiary["id"],
        "name": "Hive B",
        "hive_type": "dadant",
    }).json()
    auth_client.post(f"/api/v1/hives/{hive1['id']}/inspections", json={
        "date": "2026-04-01",
        "queen_seen": True,
        "brood_frames": 5,
        "varroa_count": 2,
        "mood": "calm",
        "custom_fields": {"temp_c": 18},
    })
    auth_client.post(f"/api/v1/hives/{hive1['id']}/inspections", json={
        "date": "2026-04-15",
        "brood_frames": 7,
        "custom_fields": {"temp_c": 20},
    })
    auth_client.post(f"/api/v1/hives/{hive2['id']}/inspections", json={
        "date": "2026-04-10",
        "varroa_count": 5,
    })
    return {"apiary": apiary, "hive1": hive1, "hive2": hive2}


# ---------------------------------------------------------------------------
# Hive export — JSON
# ---------------------------------------------------------------------------

def test_hive_export_json(auth_client, setup):
    hive_id = setup["hive1"]["id"]
    r = auth_client.get(f"/api/v1/hives/{hive_id}/inspections/export?format=json")
    assert r.status_code == 200
    assert "application/json" in r.headers["content-type"]
    assert "attachment" in r.headers["content-disposition"]
    data = r.json()
    assert len(data) == 2
    assert data[0]["brood_frames"] == 7   # most recent first
    assert data[1]["brood_frames"] == 5


def test_hive_export_json_default_format(auth_client, setup):
    hive_id = setup["hive1"]["id"]
    r = auth_client.get(f"/api/v1/hives/{hive_id}/inspections/export")
    assert r.status_code == 200
    assert "application/json" in r.headers["content-type"]


# ---------------------------------------------------------------------------
# Hive export — CSV
# ---------------------------------------------------------------------------

def test_hive_export_csv(auth_client, setup):
    hive_id = setup["hive1"]["id"]
    r = auth_client.get(f"/api/v1/hives/{hive_id}/inspections/export?format=csv")
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]
    reader = csv.DictReader(io.StringIO(r.text))
    rows = list(reader)
    assert len(rows) == 2
    assert "brood_frames" in reader.fieldnames
    assert "temp_c" in reader.fieldnames      # custom field column


def test_hive_export_csv_custom_field_values(auth_client, setup):
    hive_id = setup["hive1"]["id"]
    r = auth_client.get(f"/api/v1/hives/{hive_id}/inspections/export?format=csv")
    reader = csv.DictReader(io.StringIO(r.text))
    rows = list(reader)
    temp_values = {row["temp_c"] for row in rows}
    assert "18" in temp_values or "18.0" in temp_values or 18 in temp_values


# ---------------------------------------------------------------------------
# Apiary export — JSON
# ---------------------------------------------------------------------------

def test_apiary_export_json(auth_client, setup):
    apiary_id = setup["apiary"]["id"]
    r = auth_client.get(f"/api/v1/apiaries/{apiary_id}/inspections/export?format=json")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 3   # 2 from hive1 + 1 from hive2


def test_apiary_export_json_attachment(auth_client, setup):
    apiary_id = setup["apiary"]["id"]
    r = auth_client.get(f"/api/v1/apiaries/{apiary_id}/inspections/export?format=json")
    assert "attachment" in r.headers["content-disposition"]
    assert apiary_id in r.headers["content-disposition"]


# ---------------------------------------------------------------------------
# Apiary export — CSV
# ---------------------------------------------------------------------------

def test_apiary_export_csv(auth_client, setup):
    apiary_id = setup["apiary"]["id"]
    r = auth_client.get(f"/api/v1/apiaries/{apiary_id}/inspections/export?format=csv")
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]
    reader = csv.DictReader(io.StringIO(r.text))
    rows = list(reader)
    assert len(rows) == 3
    assert "hive_name" in reader.fieldnames
    hive_names = {row["hive_name"] for row in rows}
    assert "Hive A" in hive_names
    assert "Hive B" in hive_names


def test_apiary_export_csv_custom_columns(auth_client, setup):
    apiary_id = setup["apiary"]["id"]
    r = auth_client.get(f"/api/v1/apiaries/{apiary_id}/inspections/export?format=csv")
    reader = csv.DictReader(io.StringIO(r.text))
    assert "temp_c" in reader.fieldnames


# ---------------------------------------------------------------------------
# Auth / ownership guards
# ---------------------------------------------------------------------------

def test_hive_export_requires_auth(client):
    r = client.get("/api/v1/hives/any-id/inspections/export", headers={"Authorization": "Bearer invalid"})
    assert r.status_code == 401


def test_hive_export_wrong_user(auth_client2, setup):
    hive_id = setup["hive1"]["id"]
    r = auth_client2.get(f"/api/v1/hives/{hive_id}/inspections/export")
    assert r.status_code == 404


def test_apiary_export_requires_auth(client):
    r = client.get("/api/v1/apiaries/any-id/inspections/export", headers={"Authorization": "Bearer invalid"})
    assert r.status_code == 401


def test_apiary_export_wrong_user(auth_client2, setup):
    apiary_id = setup["apiary"]["id"]
    r = auth_client2.get(f"/api/v1/apiaries/{apiary_id}/inspections/export")
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# Invalid format
# ---------------------------------------------------------------------------

def test_invalid_format_rejected(auth_client, setup):
    hive_id = setup["hive1"]["id"]
    r = auth_client.get(f"/api/v1/hives/{hive_id}/inspections/export?format=xml")
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# Empty hive / apiary
# ---------------------------------------------------------------------------

def test_hive_export_empty(auth_client):
    apiary = auth_client.post("/api/v1/apiaries", json={"name": "Empty"}).json()
    batch = auth_client.post("/api/v1/qr-batches", json={"count": 1}).json()
    hive = auth_client.post("/api/v1/hives/initialize", json={
        "qr_token": batch["tokens"][0]["token"],
        "apiary_id": apiary["id"],
        "name": "Empty Hive",
        "hive_type": "langstroth",
    }).json()
    r = auth_client.get(f"/api/v1/hives/{hive['id']}/inspections/export?format=json")
    assert r.status_code == 200
    assert r.json() == []


def test_apiary_export_empty(auth_client):
    apiary = auth_client.post("/api/v1/apiaries", json={"name": "No Hives"}).json()
    r = auth_client.get(f"/api/v1/apiaries/{apiary['id']}/inspections/export?format=json")
    assert r.status_code == 200
    assert r.json() == []
