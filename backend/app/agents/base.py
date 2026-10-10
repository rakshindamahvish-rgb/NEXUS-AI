from typing import Dict, Any, List
import time

class BaseAgent:
    def __init__(self, name: str, role: str):
        self.name = name
        self.role = role

    def run(self, raw_data: Dict[str, Any], scenario_params: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.perf_counter()
        output = self.analyze(raw_data, scenario_params)
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        output["execution_time_ms"] = max(duration_ms, 1.2)
        output["agent_name"] = self.name
        output["agent_role"] = self.role
        return output

    def analyze(self, raw_data: Dict[str, Any], scenario_params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError
