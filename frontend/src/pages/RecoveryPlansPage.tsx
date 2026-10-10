import React, { useState } from 'react';
import { useScenario } from '../context/ScenarioContext';
import { PlanAction, RecoveryPlan } from '../types';
import { api } from '../services/api';
import {
  ShieldCheck,
  Edit3,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  Sliders,
  DollarSign,
  Activity
} from 'lucide-react';

export const RecoveryPlansPage: React.FC = () => {
  const { simulationResult, selectedPlanId, setSelectedPlanId, approvePlan, rejectPlan, modifyPlan } = useScenario();

  const [activePlanId, setActivePlanId] = useState<number>(selectedPlanId || 1);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [modifiedActions, setModifiedActions] = useState<PlanAction[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  if (!simulationResult) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-sm font-mono text-gray-400">Loading recovery plans...</p>
      </div>
    );
  }

  const plans = simulationResult.plans;
  const currentPlan = plans.find(p => p.id === activePlanId) || plans[0];

  const handleStartEdit = () => {
    setModifiedActions(JSON.parse(JSON.stringify(currentPlan.actions)));
    setIsEditing(true);
    setValidationResult(null);
  };

  const handleActionQuantityChange = (index: number, newQty: number) => {
    const updated = [...modifiedActions];
    updated[index].quantity = Math.max(0, newQty);
    updated[index].is_modified = true;
    setModifiedActions(updated);
  };

  const handleValidateActions = async () => {
    try {
      setIsValidating(true);
      const res = await api.validateActions({
        plan_id: currentPlan.id,
        scenario_id: simulationResult.scenario.id,
        actions: modifiedActions
      });
      setValidationResult(res);
    } catch (err: any) {
      console.error('Validation error:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveModifiedPlan = async () => {
    await modifyPlan(currentPlan.id, modifiedActions, 'Planner adjusted procurement quantities and revalidated constraints.');
    setIsEditing(false);
  };

  const handleApprove = async () => {
    await approvePlan(currentPlan.id, 'Formally approved through Recovery Plans execution portal.');
  };

  const handleReject = async () => {
    if (rejectionReason.trim()) {
      await rejectPlan(currentPlan.id, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
    }
  };

  const violations = currentPlan.constraint_violations || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-dark-600/40 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-nexus-cyan" />
            <span>Recovery Plan Governance & Action Execution</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Inspect, adjust, revalidate, and record binding planner approval for candidate supply-chain mitigation plans.
          </p>
        </div>

        {/* Plan Selector Buttons */}
        <div className="flex items-center space-x-2 overflow-x-auto bg-dark-800 p-1 rounded-lg border border-dark-600/60">
          {plans.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePlanId(p.id);
                setSelectedPlanId(p.id);
                setIsEditing(false);
                setValidationResult(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                p.id === activePlanId
                  ? 'bg-nexus-cyan text-black shadow-glow-cyan'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {p.name.split(' ')[0]} ({p.fill_rate}%)
            </button>
          ))}
        </div>
      </div>

      {/* Active Plan Overview Card */}
      <div className="p-6 rounded-xl bg-dark-850 border border-dark-600/50 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-dark-600/40 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">{currentPlan.name}</h3>
              {currentPlan.is_recommended && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-nexus-cyan text-black font-bold uppercase">
                  RECOMMENDED
                </span>
              )}
              {currentPlan.is_approved && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-nexus-emerald text-black font-bold uppercase">
                  APPROVED
                </span>
              )}
              {currentPlan.is_rejected && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-nexus-rose text-black font-bold uppercase">
                  REJECTED
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">{currentPlan.description}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {!isEditing ? (
              <>
                <button
                  onClick={handleStartEdit}
                  className="px-3.5 py-1.5 rounded-lg bg-dark-750 hover:bg-dark-700 text-xs font-semibold text-gray-200 border border-dark-600/60 flex items-center space-x-1.5 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5 text-nexus-cyan" />
                  <span>Modify Actions</span>
                </button>

                {!currentPlan.is_approved && (
                  <button
                    onClick={handleApprove}
                    disabled={violations.length > 0}
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-nexus-emerald to-nexus-cyan text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-glow-emerald disabled:opacity-50 transition-all flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Plan</span>
                  </button>
                )}

                {!currentPlan.is_rejected && (
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-xs font-semibold text-red-400 border border-red-500/40 flex items-center space-x-1.5 transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handleValidateActions}
                  disabled={isValidating}
                  className="px-3.5 py-1.5 rounded-lg bg-nexus-violet/20 hover:bg-nexus-violet/30 text-xs font-bold text-nexus-purple border border-nexus-violet/40 flex items-center space-x-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
                  <span>Revalidate Constraints</span>
                </button>

                <button
                  onClick={handleSaveModifiedPlan}
                  disabled={validationResult && !validationResult.is_valid}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-nexus-cyan to-nexus-blue text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-glow-cyan disabled:opacity-50 transition-all flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>

                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg bg-dark-800 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Validation Result Notification Banner */}
        {validationResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-1.5 animate-fade-in ${
              validationResult.is_valid
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/30 border-red-500/40 text-red-200'
            }`}
          >
            <div className="flex items-center space-x-2 font-bold">
              {validationResult.is_valid ? (
                <CheckCircle2 className="w-4 h-4 text-nexus-emerald" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-nexus-red" />
              )}
              <span>
                {validationResult.is_valid
                  ? 'All Physical Capacity & Lead-Time Constraints Satisfied!'
                  : 'Constraint Violations Detected — Cannot Approve in Current State'}
              </span>
            </div>

            {validationResult.violations.map((v: string, i: number) => (
              <p key={i} className="text-red-300 ml-6 text-[11px]">• {v}</p>
            ))}

            {validationResult.recalculated_cost && (
              <div className="ml-6 pt-1 text-[11px] font-mono text-gray-300">
                Recalculated Landed Cost: <span className="text-white font-bold">₹{validationResult.recalculated_cost.toLocaleString()}</span> | Fill Rate: <span className="text-nexus-cyan font-bold">{validationResult.recalculated_fill_rate}%</span>
              </div>
            )}
          </div>
        )}

        {/* Action Items List Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Action Plan Breakdown & Operational Directives
            </h4>
            <span className="text-[11px] text-gray-400">
              {isEditing ? 'Editing Mode Active — Adjust quantities below' : `${currentPlan.actions.length} Action Directives`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-dark-600/60 bg-dark-800/80 text-gray-300 font-mono">
                  <th className="py-2.5 px-3">Day</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Target Entity</th>
                  <th className="py-2.5 px-3">Item / Sourcing Details</th>
                  <th className="py-2.5 px-3">Allocated Quantity</th>
                  <th className="py-2.5 px-3">Est. Cost (₹)</th>
                  <th className="py-2.5 px-3">Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600/30">
                {(isEditing ? modifiedActions : currentPlan.actions).map((act, idx) => (
                  <tr key={act.id || idx} className="hover:bg-dark-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-white">Day {act.day}</td>
                    <td className="py-2.5 px-3 font-mono text-nexus-cyan text-[11px]">{act.action_type}</td>
                    <td className="py-2.5 px-3 font-medium text-white">{act.target_entity}</td>
                    <td className="py-2.5 px-3 text-gray-300">{act.item}</td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          max={1000}
                          value={act.quantity}
                          onChange={(e) => handleActionQuantityChange(idx, Number(e.target.value))}
                          className="w-20 bg-dark-800 border border-nexus-cyan/60 rounded px-2 py-0.5 text-xs text-white font-mono"
                        />
                      ) : (
                        `${act.quantity.toFixed(0)} units`
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-nexus-emerald">₹{act.estimated_cost?.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-gray-400 text-[11px] max-w-xs">{act.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-dark-850 border border-dark-600 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-nexus-rose">
              <XCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Reject Recovery Plan</h3>
            </div>

            <p className="text-xs text-gray-300">
              Please enter the operational reason for rejecting <span className="font-bold text-white">"{currentPlan.name}"</span>. This will be logged in the audit ledger.
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Unacceptable stockout rate or excessive air charter surcharges..."
              className="w-full bg-dark-800 border border-dark-600 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-nexus-rose"
            />

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-lg bg-dark-800 hover:bg-dark-750 text-xs font-semibold text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
