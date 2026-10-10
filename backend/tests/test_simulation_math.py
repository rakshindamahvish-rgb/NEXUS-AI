import pytest
from app.simulation.engine import SupplyChainSimulator
from app.api.routes_simulation import get_raw_data_dict
from app.database import SessionLocal
from app.simulation.strategies import generate_cost_first_actions, generate_service_first_actions, generate_balanced_actions

def test_simulation_math_and_inventory_balance():
    db = SessionLocal()
    try:
        raw_data = get_raw_data_dict(db)
        simulator = SupplyChainSimulator(raw_data)
        
        scenario_params = {
            "critical_supplier_id": 1,
            "shutdown_duration_days": 7,
            "demand_multiplier": 1.0,
            "alternate_supplier_capacity_multiplier": 1.0,
            "transport_cost_multiplier": 1.0,
            "starting_inventory_multiplier": 1.0,
            "production_capacity_reduction": 0.0
        }

        # Run Balanced Strategy
        actions = generate_balanced_actions(scenario_params)
        result = simulator.run_simulation(scenario_params, actions, strategy_type="BALANCED")

        assert result["total_cost"] > 0.0
        assert 0.0 <= result["fill_rate"] <= 100.0
        assert len(result["daily_timeline"]) == 7

        # Test daily conservation of inventory: ending inventory >= 0
        for entry in result["daily_timeline"]:
            assert entry["ending_inventory"] >= 0.0
            assert entry["demand"] > 0.0
            assert entry["cumulative_cost"] >= entry["daily_cost"]

        # Test that Service-First has higher fill rate but higher expediting cost than Cost-First
        sf_actions = generate_service_first_actions(scenario_params)
        sf_result = simulator.run_simulation(scenario_params, sf_actions, strategy_type="SERVICE_FIRST")

        cf_actions = generate_cost_first_actions(scenario_params)
        cf_result = simulator.run_simulation(scenario_params, cf_actions, strategy_type="COST_FIRST")

        assert sf_result["fill_rate"] >= cf_result["fill_rate"]
        assert sf_result["expediting_cost"] > cf_result["expediting_cost"]
    finally:
        db.close()
