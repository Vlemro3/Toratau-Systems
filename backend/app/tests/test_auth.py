"""Auth API tests."""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_login_no_body():
    r = client.post("/auth/login", json={})
    assert r.status_code in (422, 401)


def test_login_wrong_creds():
    r = client.post("/auth/login", json={"username": "x", "password": "y"})
    assert r.status_code == 401
