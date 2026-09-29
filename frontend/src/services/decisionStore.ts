import type { DecisionRecord, Strategy, DecisionStatus } from '../types/domain';

// This is a SESSION-ONLY temporary store for the Hackathon/Demo.
// Later, this will be replaced by:
// GET /api/decisions
// POST /api/decisions

let decisions: DecisionRecord[] = [
  {
    id: 'D-802',
    scenario_id: 's1',
    scenario_name: 'Campus Fire Emergency',
    strategy: {
      id: 'strat-mock-1',
      title: 'Perimeter Defense & Evacuation',
      actions: [
        { type: 'evacuate', target_id: 'z1', resource_id: null },
        { type: 'dispatch', target_id: 'i1', resource_id: 'r1' }
      ],
      explanation: 'Structural integrity compromised. Evacuation minimizes casualties while containment teams establish a perimeter.',
      confidence: 0.92,
      estimated_response_time: 4,
      projected_risk: 18.5,
      resource_consumption: 2,
      constraint_violations: [],
      score: 88
    },
    candidate_strategies: [
      {
        id: 'strat-mock-1b',
        title: 'Aggressive Interior Attack',
        actions: [{ type: 'dispatch', target_id: 'i1', resource_id: 'r1' }],
        explanation: 'Direct attack to suppress the primary hazard immediately.',
        confidence: 0.75,
        estimated_response_time: 3,
        projected_risk: 28.0,
        resource_consumption: 1,
        constraint_violations: [],
        score: 65
      }
    ],
    status: 'APPROVED',
    human_action: 'AUTHORIZE STRATEGY',
    timestamp: '09:14:22',
    reason: null,
    source: 'AI_GENERATION'
  },
  {
    id: 'D-803',
    scenario_id: 's1',
    scenario_name: 'Campus Fire Emergency',
    strategy: {
      id: 'strat-mock-2',
      title: 'Medical Triage Setup',
      actions: [
        { type: 'dispatch', target_id: 'i2', resource_id: 'r2' }
      ],
      explanation: 'Reports of smoke inhalation require immediate medical staging outside the primary hazard zone.',
      confidence: 0.89,
      estimated_response_time: 6,
      projected_risk: 12.0,
      resource_consumption: 1,
      constraint_violations: ['Resource R2 ETA exceeds 5 mins'],
      score: 72
    },
    candidate_strategies: [],
    status: 'REJECTED',
    human_action: 'REJECT STRATEGY',
    timestamp: '09:45:10',
    reason: 'R2 is too far away. Need to dispatch closer unit or request mutual aid.',
    source: 'AI_GENERATION'
  },
  {
    id: 'D-804',
    scenario_id: 's2',
    scenario_name: 'Medical Incident',
    strategy: {
      id: 'strat-mock-3',
      title: 'Standard Medical Response',
      actions: [
        { type: 'dispatch', target_id: 'i1', resource_id: 'r1' }
      ],
      explanation: 'Standard protocol for localized medical emergency.',
      confidence: 0.98,
      estimated_response_time: 2,
      projected_risk: 5.0,
      resource_consumption: 1,
      constraint_violations: [],
      score: 95
    },
    candidate_strategies: [],
    status: 'MODIFIED',
    human_action: 'MODIFY STRATEGY',
    timestamp: '10:05:33',
    reason: null,
    source: 'AI_GENERATION'
  }
];
let listeners: Array<() => void> = [];

export const decisionStore = {
  getDecisions: () => [...decisions],
  
  subscribe: (listener: () => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },
  
  notify: () => {
    listeners.forEach(l => l());
  },

  addPendingDecision: (
    scenarioId: string, 
    scenarioName: string, 
    primary: Strategy, 
    candidates: Strategy[]
  ) => {
    const newDecision: DecisionRecord = {
      id: `D-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      scenario_id: scenarioId,
      scenario_name: scenarioName,
      strategy: primary,
      candidate_strategies: candidates,
      status: 'PENDING',
      human_action: null,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      reason: null,
      source: 'AI_GENERATION'
    };
    decisions = [newDecision, ...decisions];
    decisionStore.notify();
    return newDecision;
  },

  updateDecisionStatus: (
    id: string, 
    status: DecisionStatus, 
    humanAction: string, 
    reason: string | null = null,
    modifiedStrategy?: Strategy
  ) => {
    decisions = decisions.map(d => {
      if (d.id === id) {
        return {
          ...d,
          status,
          human_action: humanAction,
          reason: reason || d.reason,
          strategy: modifiedStrategy || d.strategy,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }), // Update timestamp on action
        };
      }
      return d;
    });
    decisionStore.notify();
  }
};
