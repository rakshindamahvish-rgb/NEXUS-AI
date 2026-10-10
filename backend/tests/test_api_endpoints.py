import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_network_endpoints():
    res = client.get("/api/v1/network/overview")
    assert res.status_code == 200
    data = res.json()
    assert len(data["suppliers"]) == 3
    assert len(data["facilities"]) == 1
    assert len(data["distribution_centers"]) == 2
    assert len(data["products"]) == 4

def test_what_if_simulation_and_recalculation():
    # Create what-if scenario with 20% demand surge and alternate capacity reduction
    sc_res = client.post("/api/v1/simulation/scenarios", json={
        "name": "What-If Scenario: 20% Demand Surge + Supplier Outage",
        "description": "Evaluating system resilience under high demand and shutdown",
        "critical_supplier_id": 1,
        "shutdown_duration_days": 7,
        "demand_multiplier": 1.2,
        "alternate_supplier_capacity_multiplier": 0.8,
        "transport_cost_multiplier": 1.25,
        "starting_inventory_multiplier": 1.0,
        "production_capacity_reduction": 0.0
    })
    assert sc_res.status_code == 200
    sc_data = sc_res.json()
    sc_id = sc_data["id"]

    # Run simulation on this new scenario
    sim_res = client.post(f"/api/v1/simulation/run/{sc_id}")
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert len(sim_data["plans"]) >= 4
    assert len(sim_data["agents"]) == 8

    # Verify Benchmarks endpoint
    bench_res = client.get(f"/api/v1/benchmarks/compare/{sc_id}")
    assert bench_res.status_code == 200
    bench_data = bench_res.json()
    assert len(bench_data["metrics_comparison"]) >= 3

def test_data_export():
    res = client.get("/api/v1/data/export/csv/suppliers")
    assert res.status_code == 200
    assert "Apex Semiconductors" in res.text
