import os
from openai import OpenAI
from pydantic import BaseModel
from typing import List
from backend.domain.models import AppState, Action, ActionType
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None

class AIStrategyOutput(BaseModel):
    title: str
    actions: List[Action]
    explanation: str
    confidence: float

class AIStrategiesList(BaseModel):
    strategies: List[AIStrategyOutput]

def generate_strategies(state: AppState) -> List[AIStrategyOutput]:
    """
    Calls the LLM to generate candidate strategies based on the current situation.
    The LLM proposes the actions; it does NOT calculate consequences.
    """
    if not client:
        print("WARNING: No OPENAI_API_KEY found. Falling back to mock AI generation.")
        return mock_generate_strategies(state)
        
    system_prompt = (
        "You are Arbiter, an AI assistant for a high-stakes emergency decision platform. "
        "Your role is to analyze the current situation state and propose candidate strategies. "
        "Each strategy should contain a title, a list of atomic actions (dispatch, evacuate, block_route), "
        "a natural language explanation of your reasoning, and a confidence score (0.0 to 1.0). "
        "DO NOT calculate consequences. The deterministic engine will do that. "
        "Propose 2-3 distinct strategies based on the provided JSON state."
    )
    
    state_json = state.model_dump_json()
    
    try:
        response = client.beta.chat.completions.parse(
            model="gpt-4o-2024-08-06",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Current Situation State:\n{state_json}"}
            ],
            response_format=AIStrategiesList,
        )
        
        return response.choices[0].message.parsed.strategies
    except Exception as e:
        print(f"Error calling LLM: {e}")
        return mock_generate_strategies(state)

def mock_generate_strategies(state: AppState) -> List[AIStrategyOutput]:
    return [
        AIStrategyOutput(
            title="Aggressive Medical Response",
            actions=[Action(type=ActionType.DISPATCH, target_id="i1", resource_id="r1")],
            explanation="Deploy the available medical resources immediately to the fire incident zone.",
            confidence=0.85
        ),
        AIStrategyOutput(
            title="Evacuate North Wing",
            actions=[
                Action(type=ActionType.EVACUATE, target_id="z1", resource_id=None),
                Action(type=ActionType.DISPATCH, target_id="i1", resource_id="r2")
            ],
            explanation="Prioritize getting people out of the building while dispatching the fire team.",
            confidence=0.95
        )
    ]
