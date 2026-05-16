import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))
from main import app  # noqa: F401

# Smoke-test: GET /api/_health returns {"ok": true} without touching the DB.
from fastapi.responses import JSONResponse
from fastapi import Request

@app.get("/api/_health")
async def _health(request: Request):
    return JSONResponse({"ok": True})
