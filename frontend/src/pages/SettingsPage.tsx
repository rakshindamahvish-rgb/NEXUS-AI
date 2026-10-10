import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useScenario } from '../context/ScenarioContext';
import {
  Settings,
  Shield,
  Activity,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Layers,
  Info,
  Server
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { fetchInitialData } = useScenario();
  const [health, setHealth] = useState<any>(null);
  const [assumptions, setAssumptions] = useState<any>(null);
  const [isReseeding, setIsReseeding] = useState<boolean>(false);
  const [reseedMsg, setReseedMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getHealth(), api.getAssumptions()])
      .then(([h, a]) => {
        setHealth(h);
        setAssumptions(a);
      })
      .catch(console.error);
  }, []);

  const handleReseed = async () => {
    try {
      setIsReseeding(true);
      const res = await api.reseedDatabase();
      setReseedMsg(res.message);
      await fetchInitialData();
    } catch (err: any) {
      setReseedMsg(`Reseed failed: ${err.message}`);
    } finally {
      setIsReseeding(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-dark-600/40 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Settings className="w-5 h-5 text-nexus-cyan" />
            <span>Settings, Cost Assumptions & Engine Configuration</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            System health, global simulation constants, solver configurations, and demonstration environment controls.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health & Architecture */}
        <div className="p-6 rounded-xl bg-dark-850 border border-dark-600/50 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 text-nexus-cyan">
            <Server className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white">System Runtime & Health</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2.5 bg-dark-800 rounded-lg border border-dark-600/40">
              <span className="text-gray-400">Backend API Status:</span>
              <span className="font-mono text-nexus-emerald font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{health?.status?.toUpperCase() || 'ONLINE'}</span>
              </span>
            </div>
            <div className="flex justify-between p-2.5 bg-dark-800 rounded-lg border border-dark-600/40">
              <span className="text-gray-400">Engine Version:</span>
              <span className="font-mono text-white">v1.0.0 (Agentic Hackathon Release)</span>
            </div>
            <div className="flex justify-between p-2.5 bg-dark-800 rounded-lg border border-dark-600/40">
              <span className="text-gray-400">Environment Mode:</span>
              <span className="font-mono text-nexus-cyan">Local Offline Deterministic Swarm</span>
            </div>
            <div className="flex justify-between p-2.5 bg-dark-800 rounded-lg border border-dark-600/40">
              <span className="text-gray-400">Optimization Solver:</span>
              <span className="font-mono text-nexus-violet">SciPy HiGHS Dual-Simplex LP Solver</span>
            </div>
            <div className="flex justify-between p-2.5 bg-dark-800 rounded-lg border border-dark-600/40">
              <span className="text-gray-400">Database Engine:</span>
              <span className="font-mono text-gray-300">SQLite + SQLAlchemy (Persistent)</span>
            </div>
          </div>
        </div>

        {/* Global Cost Assumptions */}
        <div className="p-6 rounded-xl bg-dark-850 border border-dark-600/50 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 text-nexus-violet">
            <Activity className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white">Baseline Cost Assumptions (INR ₹)</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2.5 bg-dark-800 rounded-lg border border-dark-600/40">
              <span className="text-gray-400">Currency Standard:</span>
              <span className="font-mono text-white font-bold">Indian Rupee (INR — ₹)</span>
            </div>
            <div className="flex justify-between p-2.5 bg-dark-800 rounded-lg border border-dark-600/40">
              <span className="text-gray-400">Planning Horizon:</span>
              <span className="font-mono text-nexus-cyan font-bold">{assumptions?.planning_horizon_days || 7} Days</span>
            </div>
            <div className="flex justify-between p-2.5 bg-dark-800 rounded-lg border border-dark-600/40">
              <span className="text-gray-400">Factory Base Operating Cost:</span>
              <span className="font-mono text-white">₹{assumptions?.standard_factory_base_operating_cost || 80}/unit</span>
            </div>
            <div className="flex justify-between p-2.5 bg-dark-800 rounded-lg border border-dark-600/40">
              <span className="text-gray-400">Factory Overtime Operating Cost:</span>
              <span className="font-mono text-nexus-amber font-semibold">₹{assumptions?.standard_factory_overtime_rate || 120}/unit</span>
            </div>
            <div className="flex justify-between p-2.5 bg-dark-800 rounded-lg border border-dark-600/40">
              <span className="text-gray-400">Average Holding Cost:</span>
              <span className="font-mono text-gray-300">₹{assumptions?.average_holding_cost_rate || 12.5}/unit/day</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Reseed & Reset Actions */}
      <div className="p-6 rounded-xl bg-dark-850 border border-dark-600/50 space-y-4 shadow-xl">
        <div className="flex items-center space-x-2 text-nexus-amber">
          <RotateCcw className="w-5 h-5" />
          <h3 className="text-sm font-bold text-white">Demonstration Environment Controls</h3>
        </div>

        <p className="text-xs text-gray-400 max-w-2xl">
          Reset all network entities, supplier inventories, baseline demands, and routes to the clean reproducible synthetic dataset.
        </p>

        {reseedMsg && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-nexus-emerald flex-shrink-0" />
            <span>{reseedMsg}</span>
          </div>
        )}

        <button
          onClick={handleReseed}
          disabled={isReseeding}
          className="px-4 py-2 rounded-lg bg-dark-750 hover:bg-dark-700 text-xs font-bold text-white border border-dark-600 flex items-center space-x-2 transition-all disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin' : ''}`} />
          <span>{isReseeding ? 'Resetting Database...' : 'Reseed Demonstration Database'}</span>
        </button>
      </div>
    </div>
  );
};
