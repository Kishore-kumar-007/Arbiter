import uuid
from backend.domain.models import AppState, Strategy
from backend.ai.generator import generate_strategies
from backend.engine.simulation import simulate_strategy
from backend.engine.scoring import score_strategy
from typing import List

def propose_and_evaluate_strategies(current_state: AppState) -> List[Strategy]:
    """
    1. Triggers AI to generate raw strategy structures.
    2. Runs each strategy through the deterministic simulation engine.
    3. Scores each strategy.
    4. Returns the fully populated Strategy domain models sorted by score.
    """
    ai_outputs = generate_strategies(current_state)
    
    evaluated_strategies = []
    
    for ai_strat in ai_outputs:
        # Simulate deterministically
        projected_state, metrics = simulate_strategy(current_state, ai_strat.actions)
        
        # Build the domain Strategy object
        strategy = Strategy(
            id=str(uuid.uuid4()),
            title=ai_strat.title,
            actions=ai_strat.actions,
            explanation=ai_strat.explanation,
            confidence=ai_strat.confidence,
            estimated_response_time=metrics["estimated_response_time"],
            projected_risk=metrics["projected_risk"],
            resource_consumption=metrics["resource_consumption"],
            constraint_violations=metrics["constraint_violations"]
        )
        
        # Score it deterministically
        score = score_strategy(strategy)
        strategy.score = score
        
        evaluated_strategies.append(strategy)
        
    # Sort by highest score first
    evaluated_strategies.sort(key=lambda s: s.score or 0.0, reverse=True)
    
    return evaluated_strategies
