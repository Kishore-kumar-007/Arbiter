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
