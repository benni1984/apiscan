from collections import defaultdict
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.deps import DB
from app.i18n import error
from app.models import Apiary, Hive, Inspection

router = APIRouter(prefix="/public", tags=["public"])


# ── Response schemas ──────────────────────────────────────────────────────────

class PublicApiaryPin(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    hive_count: int


class GlobalStats(BaseModel):
    apiary_count: int
    hive_count: int
    inspection_count: int
    apiaries: List[PublicApiaryPin]


class PublicHiveSummary(BaseModel):
    id: str
    name: str
    hive_type: str
    last_inspection_date: Optional[str]


class PublicApiaryDetail(BaseModel):
    id: str
    name: str
    description: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    address: Optional[str]
    hive_count: int
    inspection_count: int
    last_inspection_date: Optional[str]
    average_varroa: Optional[float]
    mood_distribution: dict
    hives: List[PublicHiveSummary]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=GlobalStats)
def global_stats(db: DB):
    public_apiaries = db.query(Apiary).filter(Apiary.is_public.is_(True)).all()
    hive_ids = {h.id for a in public_apiaries for h in a.hives}
    inspection_count = (
        db.query(Inspection)
        .filter(Inspection.hive_id.in_(hive_ids))
        .count()
        if hive_ids else 0
    )

    pins = [
        PublicApiaryPin(
            id=a.id,
            name=a.name,
            latitude=a.latitude,
            longitude=a.longitude,
            hive_count=len(a.hives),
        )
        for a in public_apiaries
        if a.latitude is not None and a.longitude is not None
    ]

    return GlobalStats(
        apiary_count=len(public_apiaries),
        hive_count=sum(len(a.hives) for a in public_apiaries),
        inspection_count=inspection_count,
        apiaries=pins,
    )


@router.get("/apiaries/{apiary_id}", response_model=PublicApiaryDetail)
def public_apiary(apiary_id: str, db: DB, accept_language: str = "en"):
    apiary = db.get(Apiary, apiary_id)
    if apiary is None or not apiary.is_public:
        raise HTTPException(404, detail=error("APIARY_NOT_FOUND", accept_language))

    all_inspections: list[Inspection] = []
    for hive in apiary.hives:
        all_inspections.extend(hive.inspections)

    last_date = None
    if all_inspections:
        last_date = str(max(i.date for i in all_inspections))

    varroa_values = [i.varroa_count for i in all_inspections if i.varroa_count is not None]
    avg_varroa = round(sum(varroa_values) / len(varroa_values), 2) if varroa_values else None

    mood_dist: dict = defaultdict(int)
    for i in all_inspections:
        if i.mood:
            mood_dist[i.mood] += 1

    hive_summaries = [
        PublicHiveSummary(
            id=h.id,
            name=h.name,
            hive_type=h.hive_type,
            last_inspection_date=str(max((i.date for i in h.inspections), default=None)) if h.inspections else None,
        )
        for h in apiary.hives
    ]

    return PublicApiaryDetail(
        id=apiary.id,
        name=apiary.name,
        description=apiary.description,
        latitude=apiary.latitude,
        longitude=apiary.longitude,
        address=apiary.address,
        hive_count=len(apiary.hives),
        inspection_count=len(all_inspections),
        last_inspection_date=last_date,
        average_varroa=avg_varroa,
        mood_distribution=dict(mood_dist),
        hives=hive_summaries,
    )
