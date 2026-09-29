from fastapi import FastAPI, HTTPException
from backend.core.state import StateManager
from backend.services.strategy_service import propose_and_evaluate_strategies
from typing import List
from backend.domain.models import Strategy, ScenarioDefinition
from backend.data.scenarios import get_scenarios, get_scenario, scenario_1

app = FastAPI(title="Arbiter API")
state_manager = StateManager()
# Initialize with default scenario (Scenario 1)
state_manager.update_state(scenario_1.initial_state.model_copy(deep=True))

@app.get("/api/state")
def get_state():
    return state_manager.get_state().model_dump()

@app.get("/api/scenarios", response_model=List[ScenarioDefinition])
def list_scenarios():
    return get_scenarios()

@app.get("/api/scenarios/{scenario_id}", response_model=ScenarioDefinition)
def get_scenario_by_id(scenario_id: str):
    scenario = get_scenario(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario

@app.post("/api/scenarios/{scenario_id}/load")
def load_scenario(scenario_id: str):
    scenario = get_scenario(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    state_manager.update_state(scenario.initial_state.model_copy(deep=True))
    return {"status": "success", "scenario_id": scenario.id}

@app.post("/api/state/reset")
def reset_state():
    # Reset to default scenario
    state_manager.update_state(scenario_1.initial_state.model_copy(deep=True))
    return {"status": "success"}

@app.post("/api/strategies/generate", response_model=List[Strategy])
def generate_strategies():
    """
    Triggers the AI to analyze the current state, propose actions, 
    and returns them after the deterministic engine scores them.
    """
    current_state = state_manager.get_state()
    strategies = propose_and_evaluate_strategies(current_state)
    return strategies

from backend.domain.models import SimulationRequest, SimulationResult
from backend.engine.simulation import apply_modifications, simulate_strategy, calculate_risk

@app.post("/api/simulation/run", response_model=SimulationResult)
def run_simulation(request: SimulationRequest):
    baseline_state = state_manager.get_state()
    
    # 1. Calculate baseline metrics
    baseline_risk = calculate_risk(baseline_state)
    baseline_response_time = 0
    baseline_resource_usage = 0
    
    # 2. Apply modifications
    mod_state, affected_zones, affected_incidents, affected_resources, mod_violations = apply_modifications(
        baseline_state, request.modifications
    )
    
    # 3. Apply strategy actions
    if request.strategy_actions:
        proj_state, metrics = simulate_strategy(
            mod_state, 
            request.strategy_actions,
            affected_zones=affected_zones,
            affected_resources=affected_resources,
            affected_incidents=affected_incidents
        )
    else:
        # Just use modification metrics
        proj_state = mod_state
        metrics = {
            "estimated_response_time": 0,
            "resource_consumption": 0,
            "constraint_violations": mod_violations,
            "projected_risk": calculate_risk(proj_state),
            "affected_zones": affected_zones,
            "affected_incidents": affected_incidents,
            "affected_resources": affected_resources
        }
        
    # Combine violations
    all_violations = list(set(mod_violations + metrics.get("constraint_violations", [])))

    risk_delta = round(metrics["projected_risk"] - baseline_risk, 2)
    response_time_delta = metrics["estimated_response_time"] - baseline_response_time
    resource_usage_delta = metrics["resource_consumption"] - baseline_resource_usage
    
    summary = ""
    if risk_delta > 0:
        summary = f"Projected risk increases by {risk_delta} points."
    elif risk_delta < 0:
        summary = f"Projected risk decreases by {abs(risk_delta)} points."
    else:
        summary = "No material change in projected risk."
        
    if all_violations:
        summary += f" Found {len(all_violations)} constraint violations."

    return SimulationResult(
        baseline_risk=baseline_risk,
        projected_risk=metrics["projected_risk"],
        risk_delta=risk_delta,
        baseline_response_time=baseline_response_time,
        projected_response_time=metrics["estimated_response_time"],
        response_time_delta=response_time_delta,
        baseline_resource_usage=baseline_resource_usage,
        projected_resource_usage=metrics["resource_consumption"],
        resource_usage_delta=resource_usage_delta,
        constraint_violations=all_violations,
        projected_state=proj_state,
        affected_zones=metrics.get("affected_zones", []),
        affected_incidents=metrics.get("affected_incidents", []),
        affected_resources=metrics.get("affected_resources", []),
        simulation_summary=summary
    )
