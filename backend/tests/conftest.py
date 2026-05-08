import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from main import app

TEST_DB_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_client(client):
    client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User",
        "locale": "en",
    })
    resp = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "password123",
    })
    token = resp.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client


@pytest.fixture
def auth_client2(auth_client):
    # Use auth_client to register the second user (no-auth endpoints).
    # app.dependency_overrides is already set on the shared app object,
    # so a new TestClient picks it up automatically.
    auth_client.post("/api/v1/auth/register", json={
        "email": "other@example.com",
        "password": "password123",
        "name": "Other User",
        "locale": "en",
    })
    resp = auth_client.post("/api/v1/auth/login", json={
        "email": "other@example.com",
        "password": "password123",
    })
    token = resp.json()["access_token"]
    c2 = TestClient(app)
    c2.headers.update({"Authorization": f"Bearer {token}"})
    return c2
