import { NetworkOverview, PlanAction, RecoveryPlan, SimulationRunResult } from '../types';

export const STRATEGIES = [
  { type: 'COST_FIRST', label: 'Cost-First' },
  { type: 'SERVICE_FIRST', label: 'Service-First' },
  { type: 'BALANCED', label: 'Balanced' },
] as const;

/** Same fill-rate floor the backend uses when it picks a recommended plan. */
export const FILL_RATE_FLOOR = 88;

export const strategyLabel = (type: string) =>
  STRATEGIES.find((s) => s.type === type)?.label ?? type;

export const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
export const inrCompact = (n: number) =>
  n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)} L` : inr(n);
export const units = (n: number) => Math.round(n).toLocaleString('en-IN');

/** The three strategies, in a fixed order, taken from the real simulation run. */
export function getStrategyPlans(result: SimulationRunResult | null): RecoveryPlan[] {
  if (!result) return [];
  return STRATEGIES.map((s) => result.plans.find((p) => p.plan_type === s.type)).filter(
    (p): p is RecoveryPlan => Boolean(p)
  );
}

/**
 * Recommendation among the three strategies, from actual results:
 * lowest total cost among plans that reach the fill-rate floor with no constraint violations.
 * If none reach the floor, the plan with the highest fill rate (ties: lowest cost).
 */
export function pickRecommendation(plans: RecoveryPlan[]) {
  if (plans.length === 0) return null;
  const valid = plans.filter((p) => p.constraint_violations.length === 0);
  const pool = valid.length > 0 ? valid : plans;
  const eligible = pool.filter((p) => p.fill_rate >= FILL_RATE_FLOOR);
  if (eligible.length > 0) {
    const plan = [...eligible].sort((a, b) => a.total_cost - b.total_cost)[0];
    return { plan, meetsFloor: true };
  }
  const plan = [...pool].sort((a, b) => b.fill_rate - a.fill_rate || a.total_cost - b.total_cost)[0];
  return { plan, meetsFloor: false };
}

/** Plan whose numbers the Command Center shows: the approved plan if any, else the recommendation. */
export function focusPlan(result: SimulationRunResult | null): RecoveryPlan | null {
  if (!result) return null;
  const approved = result.plans.find((p) => p.is_approved);
  if (approved) return approved;
  return pickRecommendation(getStrategyPlans(result))?.plan ?? null;
}

/**
 * Demand at Risk = demand (units) for products whose bill of materials needs the disrupted
 * supplier, during the outage window, scaled by the scenario's demand multiplier.
 */
export function demandAtRisk(result: SimulationRunResult | null, network: NetworkOverview | null) {
  if (!result || !network) return null;
  const supplierId = result.active_disruption.disrupted_supplier_id;
  const days = result.scenario.shutdown_duration_days;
  const mult = result.scenario.demand_multiplier;
  const dependent = new Set(network.bom.filter((b) => b.supplier_id === supplierId).map((b) => b.product_id));
  let atRisk = 0;
  let total = 0;
  for (const d of network.baseline_demand) {
    if (d.day > days) continue;
    total += d.quantity * mult;
    if (dependent.has(d.product_id)) atRisk += d.quantity * mult;
  }
  return { units: atRisk, share: total > 0 ? (atRisk / total) * 100 : 0, dependentProducts: dependent.size };
}

/** Plain-language reasons, built only from the simulated numbers. */
export function explainRecommendation(plans: RecoveryPlan[], rec: RecoveryPlan, meetsFloor: boolean): string[] {
  const lines: string[] = [];
  if (meetsFloor) {
    lines.push(
      `${strategyLabel(rec.plan_type)} has the lowest total cost (${inr(rec.total_cost)}) of the strategies that reach the ${FILL_RATE_FLOOR}% fill-rate floor (${rec.fill_rate.toFixed(1)}%).`
    );
  } else {
    lines.push(
      `No strategy reaches the ${FILL_RATE_FLOOR}% fill-rate floor with these inputs. ${strategyLabel(rec.plan_type)} is recommended because it protects the most demand: ${rec.fill_rate.toFixed(1)}% fill rate and ${units(rec.backorders)} backorders.`
    );
  }
  for (const p of plans) {
    if (p.id === rec.id) continue;
    const dCost = p.total_cost - rec.total_cost;
    const dFill = rec.fill_rate - p.fill_rate;
    lines.push(
      `${strategyLabel(p.plan_type)} costs ${inr(Math.abs(dCost))} ${dCost >= 0 ? 'more' : 'less'} and fills ${Math.abs(dFill).toFixed(1)} pts ${dFill >= 0 ? 'less' : 'more'} demand.`
    );
  }
  return lines;
}

const ACTION_TITLES: Record<string, string> = {
  PROCURE_ALTERNATE: 'Order from alternate supplier',
  OVERTIME_PRODUCTION: 'Run factory overtime',
  EXPEDITE_SHIPPING: 'Expedite shipments',
  REALLOCATE_INVENTORY: 'Reallocate inventory',
};

/** Collapses a plan's real action list into a short checklist. */
export function summarizeActions(plan: RecoveryPlan): { title: string; detail: string }[] {
  const groups = new Map<string, PlanAction[]>();
  for (const a of plan.actions) {
    const key = `${a.action_type}|${a.target_entity}`;
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }
  return [...groups.values()].map((acts) => {
    const first = acts[0];
    const dayList = acts.map((a) => a.day);
    const range = Math.min(...dayList) === Math.max(...dayList) ? `Day ${dayList[0]}` : `Days ${Math.min(...dayList)}–${Math.max(...dayList)}`;
    const qty = acts.reduce((s, a) => s + a.quantity, 0);
    const cost = acts.reduce((s, a) => s + a.estimated_cost, 0);
    const isOvertime = first.action_type === 'OVERTIME_PRODUCTION';
    const what = isOvertime
      ? `up to +${units(Math.max(...acts.map((a) => a.quantity)))} units/day`
      : `${units(qty)} units`;
    return {
      title: `${ACTION_TITLES[first.action_type] ?? first.action_type}: ${first.target_entity}`,
      detail: `${range} · ${what} · est. ${inr(cost)}`,
    };
  });
}
