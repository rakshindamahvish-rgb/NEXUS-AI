import json
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.entities import (
    RecoveryPlan, PlannerDecision, AuditEvent, Scenario
)
from app.models.schemas import (
    PlanDecisionCreate, PlanDecisionOut, AuditEventOut, RecoveryPlanOut, PlanAction
)
from app.simulation.engine import SupplyChainSimulator

router = APIRouter(prefix="/governance", tags=["Governance & Approval"])

@router.post("/decide", response_model=PlanDecisionOut)
def record_planner_decision(payload: PlanDecisionCreate, db: Session = Depends(get_db)):
    """Records a formal human planner decision (APPROVE, REJECT, MODIFY) with audit trail."""
    plan = db.query(RecoveryPlan).filter(RecoveryPlan.id == payload.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Recovery plan not found.")

    scenario = db.query(Scenario).filter(Scenario.id == plan.scenario_id).first()
    dec_type = payload.decision_type.upper()

    if dec_type == "APPROVED":
        # Mandatory constraint safety check before approval
        violations = json.loads(plan.constraint_violations_json or "[]")
        if violations:
            raise HTTPException(
                status_code=400,
                detail=f"Safety Guardrail Error: Cannot approve a plan with {len(violations)} constraint violations: {', '.join(violations)}"
            )

        # Reset other approved plans in this scenario
        db.query(RecoveryPlan).filter(RecoveryPlan.scenario_id == plan.scenario_id).update({"is_approved": False, "is_rejected": False})
        plan.is_approved = True
        plan.is_rejected = False

        audit_msg = f"Plan '{plan.name}' (ID {plan.id}) formally APPROVED by supply chain planner. Total landed cost: ₹{plan.total_cost:,.2f}, Fill rate: {plan.fill_rate}%."

    elif dec_type == "REJECTED":
        plan.is_approved = False
        plan.is_rejected = True
        plan.rejection_reason = payload.rejection_reason or "Rejected by planner"
        audit_msg = f"Plan '{plan.name}' (ID {plan.id}) REJECTED. Reason: {plan.rejection_reason}"

    elif dec_type == "MODIFIED":
        # Update plan actions and recalculate
        if payload.modified_actions:
            actions_dicts = [a.model_dump() for a in payload.modified_actions]
            plan.actions_json = json.dumps(actions_dicts)
            
            # Recalculate metrics
            from app.api.routes_simulation import get_raw_data_dict
            raw_data = get_raw_data_dict(db)
            scenario_params = {
                "critical_supplier_id": scenario.critical_supplier_id if scenario else 1,
                "shutdown_duration_days": scenario.shutdown_duration_days if scenario else 7,
                "demand_multiplier": scenario.demand_multiplier if scenario else 1.0,
                "alternate_supplier_capacity_multiplier": scenario.alternate_supplier_capacity_multiplier if scenario else 1.0,
                "transport_cost_multiplier": scenario.transport_cost_multiplier if scenario else 1.0,
                "starting_inventory_multiplier": scenario.starting_inventory_multiplier if scenario else 1.0,
                "production_capacity_reduction": scenario.production_capacity_reduction if scenario else 0.0
            }
            simulator = SupplyChainSimulator(raw_data)
            sim_res = simulator.run_simulation(scenario_params, actions_dicts, strategy_type="MODIFIED")

            plan.total_cost = sim_res["total_cost"]
            plan.fill_rate = sim_res["fill_rate"]
            plan.backorders = sim_res["backorders"]
            plan.daily_timeline_json = json.dumps(sim_res["daily_timeline"])
            plan.metrics_json = json.dumps(sim_res)
            plan.constraint_violations_json = json.dumps(sim_res["constraint_violations"])

        audit_msg = f"Plan '{plan.name}' (ID {plan.id}) MODIFIED by planner. Recalculated total cost: ₹{plan.total_cost:,.2f}."

    else:
        raise HTTPException(status_code=400, detail="Invalid decision type. Must be APPROVED, REJECTED, or MODIFIED.")

    # Record Decision
    decision = PlannerDecision(
        plan_id=plan.id,
        scenario_id=plan.scenario_id,
        decision_type=dec_type,
        planner_notes=payload.planner_notes or payload.rejection_reason,
        modified_actions_json=json.dumps([a.model_dump() for a in payload.modified_actions]) if payload.modified_actions else None,
        decided_at=datetime.datetime.utcnow(),
        is_persisted=True
    )
    db.add(decision)

    # Record Audit Event
    audit = AuditEvent(
        event_type=f"PLAN_{dec_type}",
        details_json=json.dumps({
            "message": audit_msg,
            "plan_id": plan.id,
            "plan_name": plan.name,
            "scenario_id": plan.scenario_id,
            "decision_type": dec_type,
            "notes": payload.planner_notes,
            "disclaimer": "PLANNER DECISION RECORDED — NO EXTERNAL SYSTEM ACTION EXECUTED"
        }),
        user_role="Lead Supply Chain Resilience Officer"
    )
    db.add(audit)
    db.commit()
    db.refresh(decision)

    return PlanDecisionOut(
        id=decision.id,
        plan_id=decision.plan_id,
        scenario_id=decision.scenario_id,
        decision_type=decision.decision_type,
        planner_notes=decision.planner_notes,
        decided_at=decision.decided_at,
        plan_name=plan.name,
        scenario_name=scenario.name if scenario else "Crisis Scenario",
        total_cost=plan.total_cost,
        fill_rate=plan.fill_rate
    )

@router.get("/decisions", response_model=List[PlanDecisionOut])
def get_decision_history(db: Session = Depends(get_db)):
    """Retrieves all historical planner decisions persisted in SQLite."""
    decisions = db.query(PlannerDecision).order_by(PlannerDecision.id.desc()).all()
    out = []
    for d in decisions:
        plan = db.query(RecoveryPlan).filter(RecoveryPlan.id == d.plan_id).first()
        scenario = db.query(Scenario).filter(Scenario.id == d.scenario_id).first()
        out.append(PlanDecisionOut(
            id=d.id,
            plan_id=d.plan_id,
            scenario_id=d.scenario_id,
            decision_type=d.decision_type,
            planner_notes=d.planner_notes,
            decided_at=d.decided_at,
            plan_name=plan.name if plan else f"Plan #{d.plan_id}",
            scenario_name=scenario.name if scenario else f"Scenario #{d.scenario_id}",
            total_cost=plan.total_cost if plan else None,
            fill_rate=plan.fill_rate if plan else None
        ))
    return out

@router.get("/audit-log", response_model=List[AuditEventOut])
def get_audit_log(db: Session = Depends(get_db)):
    """Retrieves complete audit trail log."""
    events = db.query(AuditEvent).order_by(AuditEvent.id.desc()).limit(100).all()
    out = []
    for e in events:
        out.append(AuditEventOut(
            id=e.id,
            timestamp=e.timestamp,
            event_type=e.event_type,
            details=json.loads(e.details_json or "{}"),
            user_role=e.user_role
        ))
    return out
