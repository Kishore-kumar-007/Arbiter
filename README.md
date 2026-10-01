# Arbiter — Human-in-the-Loop Decision Intelligence

> **"AI that reasons. Humans that decide. Systems that adapt."**

## Overview
Arbiter is a premium, high-stakes decision intelligence platform designed to help human operators make complex, critical decisions under rapidly changing conditions. Built with a "mission control" aesthetic, the system provides a highly precise, telemetry-driven interface for managing crises.

The current implementation demonstrates the system using a **simulated campus emergency scenario**. However, the underlying architecture and visual language are domain-agnostic, ready to support healthcare operations, transportation networks, disaster response, public infrastructure, large events, and other high-stakes environments.

## Core Features
* **Command Center UI**: A dark-themed, high-contrast, premium interface designed for rapid situational awareness (Overview, Incidents, Resources, Decisions, Simulation, Audit Trail).
* **Live Situation Model**: Real-time representation of incidents, resources, and zones via interactive telemetry dashboards and mapping.
* **Deterministic Engine**: Simulation, scoring, and constraints evaluation occur deterministically. **The LLM is NOT the source of truth.**
* **AI-Assisted Strategies**: Uses AI (LLMs) to interpret natural-language incidents, summarize situations, and generate candidate strategy structures.
* **Human-in-the-Loop Workflow**: High-impact decisions are never executed silently. Human operators review, modify, approve, or reject proposed actions in a dedicated command view.
* **Counterfactual Simulation**: Evaluate "what-if" scenarios deterministically before committing to a decision in the Simulation Lab.
* **Cryptographic Audit Trail**: Immutable logging of timestamps, initial states, AI proposals, human actions, and outcomes.

## Technical Architecture
* **Backend**: Python (FastAPI). Uses Pydantic for strict schema validation. Houses the deterministic simulation engine and AI wrappers.
* **Frontend**: React (Vite) + TypeScript. A type-safe client featuring a vanilla CSS design system optimized for a high-stakes, mission-control aesthetic.
* **State Management**: In-memory global state tracking dynamically switching scenarios.

For more detailed architectural decisions, please read [ARCHITECTURE.md](ARCHITECTURE.md).

## Getting Started

### 1. Backend Setup (FastAPI)
Navigate to the `backend/` directory:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
To run the server:
```bash
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup (React/Vite)
Navigate to the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev
```

## Project Status (Final Phase)
This project has successfully completed its final visual and architectural polish pass. It demonstrates a functioning vertical slice containing clean modular boundaries, typed schemas, deterministic simulations, a well-defined human-in-the-loop workflow, and a fully realized "mission control" design system.
