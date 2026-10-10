from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict
import datetime

# Base Network Entities
class SupplierBase(BaseModel):
    code: str
    name: str
    location: str
    component_type: str
    capacity_daily: float
    lead_time_days: int
    unit_cost: float
    reliability: float
    is_critical: bool
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class SupplierOut(SupplierBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class FacilityOut(BaseModel):
    id: int
    code: str
    name: str
    location: str
    capacity_daily: float
    overtime_max_daily: float
    holding_cost_per_unit_day: float
    operating_cost_per_unit: float
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)

class DistributionCenterOut(BaseModel):
    id: int
    code: str
    name: str
    location: str
    capacity: float
    holding_cost_per_unit_day: float
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)

class ProductOut(BaseModel):
    id: int
    code: str
    name: str
    category: str
    selling_price: float
    shortage_penalty_per_day: float
    target_service_level: float
    unit_weight_kg: float
    model_config = ConfigDict(from_attributes=True)

class BOMOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    component_name: str
    required_quantity: float
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class RouteOut(BaseModel):
    id: int
    source_type: str
    source_id: int
    source_name: Optional[str] = None
    target_type: str
    target_id: int
    target_name: Optional[str] = None
    distance_km: float
    transit_time_days: int
    standard_cost_per_unit: float
    expedited_cost_per_unit: float
    expedited_transit_days: int
    model_config = ConfigDict(from_attributes=True)

class BaselineDemandOut(BaseModel):
    id: int
    day: int
    product_id: int
    product_code: Optional[str] = None
    dc_id: int
    dc_code: Optional[str] = None
    quantity: float
    model_config = ConfigDict(from_attributes=True)

class InventoryRecordOut(BaseModel):
    id: int
    echelon: str
    entity_id: int
    entity_name: Optional[str] = None
    item_type: str
    item_id: int
    item_name: Optional[str] = None
    on_hand_units: float
    safety_stock_units: float
    reorder_point_units: float
    model_config = ConfigDict(from_attributes=True)

class NetworkOverviewOut(BaseModel):
    suppliers: List[SupplierOut]
    facilities: List[FacilityOut]
    distribution_centers: List[DistributionCenterOut]
    products: List[ProductOut]
    routes: List[RouteOut]
    bom: List[BOMOut]
    inventory: List[InventoryRecordOut]
    baseline_demand: List[BaselineDemandOut]

# Scenario and Simulation Schemas
class ScenarioCreate(BaseModel):
    name: str = "7-Day Critical Supplier Outage"
    description: Optional[str] = "Critical Microcontroller supplier shutdown for 7 days"
    critical_supplier_id: int = 1
    shutdown_duration_days: int = 7
    demand_multiplier: float = 1.0
    alternate_supplier_capacity_multiplier: float = 1.0
    transport_cost_multiplier: float = 1.0
    starting_inventory_multiplier: float = 1.0
    production_capacity_reduction: float = 0.0

class ScenarioOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    critical_supplier_id: Optional[int]
    shutdown_duration_days: int
    demand_multiplier: float
    alternate_supplier_capacity_multiplier: float
    transport_cost_multiplier: float
    starting_inventory_multiplier: float
    production_capacity_reduction: float
    status: str
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class DailyTimelineEntry(BaseModel):
    day: int
    demand: float
    starting_inventory: float
    units_produced: float
    units_received: float
    units_shipped: float
    units_fulfilled: float
    unfilled_demand: float
    ending_inventory: float
    backorders: float
    daily_cost: float
    cumulative_cost: float
    active_disruption: bool

class PlanAction(BaseModel):
    id: str
    day: int
    action_type: str  # PROCURE_ALTERNATE, OVERTIME_PRODUCTION, EXPEDITE_SHIPPING, REALLOCATE_INVENTORY
    target_entity: str
    item: str
    quantity: float
    unit_cost: float
    estimated_cost: float
    rationale: str
    is_modified: bool = False

class RecoveryPlanOut(BaseModel):
    id: int
    scenario_id: int
    plan_type: str
    name: str
    description: Optional[str]
    is_recommended: bool
    is_approved: bool
    is_rejected: bool
    rejection_reason: Optional[str]
    total_cost: float
    fill_rate: float
    backorders: float
    unfilled_demand: float
    demand_fulfilled: float
    ending_inventory: float
    recovery_time_days: int
    transport_cost: float
    procurement_cost: float
    expediting_cost: float
    holding_cost: float
    shortage_cost: float
    production_cost: float
    supplier_concentration: float
    actions: List[PlanAction] = []
    daily_timeline: List[DailyTimelineEntry] = []
    metrics: Dict[str, Any] = {}
    constraint_violations: List[str] = []
    counterfactual_why_this: Optional[str] = None
    counterfactual_why_not: Optional[str] = None
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class AgentRecommendationOut(BaseModel):
    id: int
    scenario_id: int
    agent_name: str
    agent_role: str
    status: str
    proposed_action: str
    rationale: str
    confidence_score: float
    key_metrics: Dict[str, Any] = {}
    execution_time_ms: float
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class SimulationRunResult(BaseModel):
    scenario: ScenarioOut
    plans: List[RecoveryPlanOut]
    recommended_plan_id: int
    agents: List[AgentRecommendationOut]
    active_disruption: Dict[str, Any]
    disrupted_supplier: Optional[SupplierOut]
    impacted_products: List[ProductOut]
    runtime_ms: float

class BenchmarkComparisonOut(BaseModel):
    scenario_id: int
    plans: List[RecoveryPlanOut]
    metrics_comparison: List[Dict[str, Any]]
    method_descriptions: Dict[str, str]

class PlanDecisionCreate(BaseModel):
    plan_id: int
    decision_type: str  # APPROVED, REJECTED, MODIFIED
    planner_notes: Optional[str] = None
    modified_actions: Optional[List[PlanAction]] = None
    rejection_reason: Optional[str] = None

class PlanDecisionOut(BaseModel):
    id: int
    plan_id: int
    scenario_id: int
    decision_type: str
    planner_notes: Optional[str]
    decided_at: datetime.datetime
    plan_name: Optional[str] = None
    scenario_name: Optional[str] = None
    total_cost: Optional[float] = None
    fill_rate: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)

class AuditEventOut(BaseModel):
    id: int
    timestamp: datetime.datetime
    event_type: str
    details: Dict[str, Any]
    user_role: str

class ValidationResult(BaseModel):
    is_valid: bool
    violations: List[str] = []
    warnings: List[str] = []
    recalculated_cost: Optional[float] = None
    recalculated_fill_rate: Optional[float] = None
