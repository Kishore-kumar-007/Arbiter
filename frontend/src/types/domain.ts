export type ZoneType = 'building' | 'road' | 'safe_zone';
export type ResourceType = 'medical' | 'security' | 'fire';
export type IncidentType = 'fire' | 'medical_emergency' | 'crowd_surge' | 'blocked_exit';
export type ActionType = 'dispatch' | 'evacuate' | 'block_route';

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  capacity: number;
  current_population: number;
  status: string;
}

export interface Resource {
  id: string;
  type: ResourceType;
  status: string;
  current_zone_id: string | null;
}

export interface Incident {
  id: string;
  type: IncidentType;
  zone_id: string;
  severity: number;
  description: string;
  status: string;
}

export interface AppState {
  zones: Record<string, Zone>;
  resources: Record<string, Resource>;
  incidents: Record<string, Incident>;
  time: number;
}

export interface Action {
  type: ActionType;
  target_id: string;
  resource_id: string | null;
}

export interface Strategy {
  id: string;
  title: string;
  actions: Action[];
  explanation: string;
  confidence: number;
  estimated_response_time: number | null;
  projected_risk: number | null;
  resource_consumption: number | null;
  constraint_violations: string[];
  score: number | null;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  event: string;
  details: string;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  long_description: string | null;
  severity: number;
  tags: string[];
  initial_state: AppState;
}

export type DecisionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED';

export interface DecisionRecord {
  id: string;
  scenario_id: string;
  scenario_name: string;
  strategy: Strategy;
  candidate_strategies: Strategy[];
  status: DecisionStatus;
  human_action: string | null;
  timestamp: string;
  reason: string | null;
  source: string;
}
export type SimulationModificationType = 'block_route' | 'add_incident' | 'increase_population' | 'reduce_capacity' | 'disable_resource';

export interface SimulationModification {
  type: SimulationModificationType;
  target_id: string;
  value?: number;
  details?: string;
}

export interface SimulationRequest {
  modifications: SimulationModification[];
  strategy_actions: Action[];
}

export interface SimulationResult {
  baseline_risk: number;
  projected_risk: number;
  risk_delta: number;
  
  baseline_response_time: number;
  projected_response_time: number;
  response_time_delta: number;
  
  baseline_resource_usage: number;
  projected_resource_usage: number;
  resource_usage_delta: number;
  
  constraint_violations: string[];
  projected_state: AppState;
  
  affected_zones: string[];
  affected_incidents: string[];
  affected_resources: string[];
  
  simulation_summary: string;
}
