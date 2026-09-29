from pydantic import BaseModel
from typing import List, Dict, Optional
from enum import Enum

class ZoneType(str, Enum):
    BUILDING = "building"
    ROAD = "road"
    SAFE_ZONE = "safe_zone"

class ResourceType(str, Enum):
    MEDICAL = "medical"
    SECURITY = "security"
    FIRE = "fire"

class IncidentType(str, Enum):
    FIRE = "fire"
    MEDICAL_EMERGENCY = "medical_emergency"
    CROWD_SURGE = "crowd_surge"
    BLOCKED_EXIT = "blocked_exit"

class ActionType(str, Enum):
    DISPATCH = "dispatch"
    EVACUATE = "evacuate"
    BLOCK_ROUTE = "block_route"

class Zone(BaseModel):
    id: str
    name: str
    type: ZoneType
    capacity: int
    current_population: int
    status: str = "normal"

class Resource(BaseModel):
    id: str
    type: ResourceType
    status: str = "available"  # available, dispatched
    current_zone_id: Optional[str] = None

class Incident(BaseModel):
    id: str
    type: IncidentType
    zone_id: str
    severity: int  # 1-10
    description: str
    status: str = "active"

class AppState(BaseModel):
    zones: Dict[str, Zone]
    resources: Dict[str, Resource]
    incidents: Dict[str, Incident]
    time: int = 0

class Action(BaseModel):
    type: ActionType
    target_id: str  # e.g., zone_id or resource_id
    resource_id: Optional[str] = None

class Strategy(BaseModel):
    id: str
    title: str
    actions: List[Action]
    explanation: str
    confidence: float
    # Populated by Engine
    estimated_response_time: Optional[int] = None
    projected_risk: Optional[float] = None
    resource_consumption: Optional[int] = None
    constraint_violations: List[str] = []
    score: Optional[float] = None

class DecisionRecord(BaseModel):
    id: str
    timestamp: int
    initial_situation: AppState
    selected_strategy: Strategy
    human_action: str  # APPROVE, REJECT, MODIFY
    resulting_state: Optional[AppState] = None

class ScenarioDefinition(BaseModel):
    id: str
    name: str
    description: str
    long_description: Optional[str] = None
    severity: int
    tags: List[str] = []
    initial_state: AppState

class SimulationModification(BaseModel):
    type: str # block_route, add_incident, increase_population, reduce_capacity, disable_resource
    target_id: str
    value: Optional[int] = None
    details: Optional[str] = None

class SimulationRequest(BaseModel):
    modifications: List[SimulationModification] = []
    strategy_actions: List[Action] = []

class SimulationResult(BaseModel):
    baseline_risk: float
    projected_risk: float
    risk_delta: float
    
    baseline_response_time: int
    projected_response_time: int
    response_time_delta: int
    
    baseline_resource_usage: int
    projected_resource_usage: int
    resource_usage_delta: int
    
    constraint_violations: List[str]
    projected_state: AppState
    
    affected_zones: List[str]
    affected_incidents: List[str]
    affected_resources: List[str]
    
    simulation_summary: str
