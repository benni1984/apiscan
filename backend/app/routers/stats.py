from collections import defaultdict
from datetime import date, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Header, HTTPException, Query

from app.deps import CurrentUser, DB
from app.i18n import error
from app.models import Apiary, FieldDefinition, Hive, Inspection
from app.schemas import (
    ApiaryStats, ApiaryStatsSummary, CustomFieldStat, HiveStats, HiveStatsSummary,
    OverviewStats, StatsPeriod, TrendPoint,
)

router = APIRouter(tags=["stats"])

_HEATMAP_CELL = 0.5  # grid cell size in degrees (~50 km)


def _resolve_period(
    preset: Optional[str],
    from_date: Optional[date],
    to_date: Optional[date],
) -> StatsPeriod:
    today = date.today()
    if from_date or to_date:
        return StatsPeriod(**{
            "from": from_date or date(2000, 1, 1),
            "to": to_date or today,
            "preset": "custom",
        })
    if preset == "30d":
        return StatsPeriod(**{"from": today - timedelta(days=30), "to": today, "preset": "30d"})
    if preset == "90d":
        return StatsPeriod(**{"from": today - timedelta(days=90), "to": today, "preset": "90d"})
    if preset == "365d":
        return StatsPeriod(**{"from": today - timedelta(days=365), "to": today, "preset": "365d"})
    return StatsPeriod(**{"from": date(2000, 1, 1), "to": today, "preset": "all"})


def _filter_inspections(inspections: list, period: StatsPeriod) -> list:
    return [i for i in inspections if period.from_date <= i.date <= period.to_date]


def _build_hive_stats(hive: Hive, period: StatsPeriod, db: DB) -> HiveStats:
    inspections = _filter_inspections(hive.inspections, period)
    inspections.sort(key=lambda i: i.date)

    count = len(inspections)
    today = date.today()

    last_date = max((i.date for i in hive.inspections), default=None) if hive.inspections else None
    days_since = (today - last_date).days if last_date else None

    queen_seen_vals = [i.queen_seen for i in inspections if i.queen_seen is not None]
    queen_seen_rate = (sum(queen_seen_vals) / len(queen_seen_vals)) if queen_seen_vals else None

    mood_dist: Dict[str, int] = defaultdict(int)
    for i in inspections:
        if i.mood:
            mood_dist[i.mood] += 1

    swarm_count = sum(1 for i in inspections if i.swarm_cells_seen)

    treatments = [
        {"date": str(i.date), "treatment": i.treatment_applied}
        for i in inspections if i.treatment_applied
    ]

    def trend(attr: str) -> List[TrendPoint]:
        return [TrendPoint(date=i.date, value=getattr(i, attr)) for i in inspections if getattr(i, attr) is not None]

    # Custom field stats
    fd_ids = {k for i in inspections for k in (i.custom_fields or {}).keys()}
    custom_stats: Dict[str, CustomFieldStat] = {}
    for fd_id in fd_ids:
        fd = db.get(FieldDefinition, fd_id)
        if not fd or fd.target != "inspection":
            continue
        values = [(i.date, i.custom_fields[fd_id]) for i in inspections if fd_id in (i.custom_fields or {})]
        if fd.type in ("number", "date"):
            custom_stats[fd_id] = CustomFieldStat(
                field_name=fd.name,
                type=fd.type,
                trend=[TrendPoint(date=d, value=v) for d, v in values],
            )
        elif fd.type in ("boolean", "select"):
            dist: Dict[str, int] = defaultdict(int)
            for _, v in values:
                dist[str(v)] += 1
            custom_stats[fd_id] = CustomFieldStat(
                field_name=fd.name,
                type=fd.type,
                distribution=dict(dist),
            )

    return HiveStats(
        hive_id=hive.id,
        period=period,
        inspection_count=count,
        days_since_last_inspection=days_since,
        queen_seen_rate=queen_seen_rate,
        mood_distribution=dict(mood_dist),
        swarm_cells_count=swarm_count,
        treatments=treatments,
        varroa_trend=trend("varroa_count"),
        brood_frames_trend=trend("brood_frames"),
        honey_frames_trend=trend("honey_frames"),
        population_strength_trend=trend("population_strength"),
        weight_trend=trend("weight_kg"),
        custom_field_stats=custom_stats,
    )


