from backend.domain.models import AppState, Action, ActionType, IncidentType
from typing import Tuple, List

def simulate_strategy(current_state: AppState, actions: List[Action]) -> Tuple[AppState, dict]:
    """
    Deterministically simulates the outcome of a list of actions on the current state.
    Returns the projected new state and a dictionary of metrics.
    """
    projected_state = current_state.model_copy(deep=True)
    violations = []
    
    response_time = 0
    resources_used = 0
    
    for action in actions:
        if action.type == ActionType.DISPATCH:
            resource = projected_state.resources.get(action.resource_id)
            target_incident = projected_state.incidents.get(action.target_id)
            
            if not resource:
                violations.append(f"Resource {action.resource_id} not found.")
                continue
            if not target_incident:
                violations.append(f"Target incident {action.target_id} not found.")
                continue
                
            if resource.status != "available":
                violations.append(f"Resource {action.resource_id} is not available.")
                continue
                
            # Simulate dispatch
            resource.status = "dispatched"
            resource.current_zone_id = target_incident.zone_id
            target_incident.status = "mitigating"
            
            resources_used += 1
            # Basic deterministic rule: Response time is 5 units if in different zones, 1 if same.
            if resource.current_zone_id != target_incident.zone_id:
                response_time += 5
            else:
                response_time += 1
                
        elif action.type == ActionType.EVACUATE:
            zone = projected_state.zones.get(action.target_id)
            if not zone:
                violations.append(f"Zone {action.target_id} not found.")
                continue
                
            if zone.current_population > zone.capacity:
                violations.append(f"Cannot evacuate: Zone {action.target_id} is over capacity.")
                
            # Simulate evacuation (half the population moves out)
            zone.current_population = zone.current_population // 2
            response_time += 2

    metrics = {
        "estimated_response_time": response_time,
        "resource_consumption": resources_used,
        "constraint_violations": violations,
        "projected_risk": calculate_risk(projected_state)
    }
    
    return projected_state, metrics

def calculate_risk(state: AppState) -> float:
    # A simple deterministic calculation of risk based on active incidents and population density
    risk = 0.0
    for incident in state.incidents.values():
        if incident.status == "active":
            risk += incident.severity * 2
        elif incident.status == "mitigating":
            risk += incident.severity * 0.5
            
    for zone in state.zones.values():
        if zone.capacity > 0 and zone.current_population > zone.capacity:
            risk += 10.0 # High risk for overcrowding
            
    return round(risk, 2)
