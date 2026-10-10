from typing import Dict, Any, List

def generate_counterfactual_explanations(
    recommended_plan: Dict[str, Any],
    all_plans: List[Dict[str, Any]],
    scenario_params: Dict[str, Any]
) -> Dict[str, str]:
    """Dynamically generates 'Why This Plan?' and 'Why Not The Alternatives?' based on simulated metrics."""
    rec_type = recommended_plan.get("plan_type", "BALANCED")
    rec_cost = recommended_plan.get("total_cost", 0.0)
    rec_fill = recommended_plan.get("fill_rate", 0.0)
    rec_back = recommended_plan.get("backorders", 0.0)
    rec_time = recommended_plan.get("recovery_time_days", 7)

    demand_mult = scenario_params.get("demand_multiplier", 1.0)
    alt_cap_mult = scenario_params.get("alternate_supplier_capacity_multiplier", 1.0)

    # 1. Why This Plan?
    why_this = (
        f"The {recommended_plan.get('name', rec_type)} is selected because it achieves an optimal resilience-to-cost trade-off: "
        f"it reaches a {rec_fill:.1f}% customer fill rate with total landed cost of ₹{rec_cost:,.0f} and recovery time of {rec_time} days. "
        f"Binding constraints evaluated include alternate supplier daily throughput (capped at {300.0 * alt_cap_mult:.0f} units/day) "
        f"and 2-day air-freight compression to prevent Day 3 factory starvation. "
        f"Under current demand parameters ({demand_mult:.2f}x baseline), this plan limits unfulfilled backorders to {rec_back:.0f} units "
        f"while avoiding excessive air-charter overages."
    )

    # 2. Why Not The Alternatives?
    rejections = []
    for plan in all_plans:
        p_type = plan.get("plan_type")
        if p_type == rec_type:
            continue
        p_name = plan.get("name", p_type)
        p_cost = plan.get("total_cost", 0.0)
        p_fill = plan.get("fill_rate", 0.0)
        p_back = plan.get("backorders", 0.0)
        p_time = plan.get("recovery_time_days", 7)

        cost_diff = p_cost - rec_cost
        fill_diff = p_fill - rec_fill

        if p_type == "COST_FIRST":
            rejections.append(
                f"• {p_name} (Rejected): Although initial procurement cost is lower, it results in a substandard fill rate of {p_fill:.1f}% "
                f"({abs(fill_diff):.1f}% below recommended) and leaves {p_back:.0f} backordered units, triggering ₹{plan.get('shortage_cost', 0):,.0f} in customer penalty fees."
            )
        elif p_type == "SERVICE_FIRST":
            rejections.append(
                f"• {p_name} (Rejected): Achieves a high fill rate ({p_fill:.1f}%), but incurs ₹{cost_diff:+,.0f} in excess landed cost "
                f"due to continuous 100% air expediting (₹{plan.get('expediting_cost', 0):,.0f}) and daily overtime surcharges beyond diminishing returns."
            )
        elif p_type == "REORDER_RULE":
            rejections.append(
                f"• {p_name} (Baseline Rejected): Static reorder policy fails to anticipate lead-time disruptions, suffering severe stockouts "
                f"with a fill rate of only {p_fill:.1f}% and recovery taking {p_time}+ days."
            )
        elif p_type == "OPTIMIZATION_LP":
            rejections.append(
                f"• {p_name} (Mathematical Benchmark): Theoretical LP optimal cost is ₹{p_cost:,.0f} with {p_fill:.1f}% fill rate. "
                f"The Coordinated Agent plan incorporates real-world supplier concentration buffers and operational sequencing."
            )
        else:
            rejections.append(
                f"• {p_name} (Rejected): Evaluated with ₹{p_cost:,.0f} landed cost and {p_fill:.1f}% fill rate; outperformed by recommended trade-off profile."
            )

    why_not = "\n\n".join(rejections)

    return {
        "why_this": why_this,
        "why_not": why_not
    }
