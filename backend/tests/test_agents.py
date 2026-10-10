import pytest
from app.agents.manager import AgentManager
from app.api.routes_simulation import get_raw_data_dict
from app.database import SessionLocal

def test_all_8_agents_execute():
    db = SessionLocal()
    try:
        raw_data = get_raw_data_dict(db)
        scenario_params = {
            "critical_supplier_id": 1,
            "shutdown_duration_days": 7,
            "demand_multiplier": 1.2, # 20% demand surge
            "alternate_supplier_capacity_multiplier": 1.0,
            "transport_cost_multiplier": 1.0,
            "starting_inventory_multiplier": 1.0,
            "production_capacity_reduction": 0.0
        }

        mgr = AgentManager()
        outputs = mgr.run_all_agents(raw_data, scenario_params)

        assert len(outputs) == 8 # 7 specialized + 1 coordinator
        
        agent_names = [a["agent_name"] for a in outputs]
        assert "Demand Intelligence Agent" in agent_names
        assert "Inventory Agent" in agent_names
        assert "Supplier Risk Agent" in agent_names
        assert "Logistics Agent" in agent_names
        assert "Production Planning Agent" in agent_names
        assert "Cost & Service Agent" in agent_names
        assert "Risk & Resilience Agent" in agent_names
        assert "Coordinator Agent" in agent_names

        for agent_res in outputs:
            assert agent_res["status"] == "COMPLETED"
            assert len(agent_res["proposed_action"]) > 10
            assert len(agent_res["rationale"]) > 10
            assert agent_res["execution_time_ms"] > 0
    finally:
        db.close()
