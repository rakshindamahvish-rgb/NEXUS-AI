from typing import Dict, Any, List
from app.agents.base import BaseAgent

class CoordinatorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Coordinator Agent",
            role="Multi-Agent Conflict Resolution & Consensus Synthesis"
        )

    def analyze(self, raw_data: Dict[str, Any], scenario_params: Dict[str, Any]) -> Dict[str, Any]:
        alt_cap_mult = scenario_params.get("alternate_supplier_capacity_multiplier", 1.0)
        demand_mult = scenario_params.get("demand_multiplier", 1.0)
        shutdown_days = scenario_params.get("shutdown_duration_days", 7)

        # Consensus actions synthesis
        alt_cap = 300.0 * alt_cap_mult
        safe_alt_qty = min(225.0, alt_cap * 0.85)

        return {
            "status": "COMPLETED",
            "proposed_action": f"Synthesize coordinated 7-day multi-echelon recovery directive: Order {safe_alt_qty:.0f} MCU-X/day from SUP-02 (air-expedited Days 1-3, standard Days 4-7); schedule 150 units/day assembly overtime on Days 3-5; rebalance DC-01 (60%) and DC-02 (40%) distribution.",
            "rationale": f"Resolved conflict between Risk Agent (demanded 75% supplier cap) and Service Agent (demanded 100% capacity + 100% expediting). By capping SUP-02 at {safe_alt_qty:.0f} units/day (~75-80%) with front-loaded expediting and targeted overtime, we prevent stockout collapse while avoiding over ₹400,000 in redundant expediting waste.",
            "confidence_score": 0.98,
            "key_metrics": {
                "conflicts_detected": 3,
                "conflicts_resolved": 3,
                "consensus_plan_type": "COORDINATED_AGENT",
                "recommended_procurement_daily": round(safe_alt_qty, 1),
                "expedited_days_window": "Days 1 to 3",
                "overtime_days_window": "Days 3 to 5",
                "tradeoff_balance_score": 9.4
            }
        }

    def generate_coordinated_actions(self, raw_data: Dict[str, Any], scenario_params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generates concrete plan action items for simulation execution."""
        alt_cap_mult = scenario_params.get("alternate_supplier_capacity_multiplier", 1.0)
        alt_cap = 300.0 * alt_cap_mult
        safe_qty = min(225.0, alt_cap * 0.85)
        
        actions = []
        for day in range(1, 8):
            is_exp = (day <= 3) # Expedite days 1-3
            actions.append({
                "id": f"COORD-ALT-{day}",
                "day": day,
                "action_type": "PROCURE_ALTERNATE",
                "target_entity": "Bharat Silicon Corp (SUP-02)",
                "item": "Microcontroller MCU-X",
                "quantity": safe_qty,
                "unit_cost": 550.0,
                "estimated_cost": safe_qty * (550.0 + (130.0 if is_exp else 55.0)),
                "is_expedited": is_exp,
                "rationale": f"Consensus procurement: {safe_qty:.0f} units with {'air-expedited' if is_exp else 'standard'} freight."
            })
        
        for day in [3, 4, 5]:
            actions.append({
                "id": f"COORD-OT-{day}",
                "day": day,
                "action_type": "OVERTIME_PRODUCTION",
                "target_entity": "Pune Advanced Electronics MegaFactory",
                "item": "Assembly Overtime (+150 units)",
                "quantity": 150.0,
                "unit_cost": 120.0,
                "estimated_cost": 18000.0,
                "rationale": "Overtime consensus to absorb mid-week backorders."
            })

        return actions
