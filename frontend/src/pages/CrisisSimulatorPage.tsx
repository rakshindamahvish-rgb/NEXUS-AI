import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScenario } from '../context/ScenarioContext';
import { AlertTriangle, Play, RotateCcw, Sliders, ShieldAlert, Cpu, CheckCircle2, ArrowRight, Zap } from 'lucide-react';

export const CrisisSimulatorPage: React.FC = () => {
  const navigate = useNavigate();
  const { simulationResult, network, isSimulating, runCrisisSimulation } = useScenario();

  // Scenario form state
  const criticalSupplierId = 1; // the engine models SUP-01 (MCU-X supplier) as the disrupted node
  const [shutdownDays, setShutdownDays] = useState<number>(7);
  const [demandMultiplier, setDemandMultiplier] = useState<number>(1.0);
  const [altCapacityMult, setAltCapacityMult] = useState<number>(1.0);
  const [transportCostMult, setTransportCostMult] = useState<number>(1.0);
  const [startingInvMult, setStartingInvMult] = useState<number>(1.0);
  const [prodCapReduction, setProdCapReduction] = useState<number>(0.0);

    const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    await runCrisisSimulation({
      name: `${shutdownDays}-Day Critical Outage (${demandMultiplier > 1 ? `+${((demandMultiplier-1)*100).toFixed(0)}% Demand` : 'Baseline Demand'})`,
      critical_supplier_id: criticalSupplierId,
      shutdown_duration_days: shutdownDays,
      demand_multiplier: demandMultiplier,
      alternate_supplier_capacity_multiplier: altCapacityMult,
      transport_cost_multiplier: transportCostMult,
      starting_inventory_multiplier: startingInvMult,
      production_capacity_reduction: prodCapReduction
    });

  };

  const handleResetDefaults = () => {
    setShutdownDays(7);
    setDemandMultiplier(1.0);
    setAltCapacityMult(1.0);
    setTransportCostMult(1.0);
    setStartingInvMult(1.0);
    setProdCapReduction(0.0);
  };

  const suppliers = network?.suppliers || [];
  const activeDisruption = simulationResult?.active_disruption;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-dark-600/40 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-nexus-red" />
            <span>Crisis Simulator Console</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure supply disruption parameters, stress-test demand volatility, and run multi-agent resilience simulations.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          disabled={isSimulating}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 text-xs font-semibold text-gray-300 border border-dark-600/60 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restore Defaults</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSimulate} className="p-6 rounded-xl bg-dark-850 border border-dark-600/50 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-dark-600/40 pb-3">
              <span className="text-xs font-mono font-bold uppercase text-nexus-cyan flex items-center space-x-2">
                <Sliders className="w-4 h-4" />
                <span>Disruption & Stress-Test Controls</span>
              </span>
              <span className="text-[10px] text-gray-400">All changes trigger full discrete-time recalculation</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Outage Duration Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-gray-300">Outage Duration</label>
                  <span className="text-xs font-mono font-bold text-nexus-red">{shutdownDays} Days</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={7}
                  step={1}
                  value={shutdownDays}
                  onChange={(e) => setShutdownDays(Number(e.target.value))}
                  className="w-full accent-nexus-red cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>1 Day</span>
                  <span className="text-nexus-red font-semibold">Modelled horizon: 7 days</span>
                  <span>7 Days</span>
                </div>
              </div>

              {/* Demand Multiplier Slider & Quick Presets */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-gray-300">Customer Demand Multiplier</label>
                  <span className="text-xs font-mono font-bold text-nexus-cyan">{demandMultiplier.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.05}
                  value={demandMultiplier}
                  onChange={(e) => setDemandMultiplier(Number(e.target.value))}
                  className="w-full accent-nexus-cyan cursor-pointer"
                />
                <div className="flex items-center space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setDemandMultiplier(1.0)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${demandMultiplier === 1.0 ? 'bg-nexus-cyan text-black font-bold' : 'bg-dark-750 text-gray-300 border-dark-600'}`}
                  >
                    1.0x (Baseline)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemandMultiplier(1.2)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${demandMultiplier === 1.2 ? 'bg-nexus-cyan text-black font-bold' : 'bg-dark-750 text-gray-300 border-dark-600'}`}
                  >
                    1.2x (+20% Surge)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemandMultiplier(1.4)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${demandMultiplier === 1.4 ? 'bg-nexus-cyan text-black font-bold' : 'bg-dark-750 text-gray-300 border-dark-600'}`}
                  >
                    1.4x (+40% Surge)
                  </button>
                </div>
              </div>

              {/* Alternate Supplier Capacity Multiplier */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-gray-300">Alternate Supplier (SUP-02) Capacity</label>
                  <span className="text-xs font-mono font-bold text-nexus-violet">{(altCapacityMult * 300).toFixed(0)} units/day ({(altCapacityMult * 100).toFixed(0)}%)</span>
                </div>
                <input
                  type="range"
                  min={0.3}
                  max={1.5}
                  step={0.1}
                  value={altCapacityMult}
                  onChange={(e) => setAltCapacityMult(Number(e.target.value))}
                  className="w-full accent-nexus-violet cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>-70% Capacity</span>
                  <span>100% (300 u/d)</span>
                  <span>+50% Overdrive</span>
                </div>
              </div>

              {/* Freight Cost Multiplier */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-gray-300">Transportation & Expediting Surcharge</label>
                  <span className="text-xs font-mono font-bold text-nexus-amber">{transportCostMult.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.8}
                  max={2.5}
                  step={0.1}
                  value={transportCostMult}
                  onChange={(e) => setTransportCostMult(Number(e.target.value))}
                  className="w-full accent-nexus-amber cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>Standard</span>
                  <span>+25% Fuel Spike</span>
                  <span>+150% Emergency Charter</span>
                </div>
              </div>

              {/* Starting Buffer Inventory Multiplier */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-gray-300">Initial On-Hand Inventory Level</label>
                  <span className="text-xs font-mono font-bold text-white">{(startingInvMult * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={1.6}
                  step={0.1}
                  value={startingInvMult}
                  onChange={(e) => setStartingInvMult(Number(e.target.value))}
                  className="w-full accent-white cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>40% (Lean Buffer)</span>
                  <span>100% (Baseline)</span>
                  <span>160% (High Buffer)</span>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-dark-600/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-gray-400">
                Runs every recovery strategy on these inputs.
              </div>

              <button
                type="submit"
                disabled={isSimulating}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-nexus-blue text-white font-semibold text-sm hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSimulating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Running simulation…</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Run Simulation</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Progress State Display */}
          {isSimulating && (
            <div className="p-4 rounded-xl bg-dark-850 border border-nexus-cyan/40 shadow-glow-cyan space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-nexus-cyan">Running simulation…</span>
                <span className="text-[10px] font-mono text-gray-400"></span>
              </div>
              <div className="w-full bg-dark-700 h-2 rounded-full overflow-hidden">
                <div className="bg-nexus-blue h-full animate-pulse w-3/4 rounded-full" />
              </div>
            </div>
          )}

          {/* Latest simulation results (recommended plan from the real run) */}
          {simulationResult && !isSimulating && (() => {
            const plan = simulationResult.plans.find(p => p.is_recommended) || simulationResult.plans[0];
            return (
              <div className="p-6 rounded-xl bg-dark-850 border border-dark-600/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Latest simulation result</h3>
                  <span className="text-[11px] text-gray-400">{plan.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><div className="text-xs text-gray-400">Fill rate</div><div className="mt-1 text-xl font-bold font-mono text-white">{plan.fill_rate.toFixed(1)}%</div></div>
                  <div><div className="text-xs text-gray-400">Backorders</div><div className="mt-1 text-xl font-bold font-mono text-white">{Math.round(plan.backorders).toLocaleString()}</div></div>
                  <div><div className="text-xs text-gray-400">Total cost</div><div className="mt-1 text-xl font-bold font-mono text-white">₹{Math.round(plan.total_cost).toLocaleString('en-IN')}</div></div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right: Disruption Impact Summary & Quick Actions */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-dark-850 border border-dark-600/50 space-y-4">
            <div className="flex items-center space-x-2 text-nexus-red">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Disruption Impact Model</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-red-950/30 rounded-lg border border-red-500/30 space-y-1">
                <span className="font-semibold text-red-300 block">Sourcing Bottleneck:</span>
                <p className="text-gray-300">
                  The primary MCU-X supplier is offline for <span className="font-mono font-bold text-red-400">{shutdownDays} days</span>. Normal supply not delivered: <span className="font-mono font-bold text-white">{(shutdownDays * 300).toLocaleString()} MCU-X units</span>.
                </p>
              </div>

              <div className="p-3 bg-dark-800/60 rounded-lg border border-dark-600/40 space-y-1">
                <span className="font-semibold text-nexus-violet block">Affected Finished Products:</span>
                <ul className="list-disc list-inside text-gray-300 space-y-0.5 font-mono text-[11px]">
                  <li>PRD-01: SmartSensor Hub (1x MCU-X)</li>
                  <li>PRD-02: Industrial IoT Gateway (2x MCU-X)</li>
                  <li>PRD-03: Telematics Fleet Tracker (1x MCU-X)</li>
                </ul>
              </div>

              <div className="p-3 bg-dark-800/60 rounded-lg border border-dark-600/40 space-y-1">
                <span className="font-semibold text-nexus-emerald block">Resilient / Immune Lines:</span>
                <p className="text-gray-300 text-[11px]">
                  PRD-04 (EcoPower Smart Monitor) does not require microcontrollers and continues at 100% factory capacity.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/future-lab')}
              className="w-full py-2.5 rounded-lg bg-dark-750 hover:bg-dark-700 text-xs font-bold text-nexus-cyan border border-nexus-cyan/40 hover:border-nexus-cyan transition-all flex items-center justify-center space-x-1.5"
            >
              <span>Compare Recovery Strategies</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
