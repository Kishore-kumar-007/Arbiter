from fastapi import FastAPI
from backend.core.state import StateManager
from backend.services.strategy_service import propose_and_evaluate_strategies
from typing import List
from backend.domain.models import Strategy

app = FastAPI(title="Arbiter API")
state_manager = StateManager()

@app.get("/api/state")
def get_state():
    return state_manager.get_state().model_dump()

@app.post("/api/strategies/generate", response_model=List[Strategy])
def generate_strategies():
    """
    Triggers the AI to analyze the current state, propose actions, 
    and returns them after the deterministic engine scores them.
    """
    current_state = state_manager.get_state()
    strategies = propose_and_evaluate_strategies(current_state)
    return strategies
