import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PlannerDecision, AuditEvent } from '../types';
import {
  History,
  ShieldCheck,
  XCircle,
  Edit3,
  Download,
  Clock,
  CheckCircle2,
  FileText,
  Activity
} from 'lucide-react';

export const DecisionHistoryPage: React.FC = () => {
  const [decisions, setDecisions] = useState<PlannerDecision[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'DECISIONS' | 'AUDIT'>('DECISIONS');

  useEffect(() => {
    Promise.all([api.getDecisionHistory(), api.getAuditLog()])
      .then(([decData, auditData]) => {
        setDecisions(decData);
        setAuditLog(auditData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-sm font-mono text-gray-400">Loading persistent decision history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-dark-600/40 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-nexus-cyan" />
            <span>Persistent Governance & Decision Ledger</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Immutable audit record of all human planner approvals, custom plan modifications, and strategy rejections stored in SQLite.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2 bg-dark-800 p-1 rounded-lg border border-dark-600/60 text-xs">
          <button
            onClick={() => setViewMode('DECISIONS')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              viewMode === 'DECISIONS' ? 'bg-nexus-cyan text-black shadow-glow-cyan' : 'text-gray-400 hover:text-white'
            }`}
          >
            Decisions Ledger ({decisions.length})
          </button>
          <button
            onClick={() => setViewMode('AUDIT')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              viewMode === 'AUDIT' ? 'bg-nexus-cyan text-black shadow-glow-cyan' : 'text-gray-400 hover:text-white'
            }`}
          >
            System Audit Log ({auditLog.length})
          </button>
        </div>
      </div>

      {/* Persistence Guarantee Banner */}
      <div className="p-3.5 rounded-xl bg-dark-850 border border-dark-600/50 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-nexus-emerald font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>SQLite Database Persistence Guaranteed: Decision records remain preserved across server restarts.</span>
        </div>
        <span className="text-[10px] font-mono text-gray-400">DB: nexus_sc.db</span>
      </div>

      {/* DECISIONS VIEW */}
      {viewMode === 'DECISIONS' && (
        <div className="p-6 rounded-xl bg-dark-850 border border-dark-600/50 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Planner Decisions History
          </h3>

          {decisions.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs space-y-2">
              <History className="w-8 h-8 mx-auto text-gray-500 opacity-50" />
              <p>No planner decisions recorded yet.</p>
              <p className="text-[11px] text-gray-400">Simulate a scenario and click "Approve Plan" or "Reject Plan" in Recovery Plans to log a decision.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-dark-600/60 bg-dark-800/80 text-gray-300 font-mono">
                    <th className="py-2.5 px-3">Decision ID</th>
                    <th className="py-2.5 px-3">Timestamp (UTC)</th>
                    <th className="py-2.5 px-3">Decision Type</th>
                    <th className="py-2.5 px-3">Recovery Plan</th>
                    <th className="py-2.5 px-3">Total Landed Cost</th>
                    <th className="py-2.5 px-3">Projected Fill Rate</th>
                    <th className="py-2.5 px-3">Planner Notes / Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-600/30">
                  {decisions.map((d) => (
                    <tr key={d.id} className="hover:bg-dark-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-white">#DEC-{d.id}</td>
                      <td className="py-2.5 px-3 font-mono text-gray-400 text-[11px]">
                        {new Date(d.decided_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            d.decision_type === 'APPROVED'
                              ? 'bg-emerald-950 text-nexus-emerald border border-emerald-500/40'
                              : d.decision_type === 'REJECTED'
                              ? 'bg-red-950 text-nexus-rose border border-red-500/40'
                              : 'bg-violet-950 text-nexus-violet border border-violet-500/40'
                          }`}
                        >
                          {d.decision_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-white">{d.plan_name || `Plan #${d.plan_id}`}</td>
                      <td className="py-2.5 px-3 font-mono text-nexus-cyan font-bold">
                        {d.total_cost ? `₹${d.total_cost.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-nexus-emerald font-semibold">
                        {d.fill_rate ? `${d.fill_rate}%` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-gray-300 text-[11px] max-w-sm">
                        {d.planner_notes || 'No notes entered.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* AUDIT LOG VIEW */}
      {viewMode === 'AUDIT' && (
        <div className="p-6 rounded-xl bg-dark-850 border border-dark-600/50 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            System & Governance Audit Trail
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-dark-600/60 bg-dark-800/80 text-gray-300 font-mono">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Event Type</th>
                  <th className="py-2.5 px-3">Actor / Role</th>
                  <th className="py-2.5 px-3">Audit Details & Verification Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600/30">
                {auditLog.map((a) => (
                  <tr key={a.id} className="hover:bg-dark-800/40">
                    <td className="py-2.5 px-3 font-mono text-gray-400 text-[11px]">
                      {new Date(a.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-nexus-cyan">{a.event_type}</td>
                    <td className="py-2.5 px-3 text-gray-300">{a.user_role}</td>
                    <td className="py-2.5 px-3 text-gray-200 text-[11px] font-mono max-w-md">
                      {a.details?.message || JSON.stringify(a.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
