import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SimulationRunResult, NetworkOverview, RecoveryPlan, PlanAction, PlannerDecision } from '../types';
import { api } from '../services/api';

interface ScenarioContextType {
  simulationResult: SimulationRunResult | null;
  network: NetworkOverview | null;
  selectedPlan: RecoveryPlan | null;
  selectedPlanId: number | null;
  decisions: PlannerDecision[];
  loading: boolean;
  isSimulating: boolean;
  error: string | null;
  toastMessage: string | null;
  setSelectedPlanId: (id: number) => void;
  fetchInitialData: () => Promise<void>;
  runCrisisSimulation: (params: {
    name: string;
    critical_supplier_id: number;
    shutdown_duration_days: number;
    demand_multiplier: number;
    alternate_supplier_capacity_multiplier: number;
    transport_cost_multiplier: number;
    starting_inventory_multiplier: number;
    production_capacity_reduction: number;
  }) => Promise<void>;
  approvePlan: (planId: number, notes?: string) => Promise<boolean>;
  rejectPlan: (planId: number, reason: string) => Promise<boolean>;
  modifyPlan: (planId: number, modifiedActions: PlanAction[], notes?: string) => Promise<boolean>;
  clearToast: () => void;
}

const ScenarioContext = createContext<ScenarioContextType | undefined>(undefined);

export const ScenarioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [simulationResult, setSimulationResult] = useState<SimulationRunResult | null>(null);
  const [network, setNetwork] = useState<NetworkOverview | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [decisions, setDecisions] = useState<PlannerDecision[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const clearToast = () => setToastMessage(null);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [netData, simData, decData] = await Promise.all([
        api.getNetworkOverview(),
        api.getLatestSimulation(),
        api.getDecisionHistory()
      ]);
      setNetwork(netData);
      setSimulationResult(simData);
      setDecisions(decData);

      if (simData.plans && simData.plans.length > 0) {
        const rec = simData.plans.find(p => p.is_recommended) || simData.plans[0];
        setSelectedPlanId(rec.id);
      }
    } catch (err: any) {
      console.error('Failed to fetch initial data:', err);
      setError(err.message || 'Failed to connect to NEXUS backend API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const runCrisisSimulation = async (params: {
    name: string;
    critical_supplier_id: number;
    shutdown_duration_days: number;
    demand_multiplier: number;
    alternate_supplier_capacity_multiplier: number;
    transport_cost_multiplier: number;
    starting_inventory_multiplier: number;
    production_capacity_reduction: number;
  }) => {
    try {
      setIsSimulating(true);
      setError(null);

      // Create the scenario and run the simulation in a single request
      const simData = await api.runNewSimulation({
        name: params.name,
        description: `Disruption scenario: ${params.shutdown_duration_days} days outage`,
        critical_supplier_id: params.critical_supplier_id,
        shutdown_duration_days: params.shutdown_duration_days,
        demand_multiplier: params.demand_multiplier,
        alternate_supplier_capacity_multiplier: params.alternate_supplier_capacity_multiplier,
        transport_cost_multiplier: params.transport_cost_multiplier,
        starting_inventory_multiplier: params.starting_inventory_multiplier,
        production_capacity_reduction: params.production_capacity_reduction
      });
      setSimulationResult(simData);

      if (simData.plans && simData.plans.length > 0) {
        const rec = simData.plans.find(p => p.is_recommended) || simData.plans[0];
        setSelectedPlanId(rec.id);
      }

      setToastMessage(`Simulation complete! Evaluated ${simData.plans.length} recovery strategies in ${simData.runtime_ms}ms.`);
    } catch (err: any) {
      console.error('Crisis simulation error:', err);
      setError(err.message || 'Simulation execution failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  const approvePlan = async (planId: number, notes?: string): Promise<boolean> => {
    try {
      setError(null);
      const dec = await api.recordDecision({
        plan_id: planId,
        decision_type: 'APPROVED',
        planner_notes: notes || 'Approved by supply chain planner'
      });
      setDecisions(prev => [dec, ...prev]);

      // Update local plan state
      if (simulationResult) {
        const updatedPlans = simulationResult.plans.map(p => ({
          ...p,
          is_approved: p.id === planId,
          is_rejected: p.id === planId ? false : p.is_rejected
        }));
        setSimulationResult({ ...simulationResult, plans: updatedPlans });
      }

      setToastMessage(`Plan #${planId} formally APPROVED. Decision recorded in governance ledger.`);
      return true;
    } catch (err: any) {
      console.error('Plan approval error:', err);
      setError(err.message || 'Failed to approve plan.');
      return false;
    }
  };

  const rejectPlan = async (planId: number, reason: string): Promise<boolean> => {
    try {
      setError(null);
      const dec = await api.recordDecision({
        plan_id: planId,
        decision_type: 'REJECTED',
        rejection_reason: reason
      });
      setDecisions(prev => [dec, ...prev]);

      // Update local plan state
      if (simulationResult) {
        const updatedPlans = simulationResult.plans.map(p => 
          p.id === planId ? { ...p, is_rejected: true, is_approved: false, rejection_reason: reason } : p
        );
        setSimulationResult({ ...simulationResult, plans: updatedPlans });
      }

      setToastMessage(`Plan #${planId} REJECTED with logged rationale.`);
      return true;
    } catch (err: any) {
      console.error('Plan rejection error:', err);
      setError(err.message || 'Failed to reject plan.');
      return false;
    }
  };

  const modifyPlan = async (planId: number, modifiedActions: PlanAction[], notes?: string): Promise<boolean> => {
    try {
      setError(null);
      const dec = await api.recordDecision({
        plan_id: planId,
        decision_type: 'MODIFIED',
        modified_actions: modifiedActions,
        planner_notes: notes || 'Manual parameter adjustment by planner'
      });
      setDecisions(prev => [dec, ...prev]);

      // Refresh latest simulation to get recalculated numbers
      const simData = await api.getLatestSimulation();
      setSimulationResult(simData);

      setToastMessage(`Plan #${planId} modified and revalidated. Recalculated total cost: ₹${dec.total_cost?.toLocaleString() || ''}`);
      return true;
    } catch (err: any) {
      console.error('Plan modification error:', err);
      setError(err.message || 'Failed to modify plan.');
      return false;
    }
  };

  const selectedPlan = simulationResult?.plans.find(p => p.id === selectedPlanId) || simulationResult?.plans[0] || null;

  return (
    <ScenarioContext.Provider
      value={{
        simulationResult,
        network,
        selectedPlan,
        selectedPlanId,
        decisions,
        loading,
        isSimulating,
        error,
        toastMessage,
        setSelectedPlanId,
        fetchInitialData,
        runCrisisSimulation,
        approvePlan,
        rejectPlan,
        modifyPlan,
        clearToast
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
};

export const useScenario = () => {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error('useScenario must be used within a ScenarioProvider');
  }
  return context;
};
