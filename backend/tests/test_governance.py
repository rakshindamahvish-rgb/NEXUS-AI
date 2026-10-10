import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.entities import RecoveryPlan, PlannerDecision, AuditEvent

client = TestClient(app)

def test_full_governance_and_decision_lifecycle():
    # 1. Trigger latest simulation
    sim_res = client.get("/api/v1/simulation/latest")
    assert sim_res.status_code == 200
    data = sim_res.json()
    plans = data["plans"]
    assert len(plans) >= 4

    rec_plan = next(p for p in plans if p["is_recommended"])
    
    # 2. Approve Plan
    app_res = client.post("/api/v1/governance/decide", json={
        "plan_id": rec_plan["id"],
        "decision_type": "APPROVED",
        "planner_notes": "Formally approving coordinated plan for crisis mitigation."
    })
    assert app_res.status_code == 200
    dec_data = app_res.json()
    assert dec_data["decision_type"] == "APPROVED"

    # 3. Check persistent decision history
    hist_res = client.get("/api/v1/governance/decisions")
    assert hist_res.status_code == 200
    hist_list = hist_res.json()
    assert len(hist_list) > 0
    assert any(d["plan_id"] == rec_plan["id"] for d in hist_list)

    # 4. Check Audit log
    audit_res = client.get("/api/v1/governance/audit-log")
    assert audit_res.status_code == 200
    audit_list = audit_res.json()
    assert len(audit_list) > 0
