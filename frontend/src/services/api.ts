import {
  NetworkOverview,
  SimulationRunResult,
  BenchmarkComparison,
  PlannerDecision,
  AuditEvent,
  ValidationResult,
  PlanAction,
  Scenario
} from '../types';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api/v1' : 'http://localhost:8000/api/v1');

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorBody.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Health & Assumptions
  getHealth: async () => {
    return handleResponse<{ status: string; service: string; currency: string }>(
      await fetch(`${API_BASE}/settings/health`)
    );
  },
  getAssumptions: async () => {
    return handleResponse<Record<string, any>>(
      await fetch(`${API_BASE}/settings/assumptions`)
    );
  },
  reseedDatabase: async () => {
    return handleResponse<{ status: string; message: string }>(
      await fetch(`${API_BASE}/settings/reseed`, { method: 'POST' })
    );
  },

  // Network
  getNetworkOverview: async (): Promise<NetworkOverview> => {
    return handleResponse<NetworkOverview>(
      await fetch(`${API_BASE}/network/overview`)
    );
  },

  // Simulation
  getLatestSimulation: async (): Promise<SimulationRunResult> => {
    return handleResponse<SimulationRunResult>(
      await fetch(`${API_BASE}/simulation/latest`)
    );
  },
  createScenario: async (payload: {
    name: string;
    description?: string;
    critical_supplier_id: number;
    shutdown_duration_days: number;
    demand_multiplier: number;
    alternate_supplier_capacity_multiplier: number;
    transport_cost_multiplier: number;
    starting_inventory_multiplier: number;
    production_capacity_reduction: number;
  }): Promise<Scenario> => {
    return handleResponse<Scenario>(
      await fetch(`${API_BASE}/simulation/scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    );
  },
  runNewSimulation: async (payload: {
    name: string;
    description?: string;
    critical_supplier_id: number;
    shutdown_duration_days: number;
    demand_multiplier: number;
    alternate_supplier_capacity_multiplier: number;
    transport_cost_multiplier: number;
    starting_inventory_multiplier: number;
    production_capacity_reduction: number;
  }): Promise<SimulationRunResult> => {
    return handleResponse<SimulationRunResult>(
      await fetch(`${API_BASE}/simulation/run-new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    );
  },
  runSimulation: async (scenarioId: number): Promise<SimulationRunResult> => {
    return handleResponse<SimulationRunResult>(
      await fetch(`${API_BASE}/simulation/run/${scenarioId}`, {
        method: 'POST'
      })
    );
  },
  validateActions: async (payload: {
    plan_id?: number;
    scenario_id?: number;
    actions: PlanAction[];
  }): Promise<ValidationResult> => {
    return handleResponse<ValidationResult>(
      await fetch(`${API_BASE}/simulation/validate-actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    );
  },

  // Agents
  getAgentRecommendations: async (scenarioId: number) => {
    return handleResponse<any[]>(
      await fetch(`${API_BASE}/agents/recommendations/${scenarioId}`)
    );
  },

  // Benchmarks
  getBenchmarks: async (scenarioId: number): Promise<BenchmarkComparison> => {
    return handleResponse<BenchmarkComparison>(
      await fetch(`${API_BASE}/benchmarks/compare/${scenarioId}`)
    );
  },

  // Governance & Decisions
  recordDecision: async (payload: {
    plan_id: number;
    decision_type: 'APPROVED' | 'REJECTED' | 'MODIFIED';
    planner_notes?: string;
    modified_actions?: PlanAction[];
    rejection_reason?: string;
  }): Promise<PlannerDecision> => {
    return handleResponse<PlannerDecision>(
      await fetch(`${API_BASE}/governance/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    );
  },
  getDecisionHistory: async (): Promise<PlannerDecision[]> => {
    return handleResponse<PlannerDecision[]>(
      await fetch(`${API_BASE}/governance/decisions`)
    );
  },
  getAuditLog: async (): Promise<AuditEvent[]> => {
    return handleResponse<AuditEvent[]>(
      await fetch(`${API_BASE}/governance/audit-log`)
    );
  },

  // Data Explorer & Provenance
  getDataProvenance: async () => {
    return handleResponse<Record<string, any>>(
      await fetch(`${API_BASE}/data/provenance`)
    );
  },
  exportCsvUrl: (entityType: string) => `${API_BASE}/data/export/csv/${entityType}`,
  importCsv: async (entityType: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/data/import/csv/${entityType}`, {
      method: 'POST',
      body: formData
    });
    return handleResponse<any>(res);
  }
};