@router.get("/hives/{hive_id}/stats", response_model=HiveStats)
def hive_stats(
    hive_id: str,
    current_user: CurrentUser,
    db: DB,
    preset: Optional[str] = Query(default=None, pattern="^(30d|90d|365d|all)$"),
    from_date: Optional[date] = Query(default=None, alias="from"),
    to_date: Optional[date] = Query(default=None, alias="to"),
    accept_language: Optional[str] = Header(default=None),
):
    hive = db.get(Hive, hive_id)
    if not hive or hive.user_id != current_user.id:
        raise HTTPException(404, detail=error("HIVE_NOT_FOUND", accept_language))
    period = _resolve_period(preset, from_date, to_date)
    return _build_hive_stats(hive, period, db)


@router.get("/apiaries/{apiary_id}/stats", response_model=ApiaryStats)
def apiary_stats(
    apiary_id: str,
    current_user: CurrentUser,
    db: DB,
    preset: Optional[str] = Query(default=None, pattern="^(30d|90d|365d|all)$"),
    from_date: Optional[date] = Query(default=None, alias="from"),
    to_date: Optional[date] = Query(default=None, alias="to"),
    accept_language: Optional[str] = Header(default=None),
):
    apiary = db.get(Apiary, apiary_id)
    if not apiary or apiary.user_id != current_user.id:
        raise HTTPException(404, detail=error("APIARY_NOT_FOUND", accept_language))

    period = _resolve_period(preset, from_date, to_date)
    today = date.today()
    cutoff_30d = today - timedelta(days=30)

    all_inspections = [i for h in apiary.hives for i in _filter_inspections(h.inspections, period)]

    varroa_vals = [i.varroa_count for i in all_inspections if i.varroa_count is not None]
    brood_vals = [i.brood_frames for i in all_inspections if i.brood_frames is not None]
    honey_vals = [i.honey_frames for i in all_inspections if i.honey_frames is not None]

    mood_dist: Dict[str, int] = defaultdict(int)
    for i in all_inspections:
        if i.mood:
            mood_dist[i.mood] += 1

    hives_inspected = sum(
        1 for h in apiary.hives
        if any(i.date >= cutoff_30d for i in h.inspections)
    )

    swarm_alerts = sum(1 for i in all_inspections if i.swarm_cells_seen)

    per_hive = []
    for h in apiary.hives:
        filtered = _filter_inspections(h.inspections, period)
        last_date = max((i.date for i in h.inspections), default=None) if h.inspections else None
        avg_varroa = None
        vv = [i.varroa_count for i in filtered if i.varroa_count is not None]
        if vv:
            avg_varroa = round(sum(vv) / len(vv), 2)
        per_hive.append(HiveStatsSummary(
            hive_id=h.id,
            hive_name=h.name,
            inspection_count=len(filtered),
            days_since_last_inspection=(today - last_date).days if last_date else None,
            average_varroa=avg_varroa,
        ))

    return ApiaryStats(
        apiary_id=apiary_id,
        period=period,
        hive_count=len(apiary.hives),
        inspections_total=len(all_inspections),
        hives_inspected_last_30d=hives_inspected,
        hives_not_inspected_30d=len(apiary.hives) - hives_inspected,
        average_varroa=round(sum(varroa_vals) / len(varroa_vals), 2) if varroa_vals else None,
        average_brood_frames=round(sum(brood_vals) / len(brood_vals), 2) if brood_vals else None,
        average_honey_frames=round(sum(honey_vals) / len(honey_vals), 2) if honey_vals else None,
        mood_distribution=dict(mood_dist),
        swarm_alerts=swarm_alerts,
        per_hive=per_hive,
    )


