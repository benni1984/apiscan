from collections import defaultdict
from typing import Any, Dict, List, Optional
from datetime import date as date_type

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.deps import DB
from app.i18n import error
from app.models import Apiary, Hive, Inspection

_CELL = 0.5  # grid cell size in degrees (~50 km)

router = APIRouter(prefix="/public", tags=["public"])


# ── Response schemas ──────────────────────────────────────────────────────────

class PublicApiaryPin(BaseModel):
    id: str
    name: str
    city_name: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    hive_count: int


class GlobalStats(BaseModel):
    apiary_count: int
    hive_count: int
    inspection_count: int
    avg_varroa_count: Optional[float]
    mood_distribution: dict
    avg_brood_frames: Optional[float]
    avg_inspection_interval_days: Optional[float]
    apiaries: List[PublicApiaryPin]


class PublicHiveSummary(BaseModel):
    id: str
    name: str
    hive_type: str
    last_inspection_date: Optional[str]


class PublicApiaryDetail(BaseModel):
    id: str
    name: str
    city_name: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    description: Optional[str]
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
    all_hives: list[Hive] = [h for a in public_apiaries for h in a.hives]
    all_inspections: list[Inspection] = [i for h in all_hives for i in h.inspections]

    inspection_count = len(all_inspections)

    varroa_values = [i.varroa_count for i in all_inspections if i.varroa_count is not None]
    avg_varroa = round(sum(varroa_values) / len(varroa_values), 2) if varroa_values else None

    mood_dist: dict = defaultdict(int)
    for i in all_inspections:
        if i.mood:
            mood_dist[i.mood] += 1

    brood_values = [i.brood_frames for i in all_inspections if i.brood_frames is not None]
    avg_brood = round(sum(brood_values) / len(brood_values), 2) if brood_values else None

    interval_avgs: list[float] = []
    for hive in all_hives:
        dates = sorted(i.date for i in hive.inspections)
        if len(dates) >= 2:
            gaps = [(dates[j] - dates[j - 1]).days for j in range(1, len(dates))]
            interval_avgs.append(sum(gaps) / len(gaps))
    avg_interval = round(sum(interval_avgs) / len(interval_avgs), 1) if interval_avgs else None

    pins = [
        PublicApiaryPin(
            id=a.id,
            name=a.name,
            city_name=a.city_name,
            latitude=a.city_latitude,
            longitude=a.city_longitude,
            hive_count=len(a.hives),
        )
        for a in public_apiaries
        if a.city_latitude is not None and a.city_longitude is not None
    ]

    return GlobalStats(
        apiary_count=len(public_apiaries),
        hive_count=len(all_hives),
        inspection_count=inspection_count,
        avg_varroa_count=avg_varroa,
        mood_distribution=dict(mood_dist),
        avg_brood_frames=avg_brood,
        avg_inspection_interval_days=avg_interval,
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
        city_name=apiary.city_name,
        latitude=apiary.city_latitude,
        longitude=apiary.city_longitude,
        description=apiary.description,
        hive_count=len(apiary.hives),
        inspection_count=len(all_inspections),
        last_inspection_date=last_date,
        average_varroa=avg_varroa,
        mood_distribution=dict(mood_dist),
        hives=hive_summaries,
    )


@router.get("/heatmap")
def public_heatmap(db: DB) -> Dict[str, Any]:
    """GeoJSON FeatureCollection of ~0.5° grid cells with average varroa counts."""
    rows = (
        db.query(
            Apiary.id,
            Apiary.city_latitude,
            Apiary.city_longitude,
            Inspection.varroa_count,
        )
        .join(Hive, Hive.apiary_id == Apiary.id)
        .join(Inspection, Inspection.hive_id == Hive.id)
        .filter(
            Apiary.is_public.is_(True),
            Apiary.city_latitude.isnot(None),
            Apiary.city_longitude.isnot(None),
            Inspection.varroa_count.isnot(None),
        )
        .all()
    )

    cells: Dict[tuple, Dict] = defaultdict(lambda: {"varroa": [], "apiary_ids": set()})
    for apiary_id, lat, lon, varroa in rows:
        key = (round(lat / _CELL) * _CELL, round(lon / _CELL) * _CELL)
        cells[key]["varroa"].append(varroa)
        cells[key]["apiary_ids"].add(apiary_id)

    features = []
    half = _CELL / 2
    for (clat, clon), cell in cells.items():
        avg = round(sum(cell["varroa"]) / len(cell["varroa"]), 2)
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [clon - half, clat - half],
                    [clon + half, clat - half],
                    [clon + half, clat + half],
                    [clon - half, clat + half],
                    [clon - half, clat - half],
                ]],
            },
            "properties": {
                "avg_varroa": avg,
                "apiary_count": len(cell["apiary_ids"]),
                "inspection_count": len(cell["varroa"]),
            },
        })

    return {"type": "FeatureCollection", "features": features}
