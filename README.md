# Arbiter — Human-in-the-Loop Decision Intelligence

> **"AI that reasons. Humans that decide. Systems that adapt."**

## Overview
Arbiter is a high-stakes decision intelligence platform designed to help humans make complex decisions under rapidly changing conditions. 

The current prototype demonstrates the system using a **simulated campus emergency scenario**. However, the underlying architecture is domain-agnostic, ready to support healthcare, transportation, disaster response, public infrastructure, large events, and other high-stakes environments.

## Core Features (MVP)
* **Live Situation Model**: Real-time representation of incidents, resources, and zones.
* **Deterministic Engine**: Simulation, scoring, and constraints evaluation occur deterministically. **The LLM is NOT the source of truth.**
* **AI-Assisted Strategies**: Uses AI (LLMs) to interpret natural-language incidents, summarize situations, and generate candidate strategy structures.
* **Human-in-the-Loop Workflow**: High-impact decisions are never executed silently. Human operators review, modify, approve, or reject proposed actions.
* **Counterfactual Simulation**: Evaluate "what-if" scenarios before committing to a decision.
* **Audit Trail**: Detailed recording of timestamps, initial states, AI proposals, human actions, and outcomes.

## Technical Architecture
We prioritize **CORRECTNESS > ARCHITECTURAL CLARITY > DEMO FEATURES**.

* **Backend**: Python (FastAPI). Uses Pydantic for strict schema validation. Houses the deterministic simulation engine and AI wrappers.
* **Frontend**: React (Vite) + TypeScript. A type-safe client that consumes the backend APIs cleanly.
* **State Management**: In-memory global state (designed to easily transition to a real DB).

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
uvicorn main:app --reload
```

### 2. Frontend Setup (React/Vite)
Navigate to the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev
```

## Hackathon Goal
This project was built under a 24-hour hackathon constraint. It demonstrates a functioning vertical slice containing clean modular boundaries, typed schemas, deterministic simulations, and a well-defined human-in-the-loop workflow.
