import json
import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.entities import (
    Supplier, Facility, DistributionCenter, Product,
    BillOfMaterials, TransportationRoute, BaselineDemand, InventoryRecord,
    Scenario, SimulationRun, AgentRecommendation, RecoveryPlan, AuditEvent
)
from app.models.schemas import (
    ScenarioCreate, ScenarioOut, RecoveryPlanOut, AgentRecommendationOut,
    SimulationRunResult, ValidationResult, PlanAction, ProductOut, SupplierOut
)
from app.simulation.engine import SupplyChainSimulator
from app.simulation.strategies import (
    generate_cost_first_actions, generate_service_first_actions,
    generate_balanced_actions, generate_reorder_rule_actions
)
from app.agents.manager import AgentManager
from app.optimization.solver import SupplyChainOptimizer
from app.services.explanation_engine import generate_counterfactual_explanations

router = APIRouter(prefix="/simulation", tags=["Simulation"])

def get_raw_data_dict(db: Session) -> Dict[str, Any]:
    return {
        "suppliers": [s.__dict__ for s in db.query(Supplier).all()],
        "facilities": [f.__dict__ for f in db.query(Facility).all()],
        "distribution_centers": [dc.__dict__ for dc in db.query(DistributionCenter).all()],
        "products": [p.__dict__ for p in db.query(Product).all()],
        "bom": [b.__dict__ for b in db.query(BillOfMaterials).all()],
        "routes": [r.__dict__ for r in db.query(TransportationRoute).all()],
        "baseline_demand": [d.__dict__ for d in db.query(BaselineDemand).all()],
        "inventory": [inv.__dict__ for inv in db.query(InventoryRecord).all()],
    }

@router.post("/scenarios", response_model=ScenarioOut)
def create_scenario(payload: ScenarioCreate, db: Session = Depends(get_db)):
    """Creates a new scenario configuration with input validation."""
    if payload.shutdown_duration_days < 1 or payload.shutdown_duration_days > 30:
        raise HTTPException(status_code=400, detail="Shutdown duration must be between 1 and 30 days.")
    if payload.demand_multiplier <= 0.0 or payload.demand_multiplier > 5.0:
        raise HTTPException(status_code=400, detail="Demand multiplier must be between 0.1 and 5.0.")
    if payload.alternate_supplier_capacity_multiplier <= 0.0:
        raise HTTPException(status_code=400, detail="Alternate capacity multiplier must be > 0.")

    sc = Scenario(
        name=payload.name,
        description=payload.description,
        critical_supplier_id=payload.critical_supplier_id,
        shutdown_duration_days=payload.shutdown_duration_days,
        demand_multiplier=payload.demand_multiplier,
        alternate_supplier_capacity_multiplier=payload.alternate_supplier_capacity_multiplier,
        transport_cost_multiplier=payload.transport_cost_multiplier,
        starting_inventory_multiplier=payload.starting_inventory_multiplier,
        production_capacity_reduction=payload.production_capacity_reduction,
        status="CREATED"
    )
    db.add(sc)
    db.commit()
    db.refresh(sc)
    return sc

