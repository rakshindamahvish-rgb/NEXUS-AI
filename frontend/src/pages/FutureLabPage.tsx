import React, { useState } from 'react';
import { useScenario } from '../context/ScenarioContext';
import { RecoveryPlan, DailyTimelineEntry } from '../types';
import {
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sliders,
  DollarSign,
  TrendingUp,
  Package,
  Activity,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const FutureLabPage: React.FC = () => {
  const { simulationResult, selectedPlanId, setSelectedPlanId, isSimulating, runCrisisSimulation, approvePlan } = useScenario();
  const [selectedTimelineDay, setSelectedTimelineDay] = useState<number>(1);
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [plannerNotes, setPlannerNotes] = useState<string>('');

  if (!simulationResult) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-sm font-mono text-gray-400">Loading Future Lab simulations...</p>
      </div>
    );
  }

  const plans = simulationResult.plans;
  const activePlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  const handleQuickDemandShift = (multiplier: number) => {
    runCrisisSimulation({
      name: `What-If Shift: ${(multiplier * 100).toFixed(0)}% Demand`,
      critical_supplier_id: simulationResult.scenario.critical_supplier_id || 1,
      shutdown_duration_days: simulationResult.scenario.shutdown_duration_days || 7,
      demand_multiplier: multiplier,
      alternate_supplier_capacity_multiplier: simulationResult.scenario.alternate_supplier_capacity_multiplier || 1.0,
      transport_cost_multiplier: simulationResult.scenario.transport_cost_multiplier || 1.0,
      starting_inventory_multiplier: simulationResult.scenario.starting_inventory_multiplier || 1.0,
      production_capacity_reduction: simulationResult.scenario.production_capacity_reduction || 0.0
    });
  };

  const handleApprove = async () => {
    if (activePlan) {
      const ok = await approvePlan(activePlan.id, plannerNotes);
      if (ok) {
        setShowApprovalModal(false);
        setPlannerNotes('');
      }
    }
  };

  const timelineChartData = activePlan.daily_timeline.map(d => ({
    name: `Day ${d.day}`,
    Demand: d.demand,
    Fulfilled: d.units_fulfilled,
    Produced: d.units_produced,
    EndingInventory: d.ending_inventory,
    Backorders: d.backorders,
    CumulativeCost: d.cumulative_cost
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER & WHAT-IF TOOLBAR */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-dark-850 via-dark-800 to-dark-850 border border-nexus-violet/40 shadow-glow-violet flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-nexus-violet/20 text-nexus-violet border border-nexus-violet/40">
              <FlaskConical className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white">
              NEXUS Future Lab — Multiverse Simulation Engine
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-nexus-violet/30 text-nexus-purple font-bold">
              CORE FEATURE
            </span>
          </div>
          <p className="text-xs text-gray-300 mt-1 max-w-2xl">
            "Don't just react to a supply-chain crisis. Simulate its consequences before making the decision."
            Compare 4 candidate strategies calculated by the multi-agent optimization engine.
          </p>
        </div>

        {/* Quick What-If Shift Buttons */}
        <div className="flex flex-wrap items-center gap-2 bg-dark-900/80 p-2 rounded-lg border border-dark-600/60">
          <span className="text-[11px] font-semibold text-gray-400 flex items-center space-x-1">
            <Sliders className="w-3.5 h-3.5 text-nexus-cyan" />
            <span>What-If:</span>
          </span>
          <button
            onClick={() => handleQuickDemandShift(1.0)}
            disabled={isSimulating}
            className="px-2.5 py-1 rounded text-xs font-mono bg-dark-750 hover:bg-dark-700 text-gray-200 border border-dark-600 transition-all disabled:opacity-50"
          >
            Baseline (1.0x)
          </button>
          <button
            onClick={() => handleQuickDemandShift(1.2)}
            disabled={isSimulating}
            className="px-2.5 py-1 rounded text-xs font-mono bg-nexus-cyan/20 hover:bg-nexus-cyan/30 text-nexus-cyan border border-nexus-cyan/40 font-bold transition-all disabled:opacity-50"
          >
            +20% Demand Surge
          </button>
          <button
            onClick={() => handleQuickDemandShift(1.4)}
            disabled={isSimulating}
            className="px-2.5 py-1 rounded text-xs font-mono bg-nexus-violet/20 hover:bg-nexus-violet/30 text-nexus-violet border border-nexus-violet/40 font-bold transition-all disabled:opacity-50"
          >
            +40% High Stress
          </button>
        </div>
      </div>

      {/* 2. CANDIDATE STRATEGY SELECTOR CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.slice(0, 4).map((plan) => {
          const isSelected = plan.id === activePlan.id;
          const isRec = plan.is_recommended;
          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'bg-nexus-cyan/15 border-nexus-cyan shadow-glow-cyan ring-1 ring-nexus-cyan'
                  : 'bg-dark-850 border-dark-600/60 hover:border-dark-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-750 text-gray-300 font-bold uppercase">
                  {plan.plan_type.replace('_', ' ')}
                </span>
                {isRec && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-nexus-cyan text-black font-bold uppercase">
                    RECOMMENDED
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-white mt-2.5">{plan.name}</h3>
              <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{plan.description}</p>

              <div className="mt-3.5 pt-3 border-t border-dark-600/40 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Landed Cost:</span>
                  <span className="font-mono font-bold text-white">₹{plan.total_cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Customer Fill Rate:</span>
                  <span className={`font-mono font-bold ${plan.fill_rate >= 90 ? 'text-nexus-emerald' : 'text-nexus-rose'}`}>
                    {plan.fill_rate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Backorders:</span>
                  <span className="font-mono text-gray-300">{plan.backorders.toFixed(0)} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Recovery Horizon:</span>
                  <span className="font-mono text-nexus-cyan font-semibold">{plan.recovery_time_days} days</span>
                </div>
              </div>

              <div className="mt-3 pt-2 text-center text-[11px] font-semibold text-nexus-cyan flex items-center justify-center space-x-1">
                <span>{isSelected ? 'Currently Inspecting' : 'Click to Inspect'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. ACTIVE PLAN DEEP DIVE & METRICS BREAKDOWN */}
      <div className="p-6 rounded-xl bg-dark-850 border border-dark-600/50 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-dark-600/40 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">{activePlan.name}</h3>
              {activePlan.is_recommended && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-nexus-cyan text-black font-bold uppercase">
                  OPTIMAL RECOMMENDATION
                </span>
              )}
              {activePlan.is_approved && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-nexus-emerald text-black font-bold uppercase">
                  APPROVED BY PLANNER
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{activePlan.description}</p>
          </div>

          <div className="flex items-center space-x-3">
            {!activePlan.is_approved && (
              <button
                onClick={() => setShowApprovalModal(true)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-nexus-emerald to-nexus-cyan text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 shadow-glow-emerald transition-all flex items-center space-x-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>APPROVE THIS PLAN</span>
              </button>
            )}
          </div>
        </div>

        {/* Detailed Financial & Operational Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 bg-dark-800/80 rounded-lg border border-dark-600/40">
            <span className="text-gray-400 block">Procurement Cost</span>
            <span className="font-mono font-bold text-white text-sm mt-0.5 block">₹{activePlan.procurement_cost.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-dark-800/80 rounded-lg border border-dark-600/40">
            <span className="text-gray-400 block">Standard Transport</span>
            <span className="font-mono font-bold text-nexus-cyan text-sm mt-0.5 block">₹{activePlan.transport_cost.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-dark-800/80 rounded-lg border border-dark-600/40">
            <span className="text-gray-400 block">Air Expediting</span>
            <span className="font-mono font-bold text-nexus-amber text-sm mt-0.5 block">₹{activePlan.expediting_cost.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-dark-800/80 rounded-lg border border-dark-600/40">
            <span className="text-gray-400 block">Production / Overtime</span>
            <span className="font-mono font-bold text-nexus-violet text-sm mt-0.5 block">₹{activePlan.production_cost.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-dark-800/80 rounded-lg border border-dark-600/40">
            <span className="text-gray-400 block">Inventory Holding</span>
            <span className="font-mono font-bold text-gray-300 text-sm mt-0.5 block">₹{activePlan.holding_cost.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-dark-800/80 rounded-lg border border-dark-600/40">
            <span className="text-gray-400 block">Shortage Penalties</span>
            <span className="font-mono font-bold text-nexus-rose text-sm mt-0.5 block">₹{activePlan.shortage_cost.toLocaleString()}</span>
          </div>
        </div>

        {/* 4. DAILY SIMULATION TIMELINE CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-dark-800/60 border border-dark-600/40">
            <h4 className="text-xs font-bold text-white mb-3">Daily Throughput: Demand vs. Fulfillment vs. Production</h4>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                  <YAxis stroke="#6B7280" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="Demand" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="Fulfilled" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="Produced" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-dark-800/60 border border-dark-600/40">
            <h4 className="text-xs font-bold text-white mb-3">Cumulative Landed Cost Trajectory (₹)</h4>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                  <YAxis stroke="#6B7280" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="CumulativeCost" stroke="#10B981" fill="#10B981" fillOpacity={0.25} name="Total Cost (INR)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 5. 7-DAY DAILY TIMELINE DATA TABLE */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              7-Day Simulation Day-by-Day Balance Sheet
            </h4>
            <span className="text-[11px] text-gray-400">Formula: Ending Inv = Starting + Receipts - Fulfilled</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-dark-600/60 bg-dark-800/80 text-gray-300 font-mono">
                  <th className="py-2.5 px-3">Timeline Day</th>
                  <th className="py-2.5 px-3">Customer Demand</th>
                  <th className="py-2.5 px-3">Produced Units</th>
                  <th className="py-2.5 px-3">Fulfilled Units</th>
                  <th className="py-2.5 px-3">Unfilled Demand</th>
                  <th className="py-2.5 px-3">Ending Inventory</th>
                  <th className="py-2.5 px-3">Active Backorders</th>
                  <th className="py-2.5 px-3">Cumulative Cost (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600/30 font-mono text-[11px]">
                {activePlan.daily_timeline.map((entry) => (
                  <tr key={entry.day} className="hover:bg-dark-800/40">
                    <td className="py-2.5 px-3 font-bold text-white flex items-center space-x-1.5">
                      <span className={`w-2 h-2 rounded-full ${entry.active_disruption ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      <span>Day {entry.day}</span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-300">{entry.demand.toFixed(0)}</td>
                    <td className="py-2.5 px-3 text-nexus-violet font-semibold">{entry.units_produced.toFixed(0)}</td>
                    <td className="py-2.5 px-3 text-nexus-cyan font-semibold">{entry.units_fulfilled.toFixed(0)}</td>
                    <td className="py-2.5 px-3 text-nexus-rose">{entry.unfilled_demand.toFixed(0)}</td>
                    <td className="py-2.5 px-3 text-white font-bold">{entry.ending_inventory.toFixed(0)}</td>
                    <td className="py-2.5 px-3 text-gray-400">{entry.backorders.toFixed(0)}</td>
                    <td className="py-2.5 px-3 font-bold text-nexus-emerald">₹{entry.cumulative_cost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. DYNAMIC COUNTERFACTUAL EXPLANATIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-dark-600/40">
          {/* WHY THIS PLAN? */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-nexus-cyan/40 space-y-2.5">
            <div className="flex items-center space-x-2 text-nexus-cyan">
              <Sparkles className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono">Why This Plan?</h4>
            </div>
            <p className="text-xs text-gray-200 leading-relaxed">
              {activePlan.counterfactual_why_this ||
                `The ${activePlan.name} is selected because it reaches a ${activePlan.fill_rate}% fill rate with total landed cost of ₹${activePlan.total_cost.toLocaleString()}. It balances emergency air expediting on Days 1-3 to prevent factory starvation, transitioning to steady standard replenishment to minimize redundant surcharges.`}
            </p>
          </div>

          {/* WHY NOT THE ALTERNATIVES? */}
          <div className="p-4 rounded-xl bg-dark-800/80 border border-dark-600/50 space-y-2.5">
            <div className="flex items-center space-x-2 text-gray-300">
              <HelpCircle className="w-4 h-4 text-nexus-amber" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono">Why Not The Alternatives?</h4>
            </div>
            <div className="text-xs text-gray-300 whitespace-pre-line leading-relaxed">
              {activePlan.counterfactual_why_not ||
                `• Cost-First Plan: Rejected due to severe stockouts (fill rate <82%) triggering heavy shortage penalties.\n• Service-First Plan: Rejected due to excess air freight and continuous overtime costs.\n• Reorder-Rule Baseline: Rejected due to inability to forecast lead-time disruption shockwaves.`}
            </div>
          </div>
        </div>
      </div>

      {/* 7. APPROVAL CONFIRMATION MODAL */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-dark-850 border border-dark-600 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3 text-nexus-emerald">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Approve Recovery Plan</h3>
                <p className="text-xs text-gray-400">Formal Human Planner Governance Sign-off</p>
              </div>
            </div>

            <div className="p-3.5 bg-dark-800 rounded-xl border border-dark-600/40 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Plan Title:</span>
                <span className="font-bold text-white">{activePlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Landed Cost:</span>
                <span className="font-mono font-bold text-nexus-emerald">₹{activePlan.total_cost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Projected Fill Rate:</span>
                <span className="font-mono font-bold text-white">{activePlan.fill_rate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Constraint Violations:</span>
                <span className="font-mono text-nexus-emerald font-semibold">0 (Passed All Safety Guardrails)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Planner Sign-off Notes / Operational Directives:
              </label>
              <textarea
                rows={3}
                value={plannerNotes}
                onChange={(e) => setPlannerNotes(e.target.value)}
                placeholder="Enter approval rationale, e.g., 'Approved coordinated action with front-loaded expediting from SUP-02'..."
                className="w-full bg-dark-800 border border-dark-600 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-nexus-cyan"
              />
            </div>

            <div className="p-2.5 bg-nexus-cyan/10 rounded-lg border border-nexus-cyan/30 text-[10px] text-nexus-cyan font-mono">
              NOTICE: PLANNER DECISION RECORDED — NO EXTERNAL SYSTEM ACTION EXECUTED. This action will be permanently recorded in the persistent SQLite audit ledger.
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 rounded-lg bg-dark-800 hover:bg-dark-750 text-xs font-semibold text-gray-300 border border-dark-600"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-nexus-emerald to-nexus-cyan text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-glow-emerald"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
