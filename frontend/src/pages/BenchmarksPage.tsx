import React, { useState, useEffect } from 'react';
import { useScenario } from '../context/ScenarioContext';
import { api } from '../services/api';
import { BenchmarkComparison } from '../types';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  HelpCircle,
  Activity,
  DollarSign,
  TrendingUp,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const BenchmarksPage: React.FC = () => {
  const { simulationResult } = useScenario();
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkComparison | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (simulationResult?.scenario?.id) {
      api.getBenchmarks(simulationResult.scenario.id)
        .then(data => setBenchmarkData(data))
        .catch(err => console.error('Benchmark fetch error:', err))
        .finally(() => setLoading(false));
    }
  }, [simulationResult]);

  if (loading || !benchmarkData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-sm font-mono text-gray-400">Loading benchmark comparisons...</p>
      </div>
    );
  }

  const comparison = benchmarkData.metrics_comparison;

  const chartData = comparison.map(c => ({
    name: c.name.split(' ')[0],
    'Fill Rate (%)': c.fill_rate_pct,
    'Cost (₹k)': Math.round(c.total_landed_cost_inr / 1000),
    'Backorders (Units)': c.backorders_units,
    'Recovery Days': c.recovery_time_days
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-dark-600/40 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-nexus-cyan" />
            <span>Methodology Benchmarks & LP Solver Validation</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Rigorous side-by-side evaluation of 3 distinct planning algorithms on strictly identical inputs and constraints.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-600/60 text-gray-300">
          Identical Scenario ID: #{benchmarkData.scenario_id}
        </div>
      </div>

      {/* Benchmark Methodology Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-4 rounded-xl bg-dark-850 border border-dark-600/60 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-750 text-gray-400 font-bold uppercase">METHOD 1</span>
            <h4 className="text-xs font-bold text-white">Reorder-Rule Baseline</h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            {benchmarkData.method_descriptions.REORDER_RULE}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-dark-850 border border-dark-600/60 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-nexus-violet/20 text-nexus-violet font-bold uppercase">METHOD 2</span>
            <h4 className="text-xs font-bold text-white">SciPy HiGHS Exact LP</h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            {benchmarkData.method_descriptions.OPTIMIZATION_LP}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-dark-850 border border-nexus-cyan/40 shadow-glow-cyan space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-nexus-cyan text-black font-bold uppercase">METHOD 3</span>
            <h4 className="text-xs font-bold text-white">Agent-Coordinated Planning</h4>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            {benchmarkData.method_descriptions.COORDINATED_AGENT}
          </p>
        </div>
      </div>

      {/* Main Benchmark Comparison Table */}
      <div className="p-6 rounded-xl bg-dark-850 border border-dark-600/50 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Comparative Benchmark Matrix (Identical Initial State)
          </h3>
          <span className="text-[11px] text-gray-400">100% Measured Outputs — No Fabricated Values</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-dark-600/60 bg-dark-800/80 text-gray-300 font-mono">
                <th className="py-3 px-3">Planning Methodology</th>
                <th className="py-3 px-3">Customer Fill Rate</th>
                <th className="py-3 px-3">Ending Backorders</th>
                <th className="py-3 px-3">Total Landed Cost (₹)</th>
                <th className="py-3 px-3">Recovery Time</th>
                <th className="py-3 px-3">Days of Inventory</th>
                <th className="py-3 px-3">Violations</th>
                <th className="py-3 px-3">Solver Runtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600/30 font-mono">
              {comparison.map((item, idx) => {
                const isRec = item.is_recommended;
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-dark-800/40 ${isRec ? 'bg-nexus-cyan/5 font-semibold' : ''}`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-bold">{item.name}</span>
                        {isRec && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-nexus-cyan text-black font-bold uppercase">
                            RECOMMENDED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={item.fill_rate_pct >= 90 ? 'text-nexus-emerald font-bold' : 'text-nexus-rose'}>
                        {item.fill_rate_pct}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-200">{item.backorders_units.toFixed(0)} units</td>
                    <td className="py-3 px-3 font-bold text-nexus-cyan">₹{item.total_landed_cost_inr.toLocaleString()}</td>
                    <td className="py-3 px-3 text-gray-300">{item.recovery_time_days} days</td>
                    <td className="py-3 px-3 text-gray-400">{item.inventory_days} days</td>
                    <td className="py-3 px-3">
                      {item.constraint_violations_count === 0 ? (
                        <span className="text-nexus-emerald font-bold">0 Valid</span>
                      ) : (
                        <span className="text-nexus-rose font-bold">{item.constraint_violations_count} Violations</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-400 font-mono">{item.runtime_ms}ms</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Benchmark Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-dark-850 border border-dark-600/50">
          <h4 className="text-xs font-bold text-white mb-3">Fill Rate vs. Landed Cost Trade-Off</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Fill Rate (%)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cost (₹k)" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-dark-850 border border-dark-600/50">
          <h4 className="text-xs font-bold text-white mb-3">Unfilled Backorders vs. Recovery Horizon</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Backorders (Units)" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Recovery Days" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
