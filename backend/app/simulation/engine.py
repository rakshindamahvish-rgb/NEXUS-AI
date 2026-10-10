from typing import List, Dict, Any, Optional
import copy
from app.simulation.metrics import calculate_fill_rate, calculate_recovery_time_days, calculate_supplier_concentration, calculate_inventory_days

class SimulationState:
    def __init__(self, raw_data: Dict[str, Any], scenario_params: Dict[str, Any]):
        self.suppliers = {s["id"]: copy.deepcopy(s) for s in raw_data["suppliers"]}
        self.facilities = {f["id"]: copy.deepcopy(f) for f in raw_data["facilities"]}
        self.dcs = {dc["id"]: copy.deepcopy(dc) for dc in raw_data["distribution_centers"]}
        self.products = {p["id"]: copy.deepcopy(p) for p in raw_data["products"]}
        self.boms = raw_data["bom"]
        self.routes = raw_data["routes"]
        self.baseline_demand = raw_data["baseline_demand"]
        self.inventory_records = raw_data["inventory"]
        
        self.scenario = scenario_params
        self.critical_sup_id = scenario_params.get("critical_supplier_id", 1)
        self.shutdown_days = scenario_params.get("shutdown_duration_days", 7)
        self.demand_mult = scenario_params.get("demand_multiplier", 1.0)
        self.alt_cap_mult = scenario_params.get("alternate_supplier_capacity_multiplier", 1.0)
        self.transport_mult = scenario_params.get("transport_cost_multiplier", 1.0)
        self.inv_mult = scenario_params.get("starting_inventory_multiplier", 1.0)
        self.prod_cap_reduction = scenario_params.get("production_capacity_reduction", 0.0)

        # Initialize tracking dictionaries
        self.factory_component_inv = {1: 450.0 * self.inv_mult, 3: 900.0 * self.inv_mult} # item_id: qty
        self.factory_fg_inv = {p["id"]: 100.0 * self.inv_mult for p in raw_data["products"]}
        self.dc_fg_inv = {
            1: {p["id"]: 150.0 * self.inv_mult for p in raw_data["products"]}, # DC 1
            2: {p["id"]: 120.0 * self.inv_mult for p in raw_data["products"]}  # DC 2
        }

        # Pipeline shipments in transit: list of dicts {arrival_day, destination_type, dest_id, item_type, item_id, quantity, cost}
        self.in_transit_shipments = []

