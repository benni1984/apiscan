import sys
import os
import json
import traceback

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))

# Stub app — Vercel's static analyser requires a top-level 'app' name.
# The real FastAPI app replaces it below; if the import fails the stub
# returns the traceback as JSON so we can diagnose the error in production.
from fastapi import FastAPI, Request  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402

app = FastAPI()
_startup_error: str | None = None

try:
    from main import app  # type: ignore[assignment]  # replaces stub
except Exception:
    _startup_error = traceback.format_exc()

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    async def _startup_error_handler(request: Request, path: str = ""):
        return JSONResponse(status_code=200, content={"startup_error": _startup_error})
