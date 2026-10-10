import time
import numpy as np
from scipy.optimize import linprog
from typing import Dict, Any, List, Tuple

class SupplyChainOptimizer:
    """Mathematical linear programming solver using SciPy for multi-period supply chain optimization."""

    def __init__(self, raw_data: Dict[str, Any]):
        self.raw_data = raw_data

    def solve(self, scenario_params: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.perf_counter()
        
        days = max(7, scenario_params.get("shutdown_duration_days", 7))
        demand_mult = scenario_params.get("demand_multiplier", 1.0)
        alt_cap_mult = scenario_params.get("alternate_supplier_capacity_multiplier", 1.0)
        trans_mult = scenario_params.get("transport_cost_multiplier", 1.0)
        inv_mult = scenario_params.get("starting_inventory_multiplier", 1.0)

        # Decision variables per day t in [0..days-1]:
        # 0: x_alt_std[t] (qty ordered from SUP-02 via standard freight)
        # 1: x_alt_exp[t] (qty ordered from SUP-02 via expedited freight)
        # 2: x_ot[t]      (overtime production units)
        # 3: x_shortage[t](aggregate unfilled demand units)
        # Total variables = 4 * days
        num_vars_per_day = 4
        num_vars = num_vars_per_day * days

        # Cost coefficients vector c
        # Standard SUP-02 cost = 550 + 55 * trans_mult
        # Expedited SUP-02 cost = 550 + 130 * trans_mult
        # Overtime unit cost = 120
        # Shortage penalty = average weighted shortage penalty ~850
        cost_std = 550.0 + 55.0 * trans_mult
        cost_exp = 550.0 + 130.0 * trans_mult
        cost_ot = 120.0
        cost_shortage = 850.0

        c = []
        bounds = []
        alt_daily_cap = 300.0 * alt_cap_mult

        for d in range(days):
            c.extend([cost_std, cost_exp, cost_ot, cost_shortage])
            # Bounds: (min, max)
            bounds.extend([
                (0.0, alt_daily_cap),  # x_alt_std
                (0.0, alt_daily_cap),  # x_alt_exp
                (0.0, 200.0),          # x_ot
                (0.0, None)            # x_shortage
            ])

        # Inequality constraints A_ub * x <= b_ub
        A_ub = []
        b_ub = []

        # 1. Daily alternate supplier total capacity: x_alt_std[t] + x_alt_exp[t] <= alt_daily_cap
        for d in range(days):
            row = [0.0] * num_vars
            row[d * num_vars_per_day + 0] = 1.0
            row[d * num_vars_per_day + 1] = 1.0
            A_ub.append(row)
            b_ub.append(alt_daily_cap)

        # 2. Demand satisfaction / shortage bounds per day
        # Daily demand requirement
        avg_daily_demand = 400.0 * demand_mult
        init_buffer = 450.0 * inv_mult

        for d in range(days):
            # cumulative available component inflow up to day d + shortage >= cumulative demand up to day d
            # Standard orders take 4 days, expedited orders take 2 days
            row = [0.0] * num_vars
            # Cumulative demand up to day d
            cum_demand_d = (d + 1) * (avg_daily_demand * 0.7) # MCU-dependent demand portion
            
            # Add expedited arrivals (placed on day k where k + 2 <= d)
            for k in range(days):
                if k + 2 <= d:
                    row[k * num_vars_per_day + 1] = -1.0
            
            # Add standard arrivals (placed on day k where k + 4 <= d)
            for k in range(days):
                if k + 4 <= d:
                    row[k * num_vars_per_day + 0] = -1.0
            
            # Add shortage variable on day d
            row[d * num_vars_per_day + 3] = -1.0

            A_ub.append(row)
            b_ub.append(init_buffer - cum_demand_d)

        # Solve using HiGHS Interior-Point / Dual-Simplex method
        res = linprog(
            c=c,
            A_ub=np.array(A_ub) if A_ub else None,
            b_ub=np.array(b_ub) if b_ub else None,
            bounds=bounds,
            method="highs"
        )

        solve_duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

        if not res.success:
            return {
                "success": False,
                "status": "INFEASIBLE",
                "message": res.message,
                "runtime_ms": solve_duration_ms,
                "actions": [],
                "objective_value": 0.0
            }

        x = res.x
        actions = []
        for d in range(days):
            std_q = round(float(x[d * num_vars_per_day + 0]), 1)
            exp_q = round(float(x[d * num_vars_per_day + 1]), 1)
            ot_q = round(float(x[d * num_vars_per_day + 2]), 1)

            if std_q > 1.0:
                actions.append({
                    "id": f"OPT-ALT-STD-{d+1}",
                    "day": d + 1,
                    "action_type": "PROCURE_ALTERNATE",
                    "target_entity": "Bharat Silicon Corp (SUP-02)",
                    "item": "Microcontroller MCU-X",
                    "quantity": std_q,
                    "unit_cost": 550.0,
                    "estimated_cost": std_q * cost_std,
                    "is_expedited": False,
                    "rationale": f"Optimal LP solver allocated {std_q} units via standard freight."
                })
            if exp_q > 1.0:
                actions.append({
                    "id": f"OPT-ALT-EXP-{d+1}",
                    "day": d + 1,
                    "action_type": "PROCURE_ALTERNATE",
                    "target_entity": "Bharat Silicon Corp (SUP-02)",
                    "item": "Microcontroller MCU-X",
                    "quantity": exp_q,
                    "unit_cost": 550.0,
                    "estimated_cost": exp_q * cost_exp,
                    "is_expedited": True,
                    "rationale": f"Optimal LP solver allocated {exp_q} units via expedited air freight."
                })
            if ot_q > 5.0:
                actions.append({
                    "id": f"OPT-OT-{d+1}",
                    "day": d + 1,
                    "action_type": "OVERTIME_PRODUCTION",
                    "target_entity": "Pune Advanced Electronics MegaFactory",
                    "item": "Assembly Overtime",
                    "quantity": ot_q,
                    "unit_cost": 120.0,
                    "estimated_cost": ot_q * cost_ot,
                    "rationale": f"Optimal LP solver allocated {ot_q} units of production overtime."
                })

        return {
            "success": True,
            "status": "OPTIMAL",
            "runtime_ms": solve_duration_ms,
            "objective_value": round(float(res.fun), 2),
            "actions": actions,
            "solver_name": "SciPy HiGHS Exact LP Solver"
        }
