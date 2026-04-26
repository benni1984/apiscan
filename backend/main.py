from fastapi import FastAPI

from app.database import Base, engine
from app.routers import auth, users, field_definitions, apiaries, qr_batches, hives, inspections, stats

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ApiScan", version="1.0.0")

PREFIX = "/api/v1"

app.include_router(auth.router, prefix=PREFIX)
app.include_router(users.router, prefix=PREFIX)
app.include_router(field_definitions.router, prefix=PREFIX)
app.include_router(apiaries.router, prefix=PREFIX)
app.include_router(qr_batches.router, prefix=PREFIX)
app.include_router(hives.router, prefix=PREFIX)
app.include_router(inspections.router, prefix=PREFIX)
app.include_router(stats.router, prefix=PREFIX)
