from typing import Dict, Any
from app.agents.base import BaseAgent

class LogisticsAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Logistics Agent",
            role="Freight Routing, Lead-Time Compression & Expediting"
        )

    def analyze(self, raw_data: Dict[str, Any], scenario_params: Dict[str, Any]) -> Dict[str, Any]:
        trans_mult = scenario_params.get("transport_cost_multiplier", 1.0)
        
        # Sourcing transit: SUP-02 -> FAC-01
        std_lead_time = 4
        exp_lead_time = 2
        std_cost = 55.0 * trans_mult
        exp_cost = 130.0 * trans_mult
        transit_savings_days = std_lead_time - exp_lead_time

        return {
            "status": "COMPLETED",
            "proposed_action": f"Authorize targeted air-freight expediting from Hyderabad (SUP-02) to Pune MegaFactory on Days 1 to 3 to compress lead time from 4 days to 2 days, mitigating Day 3 stockout.",
            "rationale": f"Standard ground freight takes 4 days, meaning parts ordered on Day 1 will only arrive Day 5, causing a 2-day manufacturing shutdown. Expediting compresses transit to 2 days at ₹{exp_cost:.0f}/unit vs ₹{std_cost:.0f}/unit standard, preventing costly downstream assembly delays.",
            "confidence_score": 0.93,
            "key_metrics": {
                "standard_lead_time_days": std_lead_time,
                "expedited_lead_time_days": exp_lead_time,
                "transit_time_saved_days": transit_savings_days,
                "standard_freight_rate": round(std_cost, 2),
                "expedited_freight_rate": round(exp_cost, 2),
                "expedite_premium_rate": round(exp_cost - std_cost, 2)
            }
        }
