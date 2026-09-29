from backend.domain.models import Strategy

def score_strategy(strategy: Strategy) -> float:
    """
    Assigns a numerical score to a strategy based on its deterministic metrics.
    Higher score is better.
    """
    score = 100.0 # Base score
    
    # Penalize response time (e.g., -2 points per unit of time)
    if strategy.estimated_response_time:
        score -= (strategy.estimated_response_time * 2)
        
    # Penalize high resource consumption (e.g., -5 points per resource)
    if strategy.resource_consumption:
        score -= (strategy.resource_consumption * 5)
        
    # Penalize projected risk (e.g., -1 point per risk unit)
    if strategy.projected_risk:
        score -= strategy.projected_risk
        
    # Massive penalty for constraint violations
    if strategy.constraint_violations:
        score -= (len(strategy.constraint_violations) * 50)
        
    # Add a slight boost based on AI confidence, but deterministic factors outweigh it
    score += (strategy.confidence * 10)
    
    return round(score, 2)
