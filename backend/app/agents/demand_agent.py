from typing import Dict, Any, List
from app.agents.base import BaseAgent

class DemandIntelligenceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Demand Intelligence Agent",
            role="Forecast Analysis & Volatility Assessment"
        )

    def analyze(self, raw_data: Dict[str, Any], scenario_params: Dict[str, Any]) -> Dict[str, Any]:
        demand_mult = scenario_params.get("demand_multiplier", 1.0)
        baseline_demands = raw_data.get("baseline_demand", [])
        products = {p["id"]: p for p in raw_data.get("products", [])}

        product_demand = {}
        total_demand = 0.0
        dc_demand = {1: 0.0, 2: 0.0}

        for d in baseline_demands:
            p_id = d["product_id"]
            dc_id = d["dc_id"]
            qty = d["quantity"] * demand_mult
            product_demand[p_id] = product_demand.get(p_id, 0.0) + qty
            total_demand += qty
            dc_demand[dc_id] = dc_demand.get(dc_id, 0.0) + qty

        top_product_id = max(product_demand, key=product_demand.get) if product_demand else 1
        top_product_name = products.get(top_product_id, {}).get("name", "SmartSensor Industrial Hub")
        peak_daily_demand = max(sum(d["quantity"] * demand_mult for d in baseline_demands if d["day"] == day) for day in range(1, 8))

        return {
            "status": "COMPLETED",
            "proposed_action": f"Lock baseline planning horizon at {total_demand:.0f} units (Demand Multiplier: {demand_mult:.2f}x). Prioritize high-velocity allocations for {top_product_name} and protect DC-01 buffer.",
            "rationale": f"Total demand across 7 days is {total_demand:.0f} units with a peak daily draw of {peak_daily_demand:.0f} units. DC-01 (Mumbai) accounts for {((dc_demand[1]/total_demand)*100):.1f}% of network volume. Demand multiplier of {demand_mult:.2f}x shifts vulnerability thresholds by +{((demand_mult - 1.0)*100):.0f}%.",
            "confidence_score": 0.96,
            "key_metrics": {
                "total_demand_units": round(total_demand, 1),
                "peak_daily_demand": round(peak_daily_demand, 1),
                "demand_multiplier": demand_mult,
                "dc_split_percent": {
                    "DC-01 Mumbai": round((dc_demand[1]/total_demand)*100, 1),
                    "DC-02 Bengaluru": round((dc_demand[2]/total_demand)*100, 1)
                },
                "top_product_volume": round(product_demand.get(top_product_id, 0.0), 1)
            }
        }
