from typing import Dict, Any
from app.agents.base import BaseAgent

class SupplierRiskAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Supplier Risk Agent",
            role="Disruption Impact & Alternative Sourcing Assessment"
        )

    def analyze(self, raw_data: Dict[str, Any], scenario_params: Dict[str, Any]) -> Dict[str, Any]:
        crit_sup_id = scenario_params.get("critical_supplier_id", 1)
        shutdown_days = scenario_params.get("shutdown_duration_days", 7)
        alt_cap_mult = scenario_params.get("alternate_supplier_capacity_multiplier", 1.0)

        suppliers = {s["id"]: s for s in raw_data.get("suppliers", [])}
        crit_sup = suppliers.get(crit_sup_id, {"name": "Apex Semiconductors Ltd", "code": "SUP-01"})
        alt_sup = suppliers.get(2, {"name": "Bharat Silicon Corp", "code": "SUP-02", "capacity_daily": 300.0, "unit_cost": 550.0})

        alt_daily_cap = alt_sup.get("capacity_daily", 300.0) * alt_cap_mult
        cost_delta = alt_sup.get("unit_cost", 550.0) - 450.0 # +₹100/unit price surge

        return {
            "status": "COMPLETED",
            "proposed_action": f"Declare critical disruption on {crit_sup['name']} ({crit_sup.get('code', 'SUP-01')}) for {shutdown_days} days. Activate qualified secondary supplier {alt_sup['name']} (SUP-02) with capacity target of {alt_daily_cap:.0f} units/day.",
            "rationale": f"Apex Semiconductors provides 100% of standard MCU-X supply. Total supply deficit over {shutdown_days} days is {shutdown_days * 500:.0f} potential units. Alternate supplier Bharat Silicon Corp can fulfill up to {alt_daily_cap:.0f} units/day at +₹{cost_delta:.0f}/unit premium with 4-day standard lead time.",
            "confidence_score": 0.98,
            "key_metrics": {
                "disrupted_supplier": crit_sup["name"],
                "shutdown_duration_days": shutdown_days,
                "lost_standard_capacity_daily": 500.0,
                "alternate_supplier": alt_sup["name"],
                "available_alternate_capacity_daily": round(alt_daily_cap, 1),
                "alternate_cost_premium_per_unit": round(cost_delta, 2),
                "alternate_standard_lead_time_days": 4
            }
        }
