import React from 'react';
import { useScenario } from '../context/ScenarioContext';
import { Bot, CheckCircle2, Cpu, Clock, ShieldCheck, Activity, Layers, ArrowRight } from 'lucide-react';

export const AgentOperationsPage: React.FC = () => {
  const { simulationResult } = useScenario();

  if (!simulationResult) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-sm font-mono text-gray-400">Loading Agent Swarm operations...</p>
      </div>
    );
  }

  const agents = simulationResult.agents;
  const coordinator = agents.find(a => a.agent_name.includes('Coordinator')) || agents[agents.length - 1];
  const specializedAgents = agents.filter(a => !a.agent_name.includes('Coordinator'));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-dark-600/40 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Bot className="w-5 h-5 text-nexus-violet" />
            <span>Multi-Agent Swarm Operations Room</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            8 autonomous domain agents analyzing real-time demand, stock depletion, sourcing risks, logistics routes, production constraints, and financial trade-offs.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-dark-800 px-3 py-1.5 rounded-lg border border-dark-600/60 text-xs">
          <span className="w-2 h-2 rounded-full bg-nexus-emerald animate-pulse" />
          <span className="font-mono text-gray-300">Swarm Consensus: 100% Deterministic</span>
        </div>
      </div>

      {/* Coordinator Consensus Banner */}
      {coordinator && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-violet-950/40 via-dark-850 to-dark-850 border border-nexus-violet/50 shadow-glow-violet space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-nexus-violet/20 text-nexus-violet border border-nexus-violet/40">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-nexus-violet/30 text-nexus-purple font-bold uppercase">
                  AGENT 8 — CONSENSUS SYNTHESIS
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">{coordinator.agent_name}</h3>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="text-gray-400">Execution: {coordinator.execution_time_ms}ms</span>
              <span className="text-nexus-emerald font-semibold">Confidence: {(coordinator.confidence_score * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div className="p-3.5 bg-dark-800/80 rounded-xl border border-dark-600/40 text-xs space-y-2">
            <div>
              <span className="font-semibold text-nexus-cyan block mb-1">Synthesized Directive:</span>
              <p className="text-gray-200 leading-relaxed">{coordinator.proposed_action}</p>
            </div>
            <div className="pt-2 border-t border-dark-600/30">
              <span className="font-semibold text-gray-400 block mb-1">Consensus Rationale & Conflict Resolution:</span>
              <p className="text-gray-300 leading-relaxed text-[11px]">{coordinator.rationale}</p>
            </div>
          </div>
        </div>
      )}

      {/* 7 Specialized Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {specializedAgents.map((ag, idx) => (
          <div
            key={ag.id || idx}
            className="p-4 rounded-xl bg-dark-850 border border-dark-600/60 space-y-3 shadow-md hover:border-dark-500 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-dark-600/30">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-nexus-cyan" />
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-dark-750 text-gray-300 font-semibold uppercase">
                    Agent {idx + 1}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-400">{ag.execution_time_ms}ms</span>
              </div>

              <h4 className="text-xs font-bold text-white mt-2">{ag.agent_name}</h4>
              <p className="text-[11px] text-nexus-cyan font-mono">{ag.agent_role}</p>

              <div className="mt-3 space-y-2 text-xs">
                <div className="p-2.5 bg-dark-800/80 rounded-lg border border-dark-600/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Proposed Action:</span>
                  <p className="text-gray-200 text-[11px] leading-relaxed">{ag.proposed_action}</p>
                </div>

                <div className="p-2.5 bg-dark-800/40 rounded-lg border border-dark-600/20 text-[11px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Domain Rationale:</span>
                  <p className="text-gray-300 leading-relaxed">{ag.rationale}</p>
                </div>
              </div>
            </div>

            {/* Key Metrics Pill Grid */}
            {ag.key_metrics && Object.keys(ag.key_metrics).length > 0 && (
              <div className="mt-3 pt-2 border-t border-dark-600/30 grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                {Object.entries(ag.key_metrics).slice(0, 4).map(([k, v]) => (
                  <div key={k} className="p-1.5 bg-dark-800 rounded border border-dark-600/30 truncate">
                    <span className="text-gray-400 block truncate">{k.replace(/_/g, ' ')}:</span>
                    <span className="text-nexus-cyan font-semibold block truncate">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