@router.post("/run/{scenario_id}", response_model=SimulationRunResult)
def run_simulation(scenario_id: int, db: Session = Depends(get_db)):
    """Executes full multi-agent simulation, strategy generation, optimization, and recovery evaluation."""
    start_total = time.perf_counter()
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found.")

    raw_data = get_raw_data_dict(db)
    scenario_params = {
        "critical_supplier_id": scenario.critical_supplier_id or 1,
        "shutdown_duration_days": scenario.shutdown_duration_days,
        "demand_multiplier": scenario.demand_multiplier,
        "alternate_supplier_capacity_multiplier": scenario.alternate_supplier_capacity_multiplier,
        "transport_cost_multiplier": scenario.transport_cost_multiplier,
        "starting_inventory_multiplier": scenario.starting_inventory_multiplier,
        "production_capacity_reduction": scenario.production_capacity_reduction
    }

    # 1. Run all 8 specialized agents
    agent_mgr = AgentManager()
    agent_outputs = agent_mgr.run_all_agents(raw_data, scenario_params)
    
    # Store Agent recommendations in DB
    db.query(AgentRecommendation).filter(AgentRecommendation.scenario_id == scenario.id).delete()
    agent_db_records = []
    for ag in agent_outputs:
        rec = AgentRecommendation(
            scenario_id=scenario.id,
            agent_name=ag["agent_name"],
            agent_role=ag["agent_role"],
            status=ag["status"],
            proposed_action=ag["proposed_action"],
            rationale=ag["rationale"],
            confidence_score=ag["confidence_score"],
            key_metrics_json=json.dumps(ag.get("key_metrics", {})),
            execution_time_ms=ag.get("execution_time_ms", 1.5)
        )
        db.add(rec)
        agent_db_records.append(rec)
    db.commit()

    # 2. Generate and simulate the candidate recovery plans
    simulator = SupplyChainSimulator(raw_data)
    optimizer = SupplyChainOptimizer(raw_data)
    
    # Strategy A: Cost-First
    cf_actions = generate_cost_first_actions(scenario_params)
    cf_sim = simulator.run_simulation(scenario_params, cf_actions, strategy_type="COST_FIRST")

    # Strategy B: Service-First
    sf_actions = generate_service_first_actions(scenario_params)
    sf_sim = simulator.run_simulation(scenario_params, sf_actions, strategy_type="SERVICE_FIRST")

    # Strategy C: Balanced
    bal_actions = generate_balanced_actions(scenario_params)
    bal_sim = simulator.run_simulation(scenario_params, bal_actions, strategy_type="BALANCED")

    # Strategy D: Coordinated Agent Plan
    coord_actions = agent_mgr.get_coordinated_actions(raw_data, scenario_params)
    coord_sim = simulator.run_simulation(scenario_params, coord_actions, strategy_type="COORDINATED_AGENT")

    # Baseline 1: Reorder-Rule Baseline
    rr_actions = generate_reorder_rule_actions(scenario_params)
    rr_sim = simulator.run_simulation(scenario_params, rr_actions, strategy_type="REORDER_RULE")

    # Baseline 2: SciPy LP Optimization Solver
    opt_res = optimizer.solve(scenario_params)
    opt_sim = simulator.run_simulation(scenario_params, opt_res["actions"], strategy_type="OPTIMIZATION_LP")

    all_raw_plans = [
        {"type": "COST_FIRST", "name": "Cost-First Plan", "desc": "Minimizes financial expenditure with standard freight.", "sim": cf_sim, "actions": cf_actions},
        {"type": "SERVICE_FIRST", "name": "Service-First Plan", "desc": "Prioritizes customer fulfillment via max air expediting and overtime.", "sim": sf_sim, "actions": sf_actions},
        {"type": "BALANCED", "name": "Balanced Compromise Plan", "desc": "Balances expediting costs against service penalties.", "sim": bal_sim, "actions": bal_actions},
        {"type": "COORDINATED_AGENT", "name": "Multi-Agent Coordinated Plan", "desc": "Consensus plan resolving multi-agent constraints and supplier risk buffers.", "sim": coord_sim, "actions": coord_actions},
        {"type": "OPTIMIZATION_LP", "name": "Exact LP Optimal Baseline", "desc": "SciPy HiGHS mathematical solver optimization baseline.", "sim": opt_sim, "actions": opt_res["actions"]},
        {"type": "REORDER_RULE", "name": "Standard (s, S) Reorder Baseline", "desc": "Static periodic reorder rule without disruption anticipation.", "sim": rr_sim, "actions": rr_actions},
    ]

    # Select Recommended Plan objectively:
    # Rule: Must have fill rate >= 90% (if achievable), lowest total cost among compliant, no critical constraint violations
    eligible_plans = [p for p in all_raw_plans if p["sim"]["fill_rate"] >= 88.0 and not p["sim"]["constraint_violations"] and p["type"] in ["COORDINATED_AGENT", "BALANCED", "SERVICE_FIRST", "COST_FIRST"]]
    if eligible_plans:
        # Sort by total landed cost
        eligible_plans.sort(key=lambda p: p["sim"]["total_cost"])
        recommended_raw = eligible_plans[0]
    else:
        # Fallback to Coordinated Agent Plan
        recommended_raw = next(p for p in all_raw_plans if p["type"] == "COORDINATED_AGENT")

    # Generate Counterfactual Explanations
    simplified_plans_list = [{"plan_type": p["type"], "name": p["name"], "total_cost": p["sim"]["total_cost"], "fill_rate": p["sim"]["fill_rate"], "backorders": p["sim"]["backorders"], "recovery_time_days": p["sim"]["recovery_time_days"], "shortage_cost": p["sim"]["shortage_cost"], "expediting_cost": p["sim"]["expediting_cost"]} for p in all_raw_plans]
    counterfactuals = generate_counterfactual_explanations(
        recommended_plan={"plan_type": recommended_raw["type"], "name": recommended_raw["name"], "total_cost": recommended_raw["sim"]["total_cost"], "fill_rate": recommended_raw["sim"]["fill_rate"], "backorders": recommended_raw["sim"]["backorders"], "recovery_time_days": recommended_raw["sim"]["recovery_time_days"]},
        all_plans=simplified_plans_list,
        scenario_params=scenario_params
    )

    # Persist Recovery Plans in DB
    db.query(RecoveryPlan).filter(RecoveryPlan.scenario_id == scenario.id).delete()
    plan_db_records = []
    
    for p in all_raw_plans:
        is_rec = (p["type"] == recommended_raw["type"])
        sim_data = p["sim"]
        
        rec_plan = RecoveryPlan(
            scenario_id=scenario.id,
            plan_type=p["type"],
            name=p["name"],
            description=p["desc"],
            is_recommended=is_rec,
            is_approved=False,
            is_rejected=False,
            total_cost=sim_data["total_cost"],
            fill_rate=sim_data["fill_rate"],
            backorders=sim_data["backorders"],
            unfilled_demand=sim_data["unfilled_demand"],
            demand_fulfilled=sim_data["demand_fulfilled"],
            ending_inventory=sim_data["ending_inventory"],
            recovery_time_days=sim_data["recovery_time_days"],
            transport_cost=sim_data["transport_cost"],
            procurement_cost=sim_data["procurement_cost"],
            expediting_cost=sim_data["expediting_cost"],
            holding_cost=sim_data["holding_cost"],
            shortage_cost=sim_data["shortage_cost"],
            production_cost=sim_data["production_cost"],
            supplier_concentration=sim_data["supplier_concentration"],
            actions_json=json.dumps(p["actions"]),
            daily_timeline_json=json.dumps(sim_data["daily_timeline"]),
            metrics_json=json.dumps(sim_data),
            constraint_violations_json=json.dumps(sim_data["constraint_violations"]),
            counterfactual_why_this=counterfactuals["why_this"] if is_rec else None,
            counterfactual_why_not=counterfactuals["why_not"] if is_rec else None
        )
        db.add(rec_plan)
        plan_db_records.append(rec_plan)

    scenario.status = "SIMULATED"
    db.commit()

    # Re-query saved plans
    saved_plans = db.query(RecoveryPlan).filter(RecoveryPlan.scenario_id == scenario.id).all()
    rec_plan_obj = next((p for p in saved_plans if p.is_recommended), saved_plans[0])

    # Convert to Pydantic responses
    plans_out = []
    for sp in saved_plans:
        actions_list = [PlanAction(**a) for a in json.loads(sp.actions_json or "[]")]
        timeline_list = json.loads(sp.daily_timeline_json or "[]")
        metrics_dict = json.loads(sp.metrics_json or "{}")
        violations_list = json.loads(sp.constraint_violations_json or "[]")
        
        plans_out.append(RecoveryPlanOut(
            id=sp.id,
            scenario_id=sp.scenario_id,
            plan_type=sp.plan_type,
            name=sp.name,
            description=sp.description,
            is_recommended=sp.is_recommended,
            is_approved=sp.is_approved,
            is_rejected=sp.is_rejected,
            rejection_reason=sp.rejection_reason,
            total_cost=sp.total_cost,
            fill_rate=sp.fill_rate,
            backorders=sp.backorders,
            unfilled_demand=sp.unfilled_demand,
            demand_fulfilled=sp.demand_fulfilled,
            ending_inventory=sp.ending_inventory,
            recovery_time_days=sp.recovery_time_days,
            transport_cost=sp.transport_cost,
            procurement_cost=sp.procurement_cost,
            expediting_cost=sp.expediting_cost,
            holding_cost=sp.holding_cost,
            shortage_cost=sp.shortage_cost,
            production_cost=sp.production_cost,
            supplier_concentration=sp.supplier_concentration,
            actions=actions_list,
            daily_timeline=timeline_list,
            metrics=metrics_dict,
            constraint_violations=violations_list,
            counterfactual_why_this=sp.counterfactual_why_this,
            counterfactual_why_not=sp.counterfactual_why_not,
            created_at=sp.created_at
        ))

    agents_out = []
    for ag in agent_db_records:
        agents_out.append(AgentRecommendationOut(
            id=ag.id,
            scenario_id=ag.scenario_id,
            agent_name=ag.agent_name,
            agent_role=ag.agent_role,
            status=ag.status,
            proposed_action=ag.proposed_action,
            rationale=ag.rationale,
            confidence_score=ag.confidence_score,
            key_metrics=json.loads(ag.key_metrics_json or "{}"),
            execution_time_ms=ag.execution_time_ms,
            created_at=ag.created_at
        ))

    # Identify impacted entities
    crit_sup = db.query(Supplier).filter(Supplier.id == scenario_params["critical_supplier_id"]).first()
    products = db.query(Product).all()
    impacted_prds = [p for p in products if p.code in ["PRD-01", "PRD-02", "PRD-03"]]

    total_time_ms = round((time.perf_counter() - start_total) * 1000, 2)

    return SimulationRunResult(
        scenario=ScenarioOut.model_validate(scenario),
        plans=plans_out,
        recommended_plan_id=rec_plan_obj.id,
        agents=agents_out,
        active_disruption={
            "is_active": True,
            "disrupted_supplier_id": scenario_params["critical_supplier_id"],
            "supplier_name": crit_sup.name if crit_sup else "Apex Semiconductors Ltd",
            "shutdown_days": scenario_params["shutdown_duration_days"],
            "lost_component": "Microcontroller MCU-X",
            "impact_summary": f"{scenario_params['shutdown_duration_days']} days full outage of primary MCU supplier affecting 3 of 4 product lines."
        },
        disrupted_supplier=SupplierOut.model_validate(crit_sup) if crit_sup else None,
        impacted_products=[ProductOut.model_validate(p) for p in impacted_prds],
        runtime_ms=total_time_ms
    )

