from backend.domain.models import ScenarioDefinition, AppState, Zone, Resource, Incident

# SCENARIO 1: Campus Fire / Evacuation
scenario_1 = ScenarioDefinition(
    id="s1",
    name="CAMPUS FIRE / EVACUATION",
    description="Major fire in academic block with concurrent medical emergency and crowd surge.",
    long_description="A fire has broken out in a high-occupancy academic building while a medical emergency occurs nearby. One major exit is unavailable and crowd density is increasing around the safest available evacuation route.",
    severity=9,
    tags=["fire", "evacuation", "crowd_control"],
    initial_state=AppState(
        time=0,
        zones={
            "z_north": Zone(id="z_north", name="North Academic Block", type="building", capacity=1200, current_population=850, status="critical"),
            "z_engineering": Zone(id="z_engineering", name="Engineering Block", type="building", capacity=800, current_population=420),
            "z_quad": Zone(id="z_quad", name="Main Quad", type="safe_zone", capacity=3000, current_population=1500, status="congested"),
            "z_library": Zone(id="z_library", name="Library", type="building", capacity=1000, current_population=600),
            "z_east_road": Zone(id="z_east_road", name="East Access Road", type="road", capacity=500, current_population=200),
            "z_south_road": Zone(id="z_south_road", name="South Access Road", type="road", capacity=500, current_population=50),
            "z_assembly": Zone(id="z_assembly", name="Emergency Assembly Area", type="safe_zone", capacity=5000, current_population=100),
            "z_west_exit": Zone(id="z_west_exit", name="West Exit", type="road", capacity=1000, current_population=50),
            "z_east_exit": Zone(id="z_east_exit", name="East Exit", type="road", capacity=1000, current_population=0, status="blocked"),
        },
        incidents={
            "i1": Incident(id="i1", type="fire", zone_id="z_north", severity=9, description="Severe building fire on 3rd floor."),
            "i2": Incident(id="i2", type="medical_emergency", zone_id="z_engineering", severity=6, description="Student injured in lab."),
            "i3": Incident(id="i3", type="crowd_surge", zone_id="z_quad", severity=7, description="Emerging crowd surge heading west."),
            "i4": Incident(id="i4", type="blocked_exit", zone_id="z_east_exit", severity=8, description="East exit gates jammed shut."),
        },
        resources={
            "r_fire_1": Resource(id="r_fire_1", type="fire", status="available", current_zone_id="z_south_road"),
            "r_fire_2": Resource(id="r_fire_2", type="fire", status="available", current_zone_id="z_south_road"),
            "r_med_1": Resource(id="r_med_1", type="medical", status="available", current_zone_id="z_east_road"),
            "r_med_2": Resource(id="r_med_2", type="medical", status="available", current_zone_id="z_east_road"),
            "r_sec_1": Resource(id="r_sec_1", type="security", status="available", current_zone_id="z_quad"),
            "r_sec_2": Resource(id="r_sec_2", type="security", status="available", current_zone_id="z_west_exit"),
        }
    )
)

