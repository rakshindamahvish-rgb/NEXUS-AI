import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.entities import AgentRecommendation, Scenario
from app.models.schemas import AgentRecommendationOut

router = APIRouter(prefix="/agents", tags=["Agents"])

@router.get("/recommendations/{scenario_id}", response_model=List[AgentRecommendationOut])
def get_agent_recommendations(scenario_id: int, db: Session = Depends(get_db)):
    """Retrieves all specialized agent outputs and rationales for a given scenario."""
    records = db.query(AgentRecommendation).filter(AgentRecommendation.scenario_id == scenario_id).all()
    if not records:
        # Check if scenario exists
        sc = db.query(Scenario).filter(Scenario.id == scenario_id).first()
        if not sc:
            raise HTTPException(status_code=404, detail="Scenario not found.")
        return []

    results = []
    for r in records:
        results.append(AgentRecommendationOut(
            id=r.id,
            scenario_id=r.scenario_id,
            agent_name=r.agent_name,
            agent_role=r.agent_role,
            status=r.status,
            proposed_action=r.proposed_action,
            rationale=r.rationale,
            confidence_score=r.confidence_score,
            key_metrics=json.loads(r.key_metrics_json or "{}"),
            execution_time_ms=r.execution_time_ms,
            created_at=r.created_at
        ))
    return results
