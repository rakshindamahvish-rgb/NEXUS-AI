import pytest
from app.optimization.solver import SupplyChainOptimizer
from app.api.routes_simulation import get_raw_data_dict
from app.database import SessionLocal

def test_scipy_optimization_solver():
    db = SessionLocal()
    try:
        raw_data = get_raw_data_dict(db)
        optimizer = SupplyChainOptimizer(raw_data)
        
        scenario_params = {
            "critical_supplier_id": 1,
            "shutdown_duration_days": 7,
            "demand_multiplier": 1.0,
            "alternate_supplier_capacity_multiplier": 1.0,
            "transport_cost_multiplier": 1.0,
            "starting_inventory_multiplier": 1.0,
            "production_capacity_reduction": 0.0
        }

        res = optimizer.solve(scenario_params)
        assert res["success"] is True
        assert res["status"] == "OPTIMAL"
        assert res["objective_value"] > 0.0
        assert len(res["actions"]) > 0
        assert res["runtime_ms"] > 0
    finally:
        db.close()
