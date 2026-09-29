from backend.domain.models import AppState, Action, ActionType, IncidentType, SimulationModification, Incident, Zone
from typing import Tuple, List

def apply_modifications(state: AppState, modifications: List[SimulationModification]) -> Tuple[AppState, List[str], List[str], List[str], List[str]]:
    """Applies environment modifications to the state and returns projected state and affected lists."""
    projected_state = state.model_copy(deep=True)
    affected_zones = []
    affected_incidents = []
    affected_resources = []
    violations = []
    
    for mod in modifications:
        if mod.type == "block_route":
            zone = projected_state.zones.get(mod.target_id)
            if zone:
                zone.status = "blocked"
                affected_zones.append(mod.target_id)
            else:
                violations.append(f"Modification error: Route {mod.target_id} not found.")
                
        elif mod.type == "add_incident":
            # Target ID is zone_id, value is severity, details is type
            zone = projected_state.zones.get(mod.target_id)
            if zone:
                new_id = f"sim_inc_{len(projected_state.incidents) + 1}"
                inc_type = getattr(IncidentType, (mod.details or "FIRE").upper(), IncidentType.FIRE)
                projected_state.incidents[new_id] = Incident(
                    id=new_id, type=inc_type, zone_id=mod.target_id, severity=mod.value or 5, description="Simulated incident", status="active"
                )
                affected_incidents.append(new_id)
                affected_zones.append(mod.target_id)
            else:
                violations.append(f"Modification error: Zone {mod.target_id} not found for new incident.")
                
        elif mod.type == "increase_population":
            zone = projected_state.zones.get(mod.target_id)
            if zone:
                zone.current_population = mod.value or zone.current_population
                if zone.capacity > 0 and zone.current_population > zone.capacity:
                    zone.status = "over_capacity"
                affected_zones.append(mod.target_id)
                
        elif mod.type == "reduce_capacity":
            zone = projected_state.zones.get(mod.target_id)
            if zone:
                zone.capacity = mod.value or zone.capacity
                if zone.capacity > 0 and zone.current_population > zone.capacity:
                    zone.status = "over_capacity"
                affected_zones.append(mod.target_id)
                
        elif mod.type == "disable_resource":
            resource = projected_state.resources.get(mod.target_id)
            if resource:
                resource.status = "unavailable"
                affected_resources.append(mod.target_id)
            else:
                violations.append(f"Modification error: Resource {mod.target_id} not found.")

    return projected_state, list(set(affected_zones)), list(set(affected_incidents)), list(set(affected_resources)), violations


def simulate_strategy(current_state: AppState, actions: List[Action], affected_zones: List[str] = None, affected_resources: List[str] = None, affected_incidents: List[str] = None) -> Tuple[AppState, dict]:
    """
    Deterministically simulates the outcome of a list of actions on the current state.
    Returns the projected new state and a dictionary of metrics.
    """
    projected_state = current_state.model_copy(deep=True)
    violations = []
    
    affected_z = set(affected_zones or [])
    affected_r = set(affected_resources or [])
    affected_i = set(affected_incidents or [])
    
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
                violations.append(f"Resource {action.resource_id} is not available for dispatch.")
                continue
                
            original_zone_id = resource.current_zone_id
            
            # Simulate dispatch
            resource.status = "dispatched"
            resource.current_zone_id = target_incident.zone_id
            target_incident.status = "mitigating"
            
            resources_used += 1
            affected_r.add(resource.id)
            affected_i.add(target_incident.id)
            
            # Response time logic: 5 if different zone, 1 if same.
            if original_zone_id != target_incident.zone_id:
                response_time += 5
            else:
                response_time += 1
                
        elif action.type == ActionType.EVACUATE:
            zone = projected_state.zones.get(action.target_id)
            if not zone:
                violations.append(f"Zone {action.target_id} not found.")
                continue
                
            if zone.current_population > zone.capacity and zone.capacity > 0:
                violations.append(f"Cannot evacuate: Zone {action.target_id} is over capacity.")
                
            if zone.status == "blocked":
                violations.append(f"Cannot evacuate: Zone/Route {action.target_id} is blocked.")
                
            zone.current_population = zone.current_population // 2
            response_time += 2
            affected_z.add(zone.id)
            
        elif action.type == ActionType.BLOCK_ROUTE:
            zone = projected_state.zones.get(action.target_id)
            if not zone:
                violations.append(f"Route {action.target_id} not found to block.")
                continue
            zone.status = "blocked"
            affected_z.add(zone.id)

    metrics = {
        "estimated_response_time": response_time,
        "resource_consumption": resources_used,
        "constraint_violations": violations,
        "projected_risk": calculate_risk(projected_state),
        "affected_zones": list(affected_z),
        "affected_incidents": list(affected_i),
        "affected_resources": list(affected_r)
    }
    
    return projected_state, metrics

def calculate_risk(state: AppState) -> float:
    risk = 0.0
    for incident in state.incidents.values():
        if incident.status == "active":
            risk += incident.severity * 2
        elif incident.status == "mitigating":
            risk += incident.severity * 0.5
            
    for zone in state.zones.values():
        if zone.capacity > 0 and zone.current_population > zone.capacity:
            risk += 10.0
        if zone.status == "blocked":
            risk += 5.0
            
    return round(risk, 2)
