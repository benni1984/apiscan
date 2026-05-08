from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, users, field_definitions, apiaries, qr_batches, hives, inspections, stats, public, export


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Only auto-create tables in dev (SQLite). Production uses Alembic migrations.
    if settings.database_url.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="ApiScan", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"

app.include_router(auth.router, prefix=PREFIX)
app.include_router(users.router, prefix=PREFIX)
app.include_router(field_definitions.router, prefix=PREFIX)
app.include_router(apiaries.router, prefix=PREFIX)
app.include_router(qr_batches.router, prefix=PREFIX)
app.include_router(hives.router, prefix=PREFIX)
app.include_router(inspections.router, prefix=PREFIX)
app.include_router(stats.router, prefix=PREFIX)
app.include_router(public.router, prefix=PREFIX)
app.include_router(export.router, prefix=PREFIX)