# SCENARIO 2: Mass Casualty / Event Crowd
scenario_2 = ScenarioDefinition(
    id="s2",
    name="MASS CASUALTY / EVENT CROWD",
    description="Post-event crowd surge causing multiple medical emergencies.",
    long_description="A large campus event has ended and a sudden crowd surge causes multiple medical incidents. Ambulance availability is limited and the nearest safe treatment area is approaching capacity.",
    severity=8,
    tags=["mass_casualty", "crowd_surge", "medical"],
    initial_state=AppState(
        time=0,
        zones={
            "z_stadium": Zone(id="z_stadium", name="Campus Stadium", type="building", capacity=15000, current_population=12000),
            "z_plaza": Zone(id="z_plaza", name="Event Plaza", type="safe_zone", capacity=5000, current_population=5200, status="overcrowded"),
            "z_med_tent": Zone(id="z_med_tent", name="Field Hospital", type="safe_zone", capacity=100, current_population=90),
            "z_north_route": Zone(id="z_north_route", name="North Route", type="road", capacity=2000, current_population=1800),
            "z_south_route": Zone(id="z_south_route", name="South Route", type="road", capacity=2000, current_population=0, status="blocked"),
        },
        incidents={
            "i1": Incident(id="i1", type="medical_emergency", zone_id="z_plaza", severity=9, description="Crush injury, 100+ people affected."),
            "i2": Incident(id="i2", type="medical_emergency", zone_id="z_north_route", severity=7, description="Multiple heat exhaustions."),
            "i3": Incident(id="i3", type="medical_emergency", zone_id="z_stadium", severity=5, description="Minor injuries on stairs."),
            "i4": Incident(id="i4", type="crowd_surge", zone_id="z_plaza", severity=8, description="Uncontrolled crowd pushing towards exits."),
            "i5": Incident(id="i5", type="blocked_exit", zone_id="z_south_route", severity=7, description="Vehicle accident blocking south route."),
        },
        resources={
            "r_med_1": Resource(id="r_med_1", type="medical", status="available", current_zone_id="z_med_tent"),
            "r_med_2": Resource(id="r_med_2", type="medical", status="available", current_zone_id="z_med_tent"),
            "r_sec_1": Resource(id="r_sec_1", type="security", status="available", current_zone_id="z_stadium"),
            "r_sec_2": Resource(id="r_sec_2", type="security", status="available", current_zone_id="z_plaza"),
            "r_sec_3": Resource(id="r_sec_3", type="security", status="available", current_zone_id="z_north_route"),
            "r_reserve_1": Resource(id="r_reserve_1", type="medical", status="available", current_zone_id="z_south_route"),
        }
    )
)

# SCENARIO 3: Infrastructure Failure / Cascade
scenario_3 = ScenarioDefinition(
    id="s3",
    name="INFRASTRUCTURE FAILURE / CASCADE",
    description="Power grid failure during peak hours leading to trapped occupants and blocked routes.",
    long_description="A major power failure affects multiple campus zones during peak occupancy. Several access routes become unavailable, communication is degraded, and a secondary medical incident develops.",
    severity=8,
    tags=["infrastructure", "cascade_failure", "evacuation"],
    initial_state=AppState(
        time=0,
        zones={
            "z_science": Zone(id="z_science", name="Science Complex", type="building", capacity=2500, current_population=2100, status="dark"),
            "z_admin": Zone(id="z_admin", name="Admin Tower", type="building", capacity=1200, current_population=900, status="dark"),
            "z_hub": Zone(id="z_hub", name="Central Hub", type="building", capacity=3000, current_population=2500),
            "z_tunnel": Zone(id="z_tunnel", name="Underground Walkway", type="road", capacity=800, current_population=300, status="dark"),
            "z_park": Zone(id="z_park", name="Campus Park", type="safe_zone", capacity=4000, current_population=500),
        },
        incidents={
            "i1": Incident(id="i1", type="blocked_exit", zone_id="z_science", severity=8, description="Electronic doors failed locked. Elevators stuck."),
            "i2": Incident(id="i2", type="medical_emergency", zone_id="z_science", severity=7, description="Chemical spill in dark lab. Injuries reported."),
            "i3": Incident(id="i3", type="crowd_surge", zone_id="z_tunnel", severity=6, description="Panic in dark tunnel."),
            "i4": Incident(id="i4", type="blocked_exit", zone_id="z_admin", severity=5, description="Main doors blocked by debris."),
        },
        resources={
            "r_eng_1": Resource(id="r_eng_1", type="security", status="available", current_zone_id="z_hub"), # using security type for engineering temporarily as there's no engineering type
            "r_sec_1": Resource(id="r_sec_1", type="security", status="available", current_zone_id="z_park"),
            "r_med_1": Resource(id="r_med_1", type="medical", status="available", current_zone_id="z_park"),
            "r_reserve_1": Resource(id="r_reserve_1", type="fire", status="available", current_zone_id="z_hub"),
        }
    )
)

SCENARIOS = {
    scenario_1.id: scenario_1,
    scenario_2.id: scenario_2,
    scenario_3.id: scenario_3,
}

def get_scenarios():
    return list(SCENARIOS.values())

def get_scenario(scenario_id: str):
    return SCENARIOS.get(scenario_id)
