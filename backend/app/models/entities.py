import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    location = Column(String(100), nullable=False)
    component_type = Column(String(100), nullable=False)
    capacity_daily = Column(Float, nullable=False)
    lead_time_days = Column(Integer, nullable=False)
    unit_cost = Column(Float, nullable=False)
    reliability = Column(Float, nullable=False)  # e.g., 0.95
    is_critical = Column(Boolean, default=False)
    status = Column(String(50), default="OPERATIONAL")  # OPERATIONAL, DISRUPTED, RECOVERING, AT_RISK
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    location = Column(String(100), nullable=False)
    capacity_daily = Column(Float, nullable=False)
    overtime_max_daily = Column(Float, default=200.0)
    holding_cost_per_unit_day = Column(Float, default=15.0)
    operating_cost_per_unit = Column(Float, default=80.0)
    status = Column(String(50), default="OPERATIONAL")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

class DistributionCenter(Base):
    __tablename__ = "distribution_centers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    location = Column(String(100), nullable=False)
    capacity = Column(Float, nullable=False)
    holding_cost_per_unit_day = Column(Float, default=10.0)
    status = Column(String(50), default="OPERATIONAL")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(50), default="Hardware")
    selling_price = Column(Float, nullable=False)
    shortage_penalty_per_day = Column(Float, nullable=False)
    target_service_level = Column(Float, default=0.95)
    unit_weight_kg = Column(Float, default=1.0)

class BillOfMaterials(Base):
    __tablename__ = "bill_of_materials"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    component_name = Column(String(100), nullable=False)
    required_quantity = Column(Float, default=1.0)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)

    product = relationship("Product")
    supplier = relationship("Supplier")

class TransportationRoute(Base):
    __tablename__ = "transportation_routes"

    id = Column(Integer, primary_key=True, index=True)
    source_type = Column(String(50), nullable=False)  # SUPPLIER, FACILITY
    source_id = Column(Integer, nullable=False)
    target_type = Column(String(50), nullable=False)  # FACILITY, DC
    target_id = Column(Integer, nullable=False)
    distance_km = Column(Float, nullable=False)
    transit_time_days = Column(Integer, default=1)
    standard_cost_per_unit = Column(Float, nullable=False)
    expedited_cost_per_unit = Column(Float, nullable=False)
    expedited_transit_days = Column(Integer, default=1)

class BaselineDemand(Base):
    __tablename__ = "baseline_demand"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(Integer, nullable=False)  # 1 to 7
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    dc_id = Column(Integer, ForeignKey("distribution_centers.id"), nullable=False)
    quantity = Column(Float, nullable=False)

    product = relationship("Product")
    dc = relationship("DistributionCenter")

class InventoryRecord(Base):
    __tablename__ = "inventory_records"

    id = Column(Integer, primary_key=True, index=True)
    echelon = Column(String(50), nullable=False)  # SUPPLIER, FACILITY, DC
    entity_id = Column(Integer, nullable=False)
    item_type = Column(String(50), default="PRODUCT")  # PRODUCT, COMPONENT
    item_id = Column(Integer, nullable=False)
    on_hand_units = Column(Float, default=0.0)
    safety_stock_units = Column(Float, default=0.0)
    reorder_point_units = Column(Float, default=0.0)

class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    critical_supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    shutdown_duration_days = Column(Integer, default=7)
    demand_multiplier = Column(Float, default=1.0)
    alternate_supplier_capacity_multiplier = Column(Float, default=1.0)
    transport_cost_multiplier = Column(Float, default=1.0)
    starting_inventory_multiplier = Column(Float, default=1.0)
    production_capacity_reduction = Column(Float, default=0.0)  # 0.0 to 1.0
    status = Column(String(50), default="CREATED")  # CREATED, SIMULATED, COMPLETED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    critical_supplier = relationship("Supplier")

class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(Integer, ForeignKey("scenarios.id"), nullable=False)
    strategy_name = Column(String(100), nullable=False)
    total_cost = Column(Float, default=0.0)
    fill_rate = Column(Float, default=0.0)
    backorders = Column(Float, default=0.0)
    recovery_time_days = Column(Integer, default=0)
    runtime_ms = Column(Float, default=0.0)
    metrics_json = Column(Text, nullable=True)
    daily_timeline_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    scenario = relationship("Scenario")

class AgentRecommendation(Base):
    __tablename__ = "agent_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(Integer, ForeignKey("scenarios.id"), nullable=False)
    agent_name = Column(String(100), nullable=False)
    agent_role = Column(String(100), nullable=False)
    status = Column(String(50), default="COMPLETED")
    proposed_action = Column(Text, nullable=False)
    rationale = Column(Text, nullable=False)
    confidence_score = Column(Float, default=0.95)
    key_metrics_json = Column(Text, nullable=True)
    execution_time_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    scenario = relationship("Scenario")

class RecoveryPlan(Base):
    __tablename__ = "recovery_plans"

    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(Integer, ForeignKey("scenarios.id"), nullable=False)
    plan_type = Column(String(50), nullable=False)  # COST_FIRST, SERVICE_FIRST, BALANCED, COORDINATED_AGENT, OPTIMIZATION_LP, REORDER_RULE
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    is_recommended = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=False)
    is_rejected = Column(Boolean, default=False)
    rejection_reason = Column(Text, nullable=True)
    
    total_cost = Column(Float, default=0.0)
    fill_rate = Column(Float, default=0.0)
    backorders = Column(Float, default=0.0)
    unfilled_demand = Column(Float, default=0.0)
    demand_fulfilled = Column(Float, default=0.0)
    ending_inventory = Column(Float, default=0.0)
    recovery_time_days = Column(Integer, default=0)
    transport_cost = Column(Float, default=0.0)
    procurement_cost = Column(Float, default=0.0)
    expediting_cost = Column(Float, default=0.0)
    holding_cost = Column(Float, default=0.0)
    shortage_cost = Column(Float, default=0.0)
    production_cost = Column(Float, default=0.0)
    supplier_concentration = Column(Float, default=0.0)

    actions_json = Column(Text, nullable=True)
    daily_timeline_json = Column(Text, nullable=True)
    metrics_json = Column(Text, nullable=True)
    constraint_violations_json = Column(Text, nullable=True)
    counterfactual_why_this = Column(Text, nullable=True)
    counterfactual_why_not = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    scenario = relationship("Scenario")

class PlannerDecision(Base):
    __tablename__ = "planner_decisions"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("recovery_plans.id"), nullable=False)
    scenario_id = Column(Integer, ForeignKey("scenarios.id"), nullable=False)
    decision_type = Column(String(50), nullable=False)  # APPROVED, REJECTED, MODIFIED
    planner_notes = Column(Text, nullable=True)
    modified_actions_json = Column(Text, nullable=True)
    decided_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_persisted = Column(Boolean, default=True)

    plan = relationship("RecoveryPlan")
    scenario = relationship("Scenario")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    event_type = Column(String(100), nullable=False)
    details_json = Column(Text, nullable=True)
    user_role = Column(String(50), default="Supply Chain Planner")
