from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.seed.seed_data import init_db
from app.config import settings

router = APIRouter(prefix="/settings", tags=["Settings & Assumptions"])

@router.get("/health")
def health_check():
    """Application health and runtime status check."""
    return {
        "status": "healthy",
        "service": "NEXUS Supply Chain Resilience Engine",
        "version": "1.0.0",
        "environment": "demonstration_synthetic",
        "currency": settings.CURRENCY_CODE
    }

@router.get("/assumptions")
def get_system_assumptions():
    """Retrieves current global supply chain baseline assumptions and cost parameters."""
    return {
        "planning_horizon_days": 7,
        "currency_symbol": "₹",
        "currency_code": "INR",
        "standard_factory_overtime_rate": 120.0,
        "standard_factory_base_operating_cost": 80.0,
        "average_holding_cost_rate": 12.5,
        "expediting_cost_multiplier": 2.5,
        "random_seed": settings.RANDOM_SEED,
        "disruption_detection_mode": "Automated Multi-Agent Consensus"
    }

@router.post("/reseed")
def reseed_dataset(db: Session = Depends(get_db)):
    """Reseeds the demonstration dataset while preserving historical decisions if needed."""
    res = init_db(db, force_reseed=True)
    return {
        "status": "success",
        "message": "Demonstration database safely re-initialized with reproducible synthetic dataset.",
        "details": res
    }
