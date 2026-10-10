from typing import List, Dict, Any

def calculate_fill_rate(total_fulfilled: float, total_demand: float) -> float:
    """Calculates order fulfillment rate as a percentage [0.0 to 100.0]."""
    if total_demand <= 0:
        return 100.0
    return round(min(100.0, max(0.0, (total_fulfilled / total_demand) * 100.0)), 2)

def calculate_recovery_time_days(daily_timeline: List[Dict[str, Any]]) -> int:
    """Calculates number of days until inventory stabilizes and daily stockout/backorder is zero."""
    for entry in daily_timeline:
        # Check from disruption onwards
        if entry.get("day", 1) >= 2 and entry.get("unfilled_demand", 0.0) == 0.0 and entry.get("backorders", 0.0) == 0.0:
            return entry.get("day", 1)
    return len(daily_timeline)  # Or horizon length if not fully recovered

def calculate_supplier_concentration(supplier_units: Dict[str, float]) -> float:
    """Calculates supplier concentration index (HHI normalized between 0.0 and 1.0)."""
    total = sum(supplier_units.values())
    if total <= 0:
        return 0.0
    shares = [qty / total for qty in supplier_units.values()]
    hhi = sum(s ** 2 for s in shares)
    return round(hhi, 3)

def calculate_inventory_days(ending_inventory: float, total_demand: float, days: int = 7) -> float:
    """Calculates days of inventory based on average daily demand."""
    avg_daily_demand = total_demand / max(1, days)
    if avg_daily_demand <= 0:
        return 0.0
    return round(ending_inventory / avg_daily_demand, 1)
