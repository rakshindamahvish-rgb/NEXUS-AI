from typing import Dict, Any
from app.agents.base import BaseAgent

class RiskResilienceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Risk & Resilience Agent",
            role="Supply Concentration, Capacity Buffer & Fragility Auditing"
        )

    def analyze(self, raw_data: Dict[str, Any], scenario_params: Dict[str, Any]) -> Dict[str, Any]:
        alt_cap_mult = scenario_params.get("alternate_supplier_capacity_multiplier", 1.0)
        alt_daily_cap = 300.0 * alt_cap_mult

        return {
            "status": "COMPLETED",
            "proposed_action": f"Impose safety ceiling of 75% on Bharat Silicon Corp (SUP-02) daily order volume (max {alt_daily_cap * 0.75:.0f} units/day). Require minimum 2 days safety buffer of finished goods at DC-01 and DC-02 before de-escalating emergency protocols.",
            "rationale": f"Operating SUP-02 at 100% capacity creates extreme counterparty vulnerability if Bharat Silicon experiences quality defects or minor delays (reliability is 88% vs Apex 95%). A 25% capacity cushion ensures resilience against secondary shock waves.",
            "confidence_score": 0.92,
            "key_metrics": {
                "supplier_reliability_score": 0.88,
                "recommended_capacity_ceiling_pct": 75.0,
                "max_resilient_procurement_daily": round(alt_daily_cap * 0.75, 1),
                "target_safety_buffer_days": 2.0
            }
        }
