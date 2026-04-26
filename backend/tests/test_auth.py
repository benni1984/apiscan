def test_register(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "a@b.com", "password": "password1", "name": "Alice", "locale": "en"
    })
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == "a@b.com"


def test_register_duplicate(client):
    payload = {"email": "a@b.com", "password": "password1", "name": "Alice", "locale": "en"}
    client.post("/api/v1/auth/register", json=payload)
    r = client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "EMAIL_ALREADY_REGISTERED"


def test_login(client):
    client.post("/api/v1/auth/register", json={
        "email": "a@b.com", "password": "password1", "name": "Alice", "locale": "en"
    })
    r = client.post("/api/v1/auth/login", json={"email": "a@b.com", "password": "password1"})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_wrong_password(client):
    client.post("/api/v1/auth/register", json={
        "email": "a@b.com", "password": "password1", "name": "Alice", "locale": "en"
    })
    r = client.post("/api/v1/auth/login", json={"email": "a@b.com", "password": "wrong"})
    assert r.status_code == 401
    assert r.json()["detail"]["code"] == "INVALID_CREDENTIALS"


def test_refresh(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "a@b.com", "password": "password1", "name": "Alice", "locale": "en"
    })
    refresh_token = r.json()["refresh_token"]
    r2 = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert r2.status_code == 200
    assert "access_token" in r2.json()


def test_logout(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "a@b.com", "password": "password1", "name": "Alice", "locale": "en"
    })
    refresh_token = r.json()["refresh_token"]
    r2 = client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token})
    assert r2.status_code == 204
    r3 = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert r3.status_code == 401
