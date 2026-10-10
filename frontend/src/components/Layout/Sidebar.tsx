import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  AlertTriangle,
  FlaskConical,
  Bot,
  ShieldCheck,
  BarChart3,
  Database,
  History,
  Settings,
  Radio,
  ChevronDown
} from 'lucide-react';
import { useScenario } from '../../context/ScenarioContext';

const MAIN_ITEMS = [
  { name: 'Command Center', path: '/', icon: LayoutDashboard },
  { name: 'Supply Network', path: '/network', icon: Network },
  { name: 'Crisis Simulator', path: '/crisis-simulator', icon: AlertTriangle },
  { name: 'AI Decision Engine', path: '/future-lab', icon: FlaskConical },
];

const MORE_ITEMS = [
  { name: 'Recovery Plans', path: '/recovery-plans', icon: ShieldCheck },
  { name: 'AI Swarm Agents', path: '/agents', icon: Bot },
  { name: 'Benchmarks', path: '/benchmarks', icon: BarChart3 },
  { name: 'Data Explorer', path: '/data-explorer', icon: Database },
  { name: 'Audit & Decisions', path: '/decision-history', icon: History },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { simulationResult, decisions } = useScenario();
  const [showMore, setShowMore] = useState(false);
  const approvedCount = decisions.filter(d => d.decision_type === 'APPROVED').length;

  return (
    <aside className="w-64 bg-dark-900 border-r border-slate-800/80 flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-nexus-cyan/15 border border-nexus-cyan/30 flex items-center justify-center text-nexus-cyan">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-wider text-white">NEXUS</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium border border-slate-700">v1.0</span>
            </div>
            <p className="text-[11px] text-slate-400">Supply Chain Resilience</p>
          </div>
        </div>
      </div>

      {/* Disruption Alert Pill in Sidebar */}
      {simulationResult?.active_disruption?.is_active && (
        <div className="mx-3 my-2.5 px-3 py-2 rounded-lg bg-red-950/30 border border-red-500/20 text-xs text-red-300 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <div className="truncate">
            <p className="font-medium text-red-300 text-xs">SUP-01 Outage</p>
            <p className="text-[10px] text-slate-400">{simulationResult.active_disruption.shutdown_days}-Day Disruption</p>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500 px-3 py-1">
          Navigation
        </div>

        {MAIN_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700/80 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 text-slate-400" />
                <span>{item.name}</span>
              </div>

            </NavLink>
          );
        })}
        <button
          onClick={() => setShowMore(v => !v)}
          className="w-full mt-4 flex items-center justify-between px-3 py-2 text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500 hover:text-slate-300"
        >
          <span>More tools</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMore ? 'rotate-180' : ''}`} />
        </button>
        {showMore && MORE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive ? 'bg-slate-800 text-white border border-slate-700/80' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-4 h-4 text-slate-400" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-slate-800/80 bg-dark-950/40">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Decisions Logged:</span>
          <span className="font-mono text-nexus-emerald font-medium">{approvedCount} Approved</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Currency:</span>
          <span className="font-mono text-slate-400">INR (₹)</span>
        </div>
      </div>
    </aside>
  );
};
