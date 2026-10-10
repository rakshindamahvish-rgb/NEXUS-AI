export interface Supplier {
  id: number;
  code: string;
  name: string;
  location: string;
  component_type: string;
  capacity_daily: number;
  lead_time_days: number;
  unit_cost: number;
  reliability: number;
  is_critical: boolean;
  status: 'OPERATIONAL' | 'DISRUPTED' | 'RECOVERING' | 'AT_RISK';
  latitude?: number;
  longitude?: number;
}

export interface Facility {
  id: number;
  code: string;
  name: string;
  location: string;
  capacity_daily: number;
  overtime_max_daily: number;
  holding_cost_per_unit_day: number;
  operating_cost_per_unit: number;
  status: string;
  latitude?: number;
  longitude?: number;
}

export interface DistributionCenter {
  id: number;
  code: string;
  name: string;
  location: string;
  capacity: number;
  holding_cost_per_unit_day: number;
  status: string;
  latitude?: number;
  longitude?: number;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  category: string;
  selling_price: number;
  shortage_penalty_per_day: number;
  target_service_level: number;
  unit_weight_kg: number;
}

export interface BOM {
  id: number;
  product_id: number;
  product_name?: string;
  component_name: string;
  required_quantity: number;
  supplier_id?: number;
  supplier_name?: string;
}

export interface Route {
  id: number;
  source_type: string;
  source_id: number;
  source_name?: string;
  target_type: string;
  target_id: number;
  target_name?: string;
  distance_km: number;
  transit_time_days: number;
  standard_cost_per_unit: number;
  expedited_cost_per_unit: number;
  expedited_transit_days: number;
}

export interface BaselineDemand {
  id: number;
  day: number;
  product_id: number;
  product_code?: string;
  dc_id: number;
  dc_code?: string;
  quantity: number;
}

export interface InventoryRecord {
  id: number;
  echelon: string;
  entity_id: number;
  entity_name?: string;
  item_type: string;
  item_id: number;
  item_name?: string;
  on_hand_units: number;
  safety_stock_units: number;
  reorder_point_units: number;
}

export interface NetworkOverview {
  suppliers: Supplier[];
  facilities: Facility[];
  distribution_centers: DistributionCenter[];
  products: Product[];
  routes: Route[];
  bom: BOM[];
  inventory: InventoryRecord[];
  baseline_demand: BaselineDemand[];
}

export interface Scenario {
  id: number;
  name: string;
  description?: string;
  critical_supplier_id?: number;
  shutdown_duration_days: number;
  demand_multiplier: number;
  alternate_supplier_capacity_multiplier: number;
  transport_cost_multiplier: number;
  starting_inventory_multiplier: number;
  production_capacity_reduction: number;
  status: string;
  created_at: string;
}

export interface DailyTimelineEntry {
  day: number;
  demand: number;
  starting_inventory: number;
  units_produced: number;
  units_received: number;
  units_shipped: number;
  units_fulfilled: number;
  unfilled_demand: number;
  ending_inventory: number;
  backorders: number;
  daily_cost: number;
  cumulative_cost: number;
  active_disruption: boolean;
}

export interface PlanAction {
  id: string;
  day: number;
  action_type: string;
  target_entity: string;
  item: string;
  quantity: number;
  unit_cost: number;
  estimated_cost: number;
  rationale: string;
  is_modified?: boolean;
}

export interface RecoveryPlan {
  id: number;
  scenario_id: number;
  plan_type: 'COST_FIRST' | 'SERVICE_FIRST' | 'BALANCED' | 'COORDINATED_AGENT' | 'OPTIMIZATION_LP' | 'REORDER_RULE' | 'MODIFIED';
  name: string;
  description?: string;
  is_recommended: boolean;
  is_approved: boolean;
  is_rejected: boolean;
  rejection_reason?: string;
  total_cost: number;
  fill_rate: number;
  backorders: number;
  unfilled_demand: number;
  demand_fulfilled: number;
  ending_inventory: number;
  recovery_time_days: number;
  transport_cost: number;
  procurement_cost: number;
  expediting_cost: number;
  holding_cost: number;
  shortage_cost: number;
  production_cost: number;
  supplier_concentration: number;
  actions: PlanAction[];
  daily_timeline: DailyTimelineEntry[];
  metrics: Record<string, any>;
  constraint_violations: string[];
  counterfactual_why_this?: string;
  counterfactual_why_not?: string;
  created_at: string;
}

export interface AgentRecommendation {
  id: number;
  scenario_id: number;
  agent_name: string;
  agent_role: string;
  status: string;
  proposed_action: string;
  rationale: string;
  confidence_score: number;
  key_metrics: Record<string, any>;
  execution_time_ms: number;
  created_at: string;
}

export interface SimulationRunResult {
  scenario: Scenario;
  plans: RecoveryPlan[];
  recommended_plan_id: number;
  agents: AgentRecommendation[];
  active_disruption: {
    is_active: boolean;
    disrupted_supplier_id: number;
    supplier_name: string;
    shutdown_days: number;
    lost_component: string;
    impact_summary: string;
  };
  disrupted_supplier?: Supplier;
  impacted_products: Product[];
  runtime_ms: number;
}

export interface BenchmarkComparison {
  scenario_id: number;
  plans: RecoveryPlan[];
  metrics_comparison: Array<{
    plan_type: string;
    name: string;
    is_recommended: boolean;
    fill_rate_pct: number;
    backorders_units: number;
    total_landed_cost_inr: number;
    recovery_time_days: number;
    inventory_days: number;
    constraint_violations_count: number;
    runtime_ms: number;
    recommendation_stability: string;
  }>;
  method_descriptions: Record<string, string>;
}

export interface PlannerDecision {
  id: number;
  plan_id: number;
  scenario_id: number;
  decision_type: 'APPROVED' | 'REJECTED' | 'MODIFIED';
  planner_notes?: string;
  decided_at: string;
  plan_name?: string;
  scenario_name?: string;
  total_cost?: number;
  fill_rate?: number;
}

export interface AuditEvent {
  id: number;
  timestamp: string;
  event_type: string;
  details: Record<string, any>;
  user_role: string;
}

export interface ValidationResult {
  is_valid: boolean;
  violations: string[];
  warnings: string[];
  recalculated_cost?: number;
  recalculated_fill_rate?: number;
}
