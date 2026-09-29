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
    # Extract available resources and incidents
    available_resources = [r for r in state.resources.values() if r.status == "available"]
    active_incidents = sorted(
        [i for i in state.incidents.values() if i.status != "resolved"],
        key=lambda inc: inc.severity,
        reverse=True
    )
    populated_zones = sorted(
        [z for z in state.zones.values() if z.current_population > 0 and z.type != "safe_zone"],
        key=lambda z: z.current_population,
        reverse=True
    )

    strategies: List[AIStrategyOutput] = []

    # Strategy 1: Direct Hazard Mitigation / Rapid Dispatch
    s1_actions = []
    for idx, inc in enumerate(active_incidents[:2]):
        # Match by type if possible
        matching_res = None
        for r in available_resources:
            if r.id not in [a.resource_id for a in s1_actions]:
                if (inc.type == "fire" and r.type == "fire") or \
                   (inc.type == "medical_emergency" and r.type == "medical") or \
                   (inc.type in ["crowd_surge", "blocked_exit"] and r.type == "security"):
                    matching_res = r
                    break
        if not matching_res:
            # Pick any unused resource
            for r in available_resources:
                if r.id not in [a.resource_id for a in s1_actions]:
                    matching_res = r
                    break
        
        if matching_res:
            s1_actions.append(Action(type=ActionType.DISPATCH, target_id=inc.id, resource_id=matching_res.id))

    if s1_actions:
        strategies.append(
            AIStrategyOutput(
                title="Direct Hazard Suppression & Triage",
                actions=s1_actions,
                explanation=f"Deploy primary tactical units directly to highest severity incidents ({', '.join(a.target_id.upper() for a in s1_actions)}) to neutralize immediate threats.",
                confidence=0.92
            )
        )

    # Strategy 2: Evacuation Priority & Perimeter Security
    s2_actions = []
    if populated_zones:
        target_zone = populated_zones[0]
        s2_actions.append(Action(type=ActionType.EVACUATE, target_id=target_zone.id, resource_id=None))
    
    # Add a security/medical dispatch to protect the evac corridor
    sec_or_med = [r for r in available_resources if r.type in ["security", "medical"]]
    if sec_or_med and active_incidents:
        s2_actions.append(Action(type=ActionType.DISPATCH, target_id=active_incidents[0].id, resource_id=sec_or_med[0].id))

    if s2_actions:
        strategies.append(
            AIStrategyOutput(
                title="Mass Evacuation & Corridor Security",
                actions=s2_actions,
                explanation="Prioritize rapid civilian egress from high-density danger areas while holding the main evacuation corridors.",
                confidence=0.88
            )
        )

    # Strategy 3: Multi-Vector Balanced Intervention
    s3_actions = []
    if len(populated_zones) > 1:
        s3_actions.append(Action(type=ActionType.EVACUATE, target_id=populated_zones[0].id, resource_id=None))
    
    for r in available_resources[:2]:
        if active_incidents and r.id not in [a.resource_id for a in s3_actions]:
            target_inc = active_incidents[min(len(s3_actions), len(active_incidents) - 1)]
            s3_actions.append(Action(type=ActionType.DISPATCH, target_id=target_inc.id, resource_id=r.id))

    if s3_actions:
        strategies.append(
            AIStrategyOutput(
                title="Staged Multi-Vector Response",
                actions=s3_actions,
                explanation="Coordinated simultaneous intervention: initiates partial evacuation while dispatching specialized units across sectors.",
                confidence=0.84
            )
        )

    # Fallback if empty
    if not strategies:
        strategies.append(
            AIStrategyOutput(
                title="Standard Response Protocol",
                actions=[Action(type=ActionType.DISPATCH, target_id=list(state.incidents.keys())[0] if state.incidents else "i1", resource_id=list(state.resources.keys())[0] if state.resources else "r1")],
                explanation="Dispatch default available unit to initial reported incident.",
                confidence=0.75
            )
        )

    return strategies

