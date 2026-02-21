"""Projects API tests (require auth)."""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_projects_unauthorized():
    r = client.get("/projects")
    assert r.status_code == 401
