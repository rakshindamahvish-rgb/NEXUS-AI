from typing import Dict, Any
from app.agents.base import BaseAgent

class InventoryAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Inventory Agent",
            role="Stock Depletion Modeling & Stockout Forecasting"
        )

    def analyze(self, raw_data: Dict[str, Any], scenario_params: Dict[str, Any]) -> Dict[str, Any]:
        inv_mult = scenario_params.get("starting_inventory_multiplier", 1.0)
        demand_mult = scenario_params.get("demand_multiplier", 1.0)

        # Baseline factory component stock
        mcu_stock = 450.0 * inv_mult
        pm_stock = 900.0 * inv_mult
        
        # Estimate burn rate: factory consumes ~300 MCU-X per day under standard production
        burn_rate_mcu = 280.0 * demand_mult
        days_of_mcu_supply = mcu_stock / burn_rate_mcu if burn_rate_mcu > 0 else 99.0
        stockout_day = min(7, int(days_of_mcu_supply) + 1)

        # DC finished goods stock
        dc1_fg = 560.0 * inv_mult
        dc2_fg = 440.0 * inv_mult
        total_fg = dc1_fg + dc2_fg

        return {
            "status": "COMPLETED",
            "proposed_action": f"Initiate immediate stock preservation protocol. Without replenishment, factory Microcontroller MCU-X inventory ({mcu_stock:.0f} units) will deplete by Day {stockout_day}. Reallocate 65% of available finished goods buffer to DC-01.",
            "rationale": f"Current factory on-hand inventory provides only {days_of_mcu_supply:.1f} days of production run-rate. At Day {stockout_day}, assembly lines for PRD-01, PRD-02, and PRD-03 will starve without emergency component pipeline injection. EcoPower Monitor (PRD-04) remains immune.",
            "confidence_score": 0.94,
            "key_metrics": {
                "factory_mcu_inventory": round(mcu_stock, 1),
                "factory_pm_inventory": round(pm_stock, 1),
                "days_of_mcu_supply": round(days_of_mcu_supply, 2),
                "projected_stockout_day": stockout_day,
                "network_fg_inventory": round(total_fg, 1)
            }
        }
