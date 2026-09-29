from fastapi import FastAPI

app = FastAPI(title="Arbiter API")

@app.get("/api/state")
def get_state():
    return {"status": "ok", "message": "Arbiter MVP State API"}