class SupplyChainSimulator:
    """Multi-echelon discrete-time simulation engine over a multi-day horizon."""

    def __init__(self, raw_data: Dict[str, Any]):
        self.raw_data = raw_data

    def run_simulation(
        self,
        scenario_params: Dict[str, Any],
        strategy_actions: Optional[List[Dict[str, Any]]] = None,
        strategy_type: str = "BASELINE"
    ) -> Dict[str, Any]:
        state = SimulationState(self.raw_data, scenario_params)
        actions = strategy_actions or []
        
        days_count = max(7, state.shutdown_days)
        daily_timeline = []
        constraint_violations = []

        total_demand_all = 0.0
        total_fulfilled_all = 0.0
        total_unfilled_all = 0.0
        
        cum_proc_cost = 0.0
        cum_trans_cost = 0.0
        cum_exp_cost = 0.0
        cum_prod_cost = 0.0
        cum_hold_cost = 0.0
        cum_short_cost = 0.0

        supplier_procured_units = {1: 0.0, 2: 0.0, 3: 0.0}

        # Track backorders across products and DCs
        backorders = {1: {p_id: 0.0 for p_id in state.products}, 2: {p_id: 0.0 for p_id in state.products}}

        for day in range(1, days_count + 1):
            is_critical_disrupted = (day <= state.shutdown_days)
            
            # --- 1. PROCESS STRATEGY ACTIONS FOR THIS DAY ---
            day_actions = [a for a in actions if a.get("day") == day]
            for act in day_actions:
                act_type = act.get("action_type")
                if act_type == "PROCURE_ALTERNATE":
                    # Order from alternate supplier SUP-02 (lead time: 4 days standard, 2 days expedited)
                    qty = float(act.get("quantity", 0.0))
                    alt_cap = 300.0 * state.alt_cap_mult
                    if qty > alt_cap:
                        constraint_violations.append(f"Day {day}: Alternate procurement of {qty:.0f} units exceeds SUP-02 daily capacity of {alt_cap:.0f} units.")
                        qty = min(qty, alt_cap)
                    
                    is_expedited = act.get("is_expedited", False)
                    lead_time = 2 if is_expedited else 4
                    unit_proc_cost = 550.0
                    unit_freight = 130.0 * state.transport_mult if is_expedited else 55.0 * state.transport_mult
                    
                    p_cost = qty * unit_proc_cost
                    f_cost = qty * unit_freight
                    cum_proc_cost += p_cost
                    if is_expedited:
                        cum_exp_cost += f_cost
                    else:
                        cum_trans_cost += f_cost
                    
                    supplier_procured_units[2] += qty
                    state.in_transit_shipments.append({
                        "arrival_day": day + lead_time,
                        "dest_type": "FACILITY",
                        "dest_id": 1,
                        "item_type": "COMPONENT",
                        "item_id": 1, # MCU-X
                        "quantity": qty
                    })

                elif act_type == "EXPEDITE_SHIPPING":
                    # Expedite transit from factory to DC
                    target_dc = int(act.get("target_dc", 1))
                    qty = float(act.get("quantity", 0.0))
                    p_id = int(act.get("product_id", 1))
                    available_fg = state.factory_fg_inv.get(p_id, 0.0)
                    ship_qty = min(qty, available_fg)
                    state.factory_fg_inv[p_id] -= ship_qty
                    
                    exp_rate = 70.0 * state.transport_mult if target_dc == 1 else 90.0 * state.transport_mult
                    cum_exp_cost += ship_qty * exp_rate
                    state.in_transit_shipments.append({
                        "arrival_day": day + 1, # Next day arrival for expedited
                        "dest_type": "DC",
                        "dest_id": target_dc,
                        "item_type": "PRODUCT",
                        "item_id": p_id,
                        "quantity": ship_qty
                    })

                elif act_type == "OVERTIME_PRODUCTION":
                    # Boost production capacity
                    pass

            # --- 2. ARRIVALS OF IN-TRANSIT SHIPMENTS ---
            current_arrivals = [s for s in state.in_transit_shipments if s["arrival_day"] == day]
            state.in_transit_shipments = [s for s in state.in_transit_shipments if s["arrival_day"] > day]
            
            for arr in current_arrivals:
                if arr["dest_type"] == "FACILITY" and arr["item_type"] == "COMPONENT":
                    state.factory_component_inv[arr["item_id"]] = state.factory_component_inv.get(arr["item_id"], 0.0) + arr["quantity"]
                elif arr["dest_type"] == "DC" and arr["item_type"] == "PRODUCT":
                    dc_id = arr["dest_id"]
                    p_id = arr["item_id"]
                    state.dc_fg_inv[dc_id][p_id] += arr["quantity"]

            # Standard steady replenishment from non-disrupted suppliers (SUP-03 Zenith PowerTech)
            # SUP-03 delivers 400 PM-A components daily
            state.factory_component_inv[3] = state.factory_component_inv.get(3, 0.0) + 400.0
            cum_proc_cost += 400.0 * 320.0
            cum_trans_cost += 400.0 * 35.0 * state.transport_mult
            supplier_procured_units[3] += 400.0

            # If SUP-01 not disrupted, it delivers 300 MCU-X daily
            if not is_critical_disrupted:
                state.factory_component_inv[1] = state.factory_component_inv.get(1, 0.0) + 300.0
                cum_proc_cost += 300.0 * 450.0
                cum_trans_cost += 300.0 * 40.0 * state.transport_mult
                supplier_procured_units[1] += 300.0

            # --- 3. PRODUCTION EXECUTION ---
            # Max capacity considering reduction
            base_fac_cap = 600.0 * (1.0 - state.prod_cap_reduction)
            overtime_cap = 200.0 if any(a.get("action_type") == "OVERTIME_PRODUCTION" and a.get("day") == day for a in actions) else 0.0
            total_fac_cap = base_fac_cap + overtime_cap
            
            day_produced_units = 0.0
            
            # Prioritize production based on product margins/shortage penalty
            # PRD-02 (High penalty ₹1500), PRD-01 (₹800), PRD-03 (₹600), PRD-04 (₹400, no MCU-X needed!)
            production_order = [2, 1, 3, 4]
            for p_id in production_order:
                if day_produced_units >= total_fac_cap:
                    break
                
                # Check BOM requirement
                # PRD-01: 1 MCU-X, 1 PM-A; PRD-02: 2 MCU-X, 1 PM-A; PRD-03: 1 MCU-X, 1 PM-A; PRD-04: 0 MCU-X, 2 PM-A
                mcu_req = 2.0 if p_id == 2 else (0.0 if p_id == 4 else 1.0)
                pm_req = 2.0 if p_id == 4 else 1.0

                avail_mcu = state.factory_component_inv.get(1, 0.0)
                avail_pm = state.factory_component_inv.get(3, 0.0)

                max_by_mcu = avail_mcu / mcu_req if mcu_req > 0 else 99999.0
                max_by_pm = avail_pm / pm_req
                max_by_cap = total_fac_cap - day_produced_units
                
                target_prod = 140.0 if p_id in [1, 4] else 90.0
                actual_prod = min(target_prod, max_by_mcu, max_by_pm, max_by_cap)
                actual_prod = max(0.0, actual_prod)

                if actual_prod > 0:
                    state.factory_component_inv[1] = max(0.0, state.factory_component_inv.get(1, 0.0) - actual_prod * mcu_req)
                    state.factory_component_inv[3] = max(0.0, state.factory_component_inv.get(3, 0.0) - actual_prod * pm_req)
                    state.factory_fg_inv[p_id] += actual_prod
                    day_produced_units += actual_prod

                    unit_prod_cost = 80.0
                    if day_produced_units > base_fac_cap:
                        unit_prod_cost = 120.0 # Overtime rate
                    cum_prod_cost += actual_prod * unit_prod_cost

            # --- 4. FACTORY TO DC STANDARD SHIPPING ---
            # Dispatch finished goods to DC-01 (60%) and DC-02 (40%)
            for p_id in state.products:
                avail_fg = state.factory_fg_inv[p_id]
                if avail_fg > 0:
                    ship_dc1 = avail_fg * 0.55
                    ship_dc2 = avail_fg * 0.45
                    state.factory_fg_inv[p_id] = 0.0 # Dispatched
                    
                    state.in_transit_shipments.append({
                        "arrival_day": day + 1,
                        "dest_type": "DC",
                        "dest_id": 1,
                        "item_type": "PRODUCT",
                        "item_id": p_id,
                        "quantity": ship_dc1
                    })
                    state.in_transit_shipments.append({
                        "arrival_day": day + 2,
                        "dest_type": "DC",
                        "dest_id": 2,
                        "item_type": "PRODUCT",
                        "item_id": p_id,
                        "quantity": ship_dc2
                    })
                    cum_trans_cost += (ship_dc1 * 25.0 + ship_dc2 * 35.0) * state.transport_mult

            # --- 5. DC DEMAND FULFILLMENT & SHORTAGE PENALTIES ---
            day_demand = 0.0
            day_fulfilled = 0.0
            day_unfilled = 0.0
            day_shortage_cost = 0.0
            
            # Retrieve baseline demand for day
            day_demands = [d for d in state.baseline_demand if d["day"] == day]
            for dem in day_demands:
                p_id = dem["product_id"]
                dc_id = dem["dc_id"]
                req_qty = dem["quantity"] * state.demand_mult
                day_demand += req_qty
                
                total_req = req_qty + backorders[dc_id][p_id]
                avail_dc_stock = state.dc_fg_inv[dc_id][p_id]
                
                fulfilled = min(total_req, avail_dc_stock)
                unfilled = total_req - fulfilled
                
                state.dc_fg_inv[dc_id][p_id] = max(0.0, avail_dc_stock - fulfilled)
                backorders[dc_id][p_id] = unfilled

                day_fulfilled += fulfilled
                day_unfilled += unfilled

                # Shortage penalty
                penalty_per_unit = state.products[p_id]["shortage_penalty_per_day"]
                cost_penalty = unfilled * penalty_per_unit
                day_shortage_cost += cost_penalty

            cum_short_cost += day_shortage_cost
            total_demand_all += day_demand
            total_fulfilled_all += day_fulfilled
            total_unfilled_all += day_unfilled

            # --- 6. HOLDING COSTS ---
            day_hold_cost = 0.0
            # Component holding at factory
            day_hold_cost += sum(state.factory_component_inv.values()) * 5.0
            # FG holding at factory
            day_hold_cost += sum(state.factory_fg_inv.values()) * 15.0
            # FG holding at DCs
            day_hold_cost += sum(sum(p_stock.values()) for p_stock in state.dc_fg_inv.values()) * 10.0
            cum_hold_cost += day_hold_cost

            # Cumulative total cost up to today
            day_total_cost = cum_proc_cost + cum_trans_cost + cum_exp_cost + cum_prod_cost + cum_hold_cost + cum_short_cost
            total_active_backorders = sum(sum(dc_b.values()) for dc_b in backorders.values())
            total_ending_inv = sum(sum(p_stock.values()) for p_stock in state.dc_fg_inv.values()) + sum(state.factory_fg_inv.values())

            daily_timeline.append({
                "day": day,
                "demand": round(day_demand, 1),
                "starting_inventory": round(total_ending_inv + day_fulfilled, 1),
                "units_produced": round(day_produced_units, 1),
                "units_received": round(day_produced_units, 1),
                "units_shipped": round(day_produced_units, 1),
                "units_fulfilled": round(day_fulfilled, 1),
                "unfilled_demand": round(day_unfilled, 1),
                "ending_inventory": round(total_ending_inv, 1),
                "backorders": round(total_active_backorders, 1),
                "daily_cost": round(day_total_cost - (daily_timeline[-1]["cumulative_cost"] if daily_timeline else 0.0), 2),
                "cumulative_cost": round(day_total_cost, 2),
                "active_disruption": is_critical_disrupted
            })

        # Calculate final aggregated metrics
        fill_rate = calculate_fill_rate(total_fulfilled_all, total_demand_all)
        recovery_days = calculate_recovery_time_days(daily_timeline)
        supplier_conc = calculate_supplier_concentration(supplier_procured_units)
        inventory_days = calculate_inventory_days(daily_timeline[-1]["ending_inventory"], total_demand_all, days_count)

        total_landed_cost = round(cum_proc_cost + cum_trans_cost + cum_exp_cost + cum_prod_cost + cum_hold_cost + cum_short_cost, 2)

        return {
            "strategy_type": strategy_type,
            "total_cost": total_landed_cost,
            "fill_rate": fill_rate,
            "backorders": round(sum(sum(dc_b.values()) for dc_b in backorders.values()), 1),
            "unfilled_demand": round(total_unfilled_all, 1),
            "demand_fulfilled": round(total_fulfilled_all, 1),
            "ending_inventory": round(daily_timeline[-1]["ending_inventory"], 1),
            "recovery_time_days": recovery_days,
            "procurement_cost": round(cum_proc_cost, 2),
            "transport_cost": round(cum_trans_cost, 2),
            "expediting_cost": round(cum_exp_cost, 2),
            "production_cost": round(cum_prod_cost, 2),
            "holding_cost": round(cum_hold_cost, 2),
            "shortage_cost": round(cum_short_cost, 2),
            "supplier_concentration": supplier_conc,
            "inventory_days": inventory_days,
            "daily_timeline": daily_timeline,
            "constraint_violations": constraint_violations
        }
