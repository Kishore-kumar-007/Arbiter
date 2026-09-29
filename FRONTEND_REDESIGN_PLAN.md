# Frontend Redesign Plan

## 1. Audit Summary

**Currently Implemented:**
- Backend: `GET /api/state` (fetches Zones, Resources, Incidents).
- Backend: `POST /api/strategies/generate` (triggers AI -> deterministically simulates -> scores -> returns candidate strategies).
- Frontend: Single `App.tsx` displaying active incidents, resources, and zones as basic cards, plus a button to generate and display strategies with basic score data.

**Not Yet Implemented (Backend):**
- `POST /api/incidents` (inject incident)
- `POST /api/strategies/simulate` (what-if / counterfactual simulation)
- `POST /api/decisions` (approve/reject/modify strategy to update state)
- `GET /api/audit-trail` (timeline of decisions)

**Frontend/Backend Mismatches:**
- The frontend lacks service layers. All fetch logic is inside `App.tsx`. 
- The frontend needs mock services for the missing endpoints to simulate "Approve", "Modify", "What-if", and "Audit Trail" until the backend is fully built.

## 2. Component Architecture

We will implement a clean component architecture:

```text
src/
├── components/
│   ├── layout/
│   │   ├── TopCommandBar.tsx
│   │   └── LeftSidebar.tsx
│   ├── map/
│   │   └── CampusMap.tsx
│   ├── telemetry/
│   │   └── TelemetryCards.tsx
│   ├── decisions/
│   │   ├── DecisionPanel.tsx
│   │   └── StrategyComparison.tsx
│   ├── simulation/
│   │   └── WhatIfSimulator.tsx
│   └── audit/
│       └── AuditTimeline.tsx
├── pages/
│   └── Overview.tsx
├── services/
│   └── api.ts (Abstracts backend calls & provides mocks for missing endpoints)
└── types/
    └── domain.ts (Matches backend Pydantic schemas)
```

## 3. Design Direction & Layout

**Visuals**: Dark near-black base (`#09090b`), white/light-gray text, red/orange for hazards, cyan/blue for telemetry, thin borders (`1px solid #27272a`), premium typography (Inter). NO generic glassmorphism, NO heavy gradients. 

**Layout**:
- **Top Bar**: Logo, Simulation Status, Time, Live Indicator.
- **Sidebar**: Navigation (Overview, Incidents, Simulation, etc.).
- **Main Workspace**: Multi-panel grid.
  - Top: Telemetry summary.
  - Center/Left: Simulated Campus Map (SVG-based).
  - Center/Right: Decision Intelligence Panel (Strategies).
  - Bottom: Live Event Feed & Audit Timeline.

## 4. Execution Phases

- **Phase 1 (Complete)**: Audit & Plan (this document).
- **Phase 2**: Setup Types (`src/types/domain.ts`) and API Service (`src/services/api.ts`) with mocks for missing endpoints.
- **Phase 3**: Create Global CSS (`src/index.css`) matching the requested strict, mission-control aesthetic.
- **Phase 4**: Build Layout Components (`TopCommandBar`, `LeftSidebar`).
- **Phase 5**: Build Telemetry Components (`TelemetryCards`).
- **Phase 6**: Build SVG Campus Map Component (`CampusMap`).
- **Phase 7**: Build Decision Intelligence Components (`DecisionPanel`, `StrategyComparison`).
- **Phase 8**: Assemble `Overview.tsx` and integrate into `App.tsx`.
- **Phase 9**: Add Interactions (What-If, Approve/Reject mock flows, Re-evaluation motion).
