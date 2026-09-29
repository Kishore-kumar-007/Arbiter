import type { AppState, Strategy, AuditRecord, ScenarioDefinition } from '../types/domain';

// Central API Service connecting to FastAPI backend
// Mocks unimplemented endpoints for the hackathon demo

export const api = {
  getState: async (): Promise<AppState> => {
    const res = await fetch('/api/state');
    if (!res.ok) throw new Error('Failed to fetch state');
    return res.json();
  },

  generateStrategies: async (): Promise<Strategy[]> => {
    const res = await fetch('/api/strategies/generate', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate strategies');
    return res.json();
  },

  getScenarios: async (): Promise<ScenarioDefinition[]> => {
    const res = await fetch('/api/scenarios');
    if (!res.ok) throw new Error('Failed to fetch scenarios');
    return res.json();
  },

  loadScenario: async (scenarioId: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/scenarios/${scenarioId}/load`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to load scenario');
    return res.json();
  },

  // --- MOCKED ENDPOINTS (To be implemented in backend) ---

  submitDecision: async (strategyId: string, action: 'APPROVE' | 'REJECT' | 'MODIFY'): Promise<{ success: boolean }> => {
    console.log(`[MOCK API] Decision submitted: ${action} for strategy ${strategyId}`);
    return new Promise(resolve => setTimeout(() => resolve({ success: true }), 800));
  },

  simulateScenario: async (request: import('../types/domain').SimulationRequest): Promise<import('../types/domain').SimulationResult> => {
    const res = await fetch('/api/simulation/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!res.ok) throw new Error('Failed to run simulation');
    return res.json();
  },

  getAuditTrail: async (): Promise<AuditRecord[]> => {
    return [
      { id: '1', timestamp: '14:15:02', event: 'Incident Detected', details: 'Fire - North Wing' },
      { id: '2', timestamp: '14:15:05', event: 'Situation Model Updated', details: 'State synced' },
      { id: '3', timestamp: '14:15:08', event: 'AI Analysis', details: '3 candidate strategies generated' }
    ];
  }
};
