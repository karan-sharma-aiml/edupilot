import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient

os.environ.setdefault(
    "MONGODB_URI", "mongodb+srv://user:pass@example.mongodb.net/edupilot"
)
os.environ.setdefault("MONGODB_DB", "edupilot")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret")

from main import app


def test_health_endpoint_exists():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
