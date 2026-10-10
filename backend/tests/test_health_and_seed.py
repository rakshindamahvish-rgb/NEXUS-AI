import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.entities import Supplier, Product, Facility, DistributionCenter

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/settings/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["currency"] == "INR"

def test_database_seeded():
    db = SessionLocal()
    try:
        suppliers = db.query(Supplier).all()
        facilities = db.query(Facility).all()
        dcs = db.query(DistributionCenter).all()
        products = db.query(Product).all()

        assert len(suppliers) >= 3
        assert len(facilities) >= 1
        assert len(dcs) >= 2
        assert len(products) >= 4

        critical_sup = next((s for s in suppliers if s.is_critical), None)
        assert critical_sup is not None
        assert "Apex" in critical_sup.name
    finally:
        db.close()
