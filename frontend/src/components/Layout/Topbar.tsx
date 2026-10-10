import React from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw, Play, Activity } from 'lucide-react';
import { useScenario } from '../../context/ScenarioContext';

export const Topbar: React.FC = () => {
  const location = useLocation();
  const { simulationResult, isSimulating, runCrisisSimulation } = useScenario();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return 'Command Center';
      case '/network': return 'Supply Network';
      case '/crisis-simulator': return 'Crisis Simulator';
      case '/future-lab': return 'AI Decision Engine';
      case '/agents': return 'Agent Operations';
      case '/recovery-plans': return 'Recovery Plans';
      case '/benchmarks': return 'Performance & Benchmarks';
      case '/data-explorer': return 'Data Explorer';
      case '/decision-history': return 'Decision Ledger';
      case '/settings': return 'Settings & Assumptions';
      default: return 'Control Tower';
    }
  };

  const handleQuickResimulate = () => {
    runCrisisSimulation({
      name: 'Standard 7-Day Outage Scenario',
      critical_supplier_id: 1,
      shutdown_duration_days: 7,
      demand_multiplier: 1.0,
      alternate_supplier_capacity_multiplier: 1.0,
      transport_cost_multiplier: 1.0,
      starting_inventory_multiplier: 1.0,
      production_capacity_reduction: 0.0
    });
  };

  return (
    <header className="bg-dark-900/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-20 px-6 py-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight">
            {getPageTitle(location.pathname)}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {simulationResult ? simulationResult.scenario.name : 'Initializing...'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {simulationResult && (
            <div className="hidden sm:flex items-center space-x-2 bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
              <Activity className="w-3.5 h-3.5 text-nexus-cyan" />
              <span className="text-slate-400">Fill Rate:</span>
              <span className="font-mono font-semibold text-white">
                {(simulationResult.plans.find(p => p.is_recommended)?.fill_rate ?? 0).toFixed(1)}%
              </span>
            </div>
          )}

          <div className="hidden md:flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-nexus-emerald inline-block" />
            <span>Connected</span>
          </div>

          <button
            onClick={handleQuickResimulate}
            disabled={isSimulating}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-nexus-cyan hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all disabled:opacity-50 shadow-sm active:scale-95"
            title="Rerun default 7-day crisis simulation"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>Run Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
