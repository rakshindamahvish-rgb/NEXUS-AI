from typing import Dict, Any, List
from app.agents.demand_agent import DemandIntelligenceAgent
from app.agents.inventory_agent import InventoryAgent
from app.agents.supplier_risk_agent import SupplierRiskAgent
from app.agents.logistics_agent import LogisticsAgent
from app.agents.production_agent import ProductionPlanningAgent
from app.agents.cost_service_agent import CostServiceAgent
from app.agents.risk_resilience_agent import RiskResilienceAgent
from app.agents.coordinator_agent import CoordinatorAgent

class AgentManager:
    def __init__(self):
        self.specialized_agents = [
            DemandIntelligenceAgent(),
            InventoryAgent(),
            SupplierRiskAgent(),
            LogisticsAgent(),
            ProductionPlanningAgent(),
            CostServiceAgent(),
            RiskResilienceAgent()
        ]
        self.coordinator = CoordinatorAgent()

    def run_all_agents(self, raw_data: Dict[str, Any], scenario_params: Dict[str, Any]) -> List[Dict[str, Any]]:
        results = []
        for agent in self.specialized_agents:
            res = agent.run(raw_data, scenario_params)
            results.append(res)
        
        # Run Coordinator Agent last to synthesize
        coord_res = self.coordinator.run(raw_data, scenario_params)
        results.append(coord_res)
        return results

    def get_coordinated_actions(self, raw_data: Dict[str, Any], scenario_params: Dict[str, Any]) -> List[Dict[str, Any]]:
        return self.coordinator.generate_coordinated_actions(raw_data, scenario_params)