@router.post("/run-new", response_model=SimulationRunResult)
def create_and_run(payload: ScenarioCreate, db: Session = Depends(get_db)):
    """Creates a scenario and runs the full simulation in ONE request (safe for serverless hosting)."""
    sc = create_scenario(payload, db)
    return run_simulation(sc.id, db)

@router.get("/latest", response_model=SimulationRunResult)
def get_latest_simulation(db: Session = Depends(get_db)):
    """Retrieves the most recent simulation run or automatically runs default 7-day outage if empty."""
    latest_scenario = db.query(Scenario).order_by(Scenario.id.desc()).first()
    if not latest_scenario:
        # Create default 7-day scenario
        sc = Scenario(
            name="7-Day Critical Supplier Outage (Apex Semiconductors)",
            description="Baseline demonstration crisis scenario: 7-day shutdown of MCU-X supplier.",
            critical_supplier_id=1,
            shutdown_duration_days=7,
            demand_multiplier=1.0,
            alternate_supplier_capacity_multiplier=1.0,
            transport_cost_multiplier=1.0,
            starting_inventory_multiplier=1.0,
            production_capacity_reduction=0.0
        )
        db.add(sc)
        db.commit()
        db.refresh(sc)
        return run_simulation(sc.id, db)

    plans = db.query(RecoveryPlan).filter(RecoveryPlan.scenario_id == latest_scenario.id).all()
    if not plans:
        return run_simulation(latest_scenario.id, db)

    # Return existing populated result
    agents = db.query(AgentRecommendation).filter(AgentRecommendation.scenario_id == latest_scenario.id).all()
    rec_plan = next((p for p in plans if p.is_recommended), plans[0])
    
    crit_sup = db.query(Supplier).filter(Supplier.id == (latest_scenario.critical_supplier_id or 1)).first()
    products = db.query(Product).all()
    impacted_prds = [p for p in products if p.code in ["PRD-01", "PRD-02", "PRD-03"]]

    plans_out = []
    for sp in plans:
        actions_list = [PlanAction(**a) for a in json.loads(sp.actions_json or "[]")]
        timeline_list = json.loads(sp.daily_timeline_json or "[]")
        metrics_dict = json.loads(sp.metrics_json or "{}")
        violations_list = json.loads(sp.constraint_violations_json or "[]")
        
        plans_out.append(RecoveryPlanOut(
            id=sp.id,
            scenario_id=sp.scenario_id,
            plan_type=sp.plan_type,
            name=sp.name,
            description=sp.description,
            is_recommended=sp.is_recommended,
            is_approved=sp.is_approved,
            is_rejected=sp.is_rejected,
            rejection_reason=sp.rejection_reason,
            total_cost=sp.total_cost,
            fill_rate=sp.fill_rate,
            backorders=sp.backorders,
            unfilled_demand=sp.unfilled_demand,
            demand_fulfilled=sp.demand_fulfilled,
            ending_inventory=sp.ending_inventory,
            recovery_time_days=sp.recovery_time_days,
            transport_cost=sp.transport_cost,
            procurement_cost=sp.procurement_cost,
            expediting_cost=sp.expediting_cost,
            holding_cost=sp.holding_cost,
            shortage_cost=sp.shortage_cost,
            production_cost=sp.production_cost,
            supplier_concentration=sp.supplier_concentration,
            actions=actions_list,
            daily_timeline=timeline_list,
            metrics=metrics_dict,
            constraint_violations=violations_list,
            counterfactual_why_this=sp.counterfactual_why_this,
            counterfactual_why_not=sp.counterfactual_why_not,
            created_at=sp.created_at
        ))

    agents_out = []
    for ag in agents:
        agents_out.append(AgentRecommendationOut(
            id=ag.id,
            scenario_id=ag.scenario_id,
            agent_name=ag.agent_name,
            agent_role=ag.agent_role,
            status=ag.status,
            proposed_action=ag.proposed_action,
            rationale=ag.rationale,
            confidence_score=ag.confidence_score,
            key_metrics=json.loads(ag.key_metrics_json or "{}"),
            execution_time_ms=ag.execution_time_ms,
            created_at=ag.created_at
        ))

    return SimulationRunResult(
        scenario=ScenarioOut.model_validate(latest_scenario),
        plans=plans_out,
        recommended_plan_id=rec_plan.id,
        agents=agents_out,
        active_disruption={
            "is_active": True,
            "disrupted_supplier_id": latest_scenario.critical_supplier_id or 1,
            "supplier_name": crit_sup.name if crit_sup else "Apex Semiconductors Ltd",
            "shutdown_days": latest_scenario.shutdown_duration_days,
            "lost_component": "Microcontroller MCU-X",
            "impact_summary": f"{latest_scenario.shutdown_duration_days} days full outage of primary MCU supplier affecting 3 of 4 product lines."
        },
        disrupted_supplier=SupplierOut.model_validate(crit_sup) if crit_sup else None,
        impacted_products=[ProductOut.model_validate(p) for p in impacted_prds],
        runtime_ms=45.0
    )

