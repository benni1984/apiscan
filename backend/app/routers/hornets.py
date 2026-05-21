import math
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, status

from app.deps import DB
from app.models import HornetCatch, HornetNest, HornetSighting
from app.schemas import (
    HornetCatchCreate,
    HornetCatchOut,
    HornetNestCreate,
    HornetNestOut,
    HornetSightingCreate,
    HornetSightingOut,
    HornetStatsOut,
    HornetVote,
    PaginatedResponse,
)

router = APIRouter(prefix="/hornets", tags=["hornet-tracker"])

# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------


@router.get("/stats")
def get_stats(db: DB) -> HornetStatsOut:
    from sqlalchemy import func

    total_caught = db.query(func.coalesce(func.sum(HornetCatch.count), 0)).scalar() or 0
    total_nests = db.query(func.count(HornetNest.id)).scalar() or 0
    destroyed_nests = (
        db.query(func.count(HornetNest.id))
        .filter(HornetNest.status == "destroyed")
        .scalar() or 0
    )
    pending_sightings = (
        db.query(func.count(HornetSighting.id))
        .filter(HornetSighting.status == "pending")
        .scalar() or 0
    )
    confirmed_sightings = (
        db.query(func.count(HornetSighting.id))
        .filter(HornetSighting.status == "confirmed")
        .scalar() or 0
    )
    return HornetStatsOut(
        total_caught=int(total_caught),
        total_nests=total_nests,
        destroyed_nests=destroyed_nests,
        pending_sightings=pending_sightings,
        confirmed_sightings=confirmed_sightings,
    )


# ---------------------------------------------------------------------------
# Catches
# ---------------------------------------------------------------------------


@router.post("/catches", status_code=status.HTTP_201_CREATED)
def report_catch(body: HornetCatchCreate, db: DB) -> HornetCatchOut:
    catch = HornetCatch(
        latitude=body.latitude,
        longitude=body.longitude,
        count=body.count,
        reporter_name=body.reporter_name,
    )
    db.add(catch)
    db.commit()
    db.refresh(catch)
    return HornetCatchOut.model_validate(catch)


# ---------------------------------------------------------------------------
# Nests
# ---------------------------------------------------------------------------


@router.get("/nests")
def list_nests(db: DB) -> dict:
    """Return all nests as a GeoJSON FeatureCollection."""
    nests = db.query(HornetNest).order_by(HornetNest.created_at.desc()).all()
    features = [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [n.longitude, n.latitude],
            },
            "properties": {
                "id": n.id,
                "status": n.status,
                "reporter_name": n.reporter_name,
                "notes": n.notes,
                "photo_url": n.photo_url,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            },
        }
        for n in nests
    ]
    return {"type": "FeatureCollection", "features": features}


@router.post("/nests", status_code=status.HTTP_201_CREATED)
def report_nest(body: HornetNestCreate, db: DB) -> HornetNestOut:
    nest = HornetNest(
        latitude=body.latitude,
        longitude=body.longitude,
        reporter_name=body.reporter_name,
        notes=body.notes,
        photo_url=body.photo_url,
    )
    db.add(nest)
    db.commit()
    db.refresh(nest)
    return HornetNestOut.model_validate(nest)


# ---------------------------------------------------------------------------
# Sightings
# ---------------------------------------------------------------------------


@router.get("/sightings")
def list_sightings(
    db: DB,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
) -> PaginatedResponse:
    base = db.query(HornetSighting).order_by(HornetSighting.created_at.desc())
    total = base.count()
    items = base.offset((page - 1) * per_page).limit(per_page).all()
    return PaginatedResponse(
        items=[HornetSightingOut.model_validate(s) for s in items],
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total else 1,
    )


@router.post("/sightings", status_code=status.HTTP_201_CREATED)
def submit_sighting(body: HornetSightingCreate, db: DB) -> HornetSightingOut:
    sighting = HornetSighting(
        photo_url=body.photo_url,
        description=body.description,
        reporter_name=body.reporter_name,
        latitude=body.latitude,
        longitude=body.longitude,
    )
    db.add(sighting)
    db.commit()
    db.refresh(sighting)
    return HornetSightingOut.model_validate(sighting)


@router.post("/sightings/{sighting_id}/vote", status_code=status.HTTP_204_NO_CONTENT)
def vote_on_sighting(sighting_id: str, body: HornetVote, db: DB):
    sighting = db.get(HornetSighting, sighting_id)
    if sighting is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "HORNET_SIGHTING_NOT_FOUND", "message": "Sighting not found."},
        )
    if body.vote == "yes":
        sighting.yes_votes += 1
    else:
        sighting.no_votes += 1

    # Auto-confirm: yes > 2× no AND total votes ≥ 5
    total_votes = sighting.yes_votes + sighting.no_votes
    if (
        sighting.status == "pending"
        and total_votes >= 5
        and sighting.yes_votes > sighting.no_votes * 2
    ):
        sighting.status = "confirmed"

    db.commit()
