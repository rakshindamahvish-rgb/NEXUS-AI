from typing import Dict, Any
from app.agents.base import BaseAgent

class ProductionPlanningAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Production Planning Agent",
            role="Assembly Scheduling, Overtime & Capacity Optimization"
        )

    def analyze(self, raw_data: Dict[str, Any], scenario_params: Dict[str, Any]) -> Dict[str, Any]:
        prod_cap_reduct = scenario_params.get("production_capacity_reduction", 0.0)
        base_cap = 600.0 * (1.0 - prod_cap_reduct)
        overtime_cap = 200.0
        max_cap = base_cap + overtime_cap

        return {
            "status": "COMPLETED",
            "proposed_action": f"Reconfigure Pune assembly line schedule: Prioritize high-penalty Enterprise Gateways (PRD-02, 2 MCU-X) and SmartSensors (PRD-01, 1 MCU-X). Schedule 150 units/day overtime on Days 3–5 to absorb backorders.",
            "rationale": f"Base factory capacity is {base_cap:.0f} units/day. PRD-04 (EcoPower Monitor) does not require MCU-X microcontrollers and should maintain 100% steady production (140 units/day). Overtime rate of ₹120/unit is significantly cheaper than customer lost-sales penalties (₹800 to ₹1,500/unit).",
            "confidence_score": 0.95,
            "key_metrics": {
                "base_assembly_capacity_daily": round(base_cap, 1),
                "overtime_capacity_daily": round(overtime_cap, 1),
                "max_throughput_daily": round(max_cap, 1),
                "immune_product": "EcoPower Smart Monitor (PRD-04)",
                "overtime_unit_cost": 120.0
            }
        }
