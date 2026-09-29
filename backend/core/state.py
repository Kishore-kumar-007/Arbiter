from backend.domain.models import AppState, Zone, Resource, Incident

# Initial mock state for MVP simulated campus emergency
initial_state = AppState(
    zones={
        "z1": Zone(id="z1", name="North Wing", type="building", capacity=500, current_population=300),
        "z2": Zone(id="z2", name="Main Quad", type="safe_zone", capacity=2000, current_population=50),
        "z3": Zone(id="z3", name="East Access Road", type="road", capacity=0, current_population=0)
    },
    resources={
        "r1": Resource(id="r1", type="medical", status="available", current_zone_id="z2"),
        "r2": Resource(id="r2", type="fire", status="available", current_zone_id="z3")
    },
    incidents={
        "i1": Incident(id="i1", type="fire", zone_id="z1", severity=8, description="Fire reported on second floor.")
    },
    time=0
)

# Global in-memory state manager for the Hackathon prototype
class StateManager:
    _instance = None
    _state: AppState

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(StateManager, cls).__new__(cls)
            cls._instance._state = initial_state.model_copy(deep=True)
        return cls._instance

    def get_state(self) -> AppState:
        return self._state

    def reset_state(self):
        self._state = initial_state.model_copy(deep=True)
        
    def update_state(self, new_state: AppState):
        self._state = new_state