@router.get("/stats/overview", response_model=OverviewStats)
def overview_stats(
    current_user: CurrentUser,
    db: DB,
    preset: Optional[str] = Query(default=None, pattern="^(30d|90d|365d|all)$"),
    from_date: Optional[date] = Query(default=None, alias="from"),
    to_date: Optional[date] = Query(default=None, alias="to"),
):
    period = _resolve_period(preset, from_date, to_date)
    apiaries = db.query(Apiary).filter(Apiary.user_id == current_user.id).all()

    total_hives = sum(len(a.hives) for a in apiaries)
    total_inspections = sum(
        len(_filter_inspections(h.inspections, period))
        for a in apiaries for h in a.hives
    )

    per_apiary = [
        ApiaryStatsSummary(
            apiary_id=a.id,
            apiary_name=a.name,
            hive_count=len(a.hives),
            inspections_total=sum(
                len(_filter_inspections(h.inspections, period)) for h in a.hives
            ),
        )
        for a in apiaries
    ]

    return OverviewStats(
        period=period,
        apiary_count=len(apiaries),
        hive_count=total_hives,
        inspections_total=total_inspections,
        per_apiary=per_apiary,
    )


@router.get("/stats/community-heatmap")
def community_heatmap(current_user: CurrentUser, db: DB) -> Dict[str, Any]:
    """GeoJSON FeatureCollection with multi-metric heatmap data for the members dashboard."""
    rows = (
        db.query(
            Apiary.id,
            Apiary.city_latitude,
            Apiary.city_longitude,
            Inspection.varroa_count,
            Inspection.mood,
            Inspection.brood_frames,
            Inspection.swarm_cells_seen,
        )
        .join(Hive, Hive.apiary_id == Apiary.id)
        .join(Inspection, Inspection.hive_id == Hive.id)
        .filter(
            Apiary.is_public.is_(True),
            Apiary.city_latitude.isnot(None),
            Apiary.city_longitude.isnot(None),
        )
        .all()
    )

    cells: Dict[tuple, Dict] = defaultdict(lambda: {
        "varroa": [], "mood": [], "brood": [], "swarm": 0,
        "total": 0, "apiary_ids": set(),
    })
    for apiary_id, lat, lon, varroa, mood, brood, swarm in rows:
        key = (round(lat / _HEATMAP_CELL) * _HEATMAP_CELL, round(lon / _HEATMAP_CELL) * _HEATMAP_CELL)
        cell = cells[key]
        cell["apiary_ids"].add(apiary_id)
        cell["total"] += 1
        if varroa is not None:
            cell["varroa"].append(varroa)
        if mood is not None:
            cell["mood"].append(mood)
        if brood is not None:
            cell["brood"].append(brood)
        if swarm:
            cell["swarm"] += 1

    features = []
    half = _HEATMAP_CELL / 2
    for (clat, clon), cell in cells.items():
        total = cell["total"]
        avg_varroa = round(sum(cell["varroa"]) / len(cell["varroa"]), 2) if cell["varroa"] else None
        calm_count = sum(1 for m in cell["mood"] if m == "calm")
        mood_score = round(calm_count / len(cell["mood"]) * 100) if cell["mood"] else None
        avg_brood = round(sum(cell["brood"]) / len(cell["brood"]), 2) if cell["brood"] else None
        swarm_pct = round(cell["swarm"] / total * 100) if total > 0 else 0
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
                "avg_varroa": avg_varroa,
                "mood_score": mood_score,
                "avg_brood": avg_brood,
                "swarm_pct": swarm_pct,
                "apiary_count": len(cell["apiary_ids"]),
                "inspection_count": total,
            },
        })

    return {"type": "FeatureCollection", "features": features}
