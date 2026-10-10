from typing import List, Dict, Any

def generate_cost_first_actions(scenario_params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generates actions minimizing financial expenditure while accepting moderate stockouts."""
    actions = []
    # Moderate alternate procurement via standard shipping only
    for day in [1, 2, 3, 4, 5]:
        actions.append({
            "id": f"CF-ALT-{day}",
            "day": day,
            "action_type": "PROCURE_ALTERNATE",
            "target_entity": "Bharat Silicon Corp (SUP-02)",
            "item": "Microcontroller MCU-X",
            "quantity": 120.0,
            "unit_cost": 550.0,
            "estimated_cost": 120.0 * 550.0,
            "is_expedited": False,
            "rationale": "Procure minimal MCU-X at standard freight rates to avoid premium expediting surcharges."
        })
    return actions

def generate_service_first_actions(scenario_params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generates aggressive recovery actions prioritizing zero stockouts at premium cost."""
    actions = []
    alt_cap = 300.0 * scenario_params.get("alternate_supplier_capacity_multiplier", 1.0)
    for day in [1, 2, 3, 4, 5, 6, 7]:
        # Max out alternate supplier with expedited freight
        actions.append({
            "id": f"SF-ALT-{day}",
            "day": day,
            "action_type": "PROCURE_ALTERNATE",
            "target_entity": "Bharat Silicon Corp (SUP-02)",
            "item": "Microcontroller MCU-X",
            "quantity": min(300.0, alt_cap),
            "unit_cost": 550.0,
            "estimated_cost": min(300.0, alt_cap) * (550.0 + 130.0),
            "is_expedited": True,
            "rationale": "Max out alternate supplier capacity with expedited 2-day transit to prevent stockouts."
        })
        # Full overtime every day
        actions.append({
            "id": f"SF-OT-{day}",
            "day": day,
            "action_type": "OVERTIME_PRODUCTION",
            "target_entity": "Pune Advanced Electronics MegaFactory",
            "item": "Assembly Overtime (+200 units)",
            "quantity": 200.0,
            "unit_cost": 120.0,
            "estimated_cost": 24000.0,
            "rationale": "Run full 200 units/day factory overtime to fulfill all customer backorders."
        })
    return actions

def generate_balanced_actions(scenario_params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generates balanced actions weighting service level against landed cost."""
    actions = []
    alt_cap = 300.0 * scenario_params.get("alternate_supplier_capacity_multiplier", 1.0)
    # Expedited on days 1-3 to bridge critical gap, then standard
    for day in range(1, 8):
        is_exp = (day <= 3)
        qty = min(220.0, alt_cap)
        actions.append({
            "id": f"BAL-ALT-{day}",
            "day": day,
            "action_type": "PROCURE_ALTERNATE",
            "target_entity": "Bharat Silicon Corp (SUP-02)",
            "item": "Microcontroller MCU-X",
            "quantity": qty,
            "unit_cost": 550.0,
            "estimated_cost": qty * (550.0 + (130.0 if is_exp else 55.0)),
            "is_expedited": is_exp,
            "rationale": f"Procure {qty:.0f} MCU-X with {'expedited' if is_exp else 'standard'} transit for balanced buffer."
        })
    # Overtime on days 3, 4, 5
    for day in [3, 4, 5]:
        actions.append({
            "id": f"BAL-OT-{day}",
            "day": day,
            "action_type": "OVERTIME_PRODUCTION",
            "target_entity": "Pune Advanced Electronics MegaFactory",
            "item": "Targeted Overtime",
            "quantity": 150.0,
            "unit_cost": 120.0,
            "estimated_cost": 18000.0,
            "rationale": "Targeted overtime on mid-week crunch days to recover inventory balance."
        })
    return actions

def generate_reorder_rule_actions(scenario_params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Simple (s, S) periodic reorder rule baseline blindly placing standard orders when below safety stock."""
    actions = []
    # Blind periodic review orders placed on day 1, 4 without expediting or alternate supplier ramping
    actions.append({
        "id": "RR-ORD-1",
        "day": 1,
        "action_type": "PROCURE_ALTERNATE",
        "target_entity": "Bharat Silicon Corp (SUP-02)",
        "item": "Microcontroller MCU-X",
        "quantity": 100.0,
        "unit_cost": 550.0,
        "estimated_cost": 55000.0,
        "is_expedited": False,
        "rationale": "Static reorder trigger fired at Day 1 reorder point threshold."
    })
    actions.append({
        "id": "RR-ORD-4",
        "day": 4,
        "action_type": "PROCURE_ALTERNATE",
        "target_entity": "Bharat Silicon Corp (SUP-02)",
        "item": "Microcontroller MCU-X",
        "quantity": 100.0,
        "unit_cost": 550.0,
        "estimated_cost": 55000.0,
        "is_expedited": False,
        "rationale": "Static reorder trigger fired at Day 4 reorder point threshold."
    })
    return actions
