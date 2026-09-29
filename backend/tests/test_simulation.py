import pytest
from backend.domain.models import AppState, Zone, Resource, Incident, SimulationModification, Action, ActionType
from backend.engine.simulation import apply_modifications, simulate_strategy, calculate_risk

@pytest.fixture
def base_state():
    return AppState(
        zones={
            "z1": Zone(id="z1", name="Z1", type="building", capacity=100, current_population=50, status="normal"),
            "z2": Zone(id="z2", name="Z2", type="building", capacity=100, current_population=50, status="normal")
        },
        resources={
            "r1": Resource(id="r1", type="medical", status="available", current_zone_id="z1"),
            "r2": Resource(id="r2", type="medical", status="available", current_zone_id="z2")
        },
        incidents={
            "i1": Incident(id="i1", type="fire", zone_id="z1", severity=5, description="Test", status="active")
        },
        time=0
    )

def test_1_no_modifications(base_state):
    proj_state, _, _, _, _ = apply_modifications(base_state, [])
    assert proj_state.model_dump() == base_state.model_dump()

def test_2_increase_population(base_state):
    mod = SimulationModification(type="increase_population", target_id="z1", value=150)
    proj, _, _, _, _ = apply_modifications(base_state, [mod])
    assert proj.zones["z1"].current_population == 150
    assert proj.zones["z1"].status == "over_capacity"
    assert calculate_risk(proj) > calculate_risk(base_state)

def test_3_reduce_capacity(base_state):
    mod = SimulationModification(type="reduce_capacity", target_id="z1", value=30)
    proj, _, _, _, _ = apply_modifications(base_state, [mod])
    assert proj.zones["z1"].capacity == 30
    assert proj.zones["z1"].status == "over_capacity"

def test_4_disable_resource(base_state):
    mod = SimulationModification(type="disable_resource", target_id="r1")
    proj, _, _, _, _ = apply_modifications(base_state, [mod])
    assert proj.resources["r1"].status == "unavailable"
    
    # Dispatching r1 should fail
    action = Action(type=ActionType.DISPATCH, target_id="i1", resource_id="r1")
    _, metrics = simulate_strategy(proj, [action])
    assert len(metrics["constraint_violations"]) > 0

def test_5_block_route(base_state):
    mod = SimulationModification(type="block_route", target_id="z1")
    proj, _, _, _, _ = apply_modifications(base_state, [mod])
    assert proj.zones["z1"].status == "blocked"
    
    # Action EVACUATE should detect blocked route
    action = Action(type=ActionType.EVACUATE, target_id="z1")
    _, metrics = simulate_strategy(proj, [action])
    assert len(metrics["constraint_violations"]) > 0

def test_6_dispatch_different_zone(base_state):
    # r2 is in z2, incident i1 is in z1 (different zone)
    action = Action(type=ActionType.DISPATCH, target_id="i1", resource_id="r2")
    _, metrics = simulate_strategy(base_state, [action])
    assert metrics["estimated_response_time"] == 5

def test_7_dispatch_same_zone(base_state):
    # r1 is in z1, incident i1 is in z1 (same zone)
    action = Action(type=ActionType.DISPATCH, target_id="i1", resource_id="r1")
    _, metrics = simulate_strategy(base_state, [action])
    assert metrics["estimated_response_time"] == 1

def test_8_apply_strategy_actions(base_state):
    action = Action(type=ActionType.DISPATCH, target_id="i1", resource_id="r1")
    proj, metrics = simulate_strategy(base_state, [action])
    assert proj.resources["r1"].status == "dispatched"
    assert proj.incidents["i1"].status == "mitigating"
    assert proj.resources["r1"].current_zone_id == "z1"
    assert metrics["projected_risk"] < calculate_risk(base_state)
