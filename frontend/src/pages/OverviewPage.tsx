import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  TrendingUp,
  Package,
  Activity,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  CheckCircle2
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
import { useScenario } from '../context/ScenarioContext';
import { demandAtRisk as calcDemandAtRisk, FILL_RATE_FLOOR, units as fmtUnits } from '../lib/analysis';

export const OverviewPage: React.FC = () => {
  const { simulationResult, network, setSelectedPlanId } = useScenario();

  if (!simulationResult) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-nexus-cyan border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400">Loading metrics...</p>
        </div>
      </div>
    );
  }

  const recPlan = simulationResult.plans.find(p => p.is_recommended) || simulationResult.plans[0];
  const activeDisruption = simulationResult.active_disruption;

  const risk = calcDemandAtRisk(simulationResult, network);
  const demandAtRisk = activeDisruption.is_active && risk ? risk.units : 0;
  const horizonDays = recPlan.daily_timeline.length;
  const currentFillRate = recPlan.fill_rate;
  const backorders = recPlan.backorders;
  const totalCost = recPlan.total_cost;
  const currentInventory = recPlan.ending_inventory;

  const chartData = recPlan.daily_timeline.map(d => ({
    name: `Day ${d.day}`,
    Demand: d.demand,
    Fulfilled: d.units_fulfilled,
    Backorders: d.backorders,
    Inventory: d.ending_inventory,
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* 1. DISRUPTION BANNER */}
      {activeDisruption.is_active && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-semibold uppercase">
                  Active Disruption
                </span>
                <span className="text-xs text-slate-400">{activeDisruption.supplier_name}</span>
              </div>
              <h2 className="text-sm font-semibold text-white mt-1">
                {activeDisruption.shutdown_days}-Day Shutdown of {activeDisruption.lost_component}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeDisruption.impact_summary}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 self-end md:self-center">
            <Link
              to="/crisis-simulator"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 transition-all"
            >
              Adjust Outage
            </Link>
            <Link
              to="/future-lab"
              className="px-3.5 py-1.5 rounded-lg bg-nexus-cyan hover:bg-cyan-400 text-slate-950 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <span>Explore Solutions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 2. KEY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-dark-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Demand at Risk</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold font-mono text-white">{fmtUnits(demandAtRisk)} <span className="text-xs text-slate-500 font-sans font-normal">units</span></div>
            <p className="text-[11px] text-amber-400/90 mt-1">{risk ? `${risk.share.toFixed(0)}% of demand during the outage` : ''}</p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-dark-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Fill Rate</span>
            <Activity className="w-3.5 h-3.5 text-nexus-emerald" />
          </div>
          <div className="mt-3">
            <div className={`text-xl font-bold font-mono ${currentFillRate >= FILL_RATE_FLOOR ? 'text-nexus-emerald' : 'text-amber-400'}`}>{currentFillRate.toFixed(1)}%</div>
            <p className="text-[11px] text-slate-400 mt-1">Target floor: {FILL_RATE_FLOOR}%</p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-dark-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Backorders</span>
            <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold font-mono text-white">{fmtUnits(backorders)} <span className="text-xs text-slate-500 font-sans font-normal">units</span></div>
            <p className={`text-[11px] mt-1 ${backorders > 0 ? 'text-rose-400' : 'text-nexus-emerald'}`}>{backorders > 0 ? `Still open at day ${horizonDays}` : 'None open'}</p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-dark-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Supply Chain Cost</span>
            <DollarSign className="w-3.5 h-3.5 text-nexus-violet" />
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold font-mono text-slate-100">₹{(totalCost / 1000).toFixed(1)}k</div>
            <p className="text-[11px] text-slate-400 mt-1">All costs over {horizonDays} days</p>
          </div>
        </div>
      </div>

      {/* 3. CHARTS ROW */}
      <div className="grid grid-cols-1 gap-6">
        {/* Demand & Fulfillment */}
        <div className="p-5 rounded-xl bg-dark-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Daily Demand vs. Fulfilled Units</h3>
              <p className="text-xs text-slate-400 mt-0.5">Orders received vs units fulfilled, per day</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {horizonDays}-Day Horizon
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFulfilled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="Demand" stroke="#3B82F6" fillOpacity={1} fill="url(#colorDemand)" strokeWidth={2} />
                <Area type="monotone" dataKey="Fulfilled" stroke="#06B6D4" fillOpacity={1} fill="url(#colorFulfilled)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. RECOVERY STRATEGY PREVIEW */}
      <div className="p-5 rounded-xl bg-dark-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Candidate Recovery Strategies</h3>
            <p className="text-xs text-slate-400 mt-0.5">Simulated on the current scenario</p>
          </div>
          <Link
            to="/future-lab"
            className="text-xs text-nexus-cyan hover:underline flex items-center space-x-1 font-medium"
          >
            <span>Open Future Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {simulationResult.plans.slice(0, 4).map((plan) => {
            const isRec = plan.is_recommended;
            return (
              <div
                key={plan.id}
                className={`p-4 rounded-xl border transition-all ${
                  isRec
                    ? 'bg-slate-850/90 border-nexus-cyan/40 shadow-sm'
                    : 'bg-dark-850 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium uppercase">
                    {plan.plan_type.replace('_', ' ')}
                  </span>
                  {isRec && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-nexus-cyan text-slate-950 font-bold uppercase">
                      Recommended
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-semibold text-white mt-2.5">{plan.name}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{plan.description}</p>

                <div className="mt-3.5 pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Cost:</span>
                    <span className="font-mono font-medium text-white">₹{plan.total_cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fill Rate:</span>
                    <span className={`font-mono font-semibold ${plan.fill_rate >= 90 ? 'text-nexus-emerald' : 'text-rose-400'}`}>
                      {plan.fill_rate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Recovery Time:</span>
                    <span className="font-mono text-slate-300">{plan.recovery_time_days} days</span>
                  </div>
                </div>

                <Link
                  to="/future-lab"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className="mt-3.5 w-full block text-center py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-200 border border-slate-700 transition-all"
                >
                  Inspect Strategy →
                </Link>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
