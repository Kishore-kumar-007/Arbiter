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