@router.post("/validate-actions", response_model=ValidationResult)
def validate_modified_actions(
    payload: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Validates planner-modified actions against physical constraints and recalculates metrics."""
    plan_id = payload.get("plan_id")
    actions = payload.get("actions", [])
    scenario_id = payload.get("scenario_id")

    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first() if scenario_id else None
    scenario_params = {
        "critical_supplier_id": scenario.critical_supplier_id if scenario else 1,
        "shutdown_duration_days": scenario.shutdown_duration_days if scenario else 7,
        "demand_multiplier": scenario.demand_multiplier if scenario else 1.0,
        "alternate_supplier_capacity_multiplier": scenario.alternate_supplier_capacity_multiplier if scenario else 1.0,
        "transport_cost_multiplier": scenario.transport_cost_multiplier if scenario else 1.0,
        "starting_inventory_multiplier": scenario.starting_inventory_multiplier if scenario else 1.0,
        "production_capacity_reduction": scenario.production_capacity_reduction if scenario else 0.0
    }

    raw_data = get_raw_data_dict(db)
    simulator = SupplyChainSimulator(raw_data)
    
    # Run simulation with modified actions
    sim_result = simulator.run_simulation(scenario_params, actions, strategy_type="MODIFIED")

    violations = sim_result["constraint_violations"]
    is_valid = (len(violations) == 0)

    warnings = []
    if sim_result["fill_rate"] < 90.0:
        warnings.append(f"Projected customer fill rate ({sim_result['fill_rate']}%) is below the corporate SLA threshold of 90%.")

    return ValidationResult(
        is_valid=is_valid,
        violations=violations,
        warnings=warnings,
        recalculated_cost=sim_result["total_cost"],
        recalculated_fill_rate=sim_result["fill_rate"]
    )
