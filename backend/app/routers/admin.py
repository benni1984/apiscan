import math
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, or_, and_

from app.deps import CurrentAdmin, DB
from app.models import Apiary, Hive, Inspection, RefreshToken, User, HornetSighting
from app.schemas import (
    AdminApiaryOut, AdminPlatformStats, AdminUserDetail, AdminTokenOut,
    AdminTokenStats, HealthSummary, HornetSightingStatusUpdate, InactiveUserOut,
    NoVarroaApiaryOut, PaginatedResponse, SignupDay, SupporterUpdate, UserOut,
    ZeroInspectionHiveOut,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/ping")
def ping(admin: CurrentAdmin) -> dict:
    """Health-check for the admin dependency. Returns 403 for non-admins."""
    return {"ok": True, "email": admin.email}


# ---------------------------------------------------------------------------
# User management
# ---------------------------------------------------------------------------

@router.get("/users")
def list_users(
    admin: CurrentAdmin,
    db: DB,
    q: Optional[str] = None,
    supporter: Optional[bool] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
) -> PaginatedResponse:
    query = db.query(User)
    if q:
        query = query.filter(User.email.ilike(f"%{q}%"))
    if supporter is not None:
        query = query.filter(User.is_supporter == supporter)
    query = query.order_by(User.created_at.desc())
    total = query.count()
    users = query.offset((page - 1) * per_page).limit(per_page).all()
    return PaginatedResponse(
        items=[UserOut.model_validate(u) for u in users],
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total else 1,
    )


@router.get("/users/{user_id}")
def get_user(user_id: str, admin: CurrentAdmin, db: DB) -> AdminUserDetail:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found."},
        )
    apiary_count = db.query(func.count(Apiary.id)).filter(Apiary.user_id == user_id).scalar() or 0
    hive_count = db.query(func.count(Hive.id)).filter(Hive.user_id == user_id).scalar() or 0
    inspection_count = (
        db.query(func.count(Inspection.id))
        .join(Hive, Inspection.hive_id == Hive.id)
        .filter(Hive.user_id == user_id)
        .scalar() or 0
    )
    return AdminUserDetail(
        id=user.id,
        email=user.email,
        name=user.name,
        locale=user.locale,
        is_admin=user.is_admin,
        is_supporter=user.is_supporter,
        created_at=user.created_at,
        apiary_count=apiary_count,
        hive_count=hive_count,
        inspection_count=inspection_count,
    )


@router.put("/users/{user_id}/supporter")
def set_supporter(user_id: str, body: SupporterUpdate, admin: CurrentAdmin, db: DB) -> UserOut:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found."},
        )
    user.is_supporter = body.is_supporter
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.get("/stats")
def platform_stats(
    admin: CurrentAdmin,
    db: DB,
    preset: str = Query("30d", pattern="^(30d|90d|365d|all)$"),
) -> AdminPlatformStats:
    now = datetime.utcnow()
    _days = {"30d": 30, "90d": 90, "365d": 365}
    cutoff: Optional[datetime] = None if preset == "all" else now - timedelta(days=_days[preset])

    total_users = db.query(func.count(User.id)).scalar() or 0
    supporter_count = db.query(func.count(User.id)).filter(User.is_supporter.is_(True)).scalar() or 0

    new_q = db.query(func.count(User.id))
    if cutoff:
        new_q = new_q.filter(User.created_at >= cutoff)
    new_users_in_period = new_q.scalar() or 0

    total_apiaries = db.query(func.count(Apiary.id)).scalar() or 0
    public_apiaries = db.query(func.count(Apiary.id)).filter(Apiary.is_public.is_(True)).scalar() or 0
    total_hives = db.query(func.count(Hive.id)).scalar() or 0
    total_inspections = db.query(func.count(Inspection.id)).scalar() or 0

    thirty_days_ago = now - timedelta(days=30)
    active_users_30d = (
        db.query(func.count(func.distinct(Hive.user_id)))
        .join(Inspection, Inspection.hive_id == Hive.id)
        .filter(Inspection.created_at >= thirty_days_ago)
        .scalar() or 0
    )

    day_col = func.date(User.created_at)
    signups_q = (
        db.query(day_col.label("day"), func.count(User.id).label("cnt"))
        .group_by(day_col)
        .order_by(day_col)
    )
    if cutoff:
        signups_q = signups_q.filter(User.created_at >= cutoff)
    signups_by_day = [SignupDay(date=str(row.day), count=row.cnt) for row in signups_q.all()]

    return AdminPlatformStats(
        preset=preset,
        total_users=total_users,
        new_users_in_period=new_users_in_period,
        supporter_count=supporter_count,
        total_apiaries=total_apiaries,
        public_apiaries=public_apiaries,
        total_hives=total_hives,
        total_inspections=total_inspections,
        active_users_30d=active_users_30d,
        signups_by_day=signups_by_day,
    )


# ---------------------------------------------------------------------------
# Map moderation
# ---------------------------------------------------------------------------

def _hive_count_subquery(db):
    return (
        db.query(Hive.apiary_id, func.count(Hive.id).label("hc"))
        .group_by(Hive.apiary_id)
        .subquery()
    )


def _apiary_row_to_out(apiary, email, hive_count) -> AdminApiaryOut:
    return AdminApiaryOut(
        id=apiary.id,
        name=apiary.name,
        owner_email=email,
        latitude=apiary.latitude,
        longitude=apiary.longitude,
        hive_count=hive_count,
        is_public=apiary.is_public,
        created_at=apiary.created_at,
    )


@router.get("/apiaries")
def list_public_apiaries(
    admin: CurrentAdmin,
    db: DB,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
) -> PaginatedResponse:
    hc_sq = _hive_count_subquery(db)
    hc_col = func.coalesce(hc_sq.c.hc, 0)
    base = (
        db.query(Apiary, User.email, hc_col)
        .join(User, Apiary.user_id == User.id)
        .outerjoin(hc_sq, Apiary.id == hc_sq.c.apiary_id)
        .filter(Apiary.is_public.is_(True))
        .order_by(Apiary.created_at.desc())
    )
    total = db.query(func.count(Apiary.id)).filter(Apiary.is_public.is_(True)).scalar() or 0
    rows = base.offset((page - 1) * per_page).limit(per_page).all()
    return PaginatedResponse(
        items=[_apiary_row_to_out(a, email, hc) for a, email, hc in rows],
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total else 1,
    )


@router.get("/apiaries/flagged")
def flagged_apiaries(admin: CurrentAdmin, db: DB) -> list:
    hc_sq = _hive_count_subquery(db)
    hc_col = func.coalesce(hc_sq.c.hc, 0)
    rows = (
        db.query(Apiary, User.email, hc_col)
        .join(User, Apiary.user_id == User.id)
        .outerjoin(hc_sq, Apiary.id == hc_sq.c.apiary_id)
        .filter(Apiary.is_public.is_(True))
        .filter(or_(
            hc_col > 500,
            and_(Apiary.latitude.isnot(None), or_(Apiary.latitude < -90, Apiary.latitude > 90)),
            and_(Apiary.longitude.isnot(None), or_(Apiary.longitude < -180, Apiary.longitude > 180)),
        ))
        .all()
    )
    return [_apiary_row_to_out(a, email, hc) for a, email, hc in rows]


@router.put("/apiaries/{apiary_id}/set-private")
def set_apiary_private(apiary_id: str, admin: CurrentAdmin, db: DB) -> AdminApiaryOut:
    apiary = db.get(Apiary, apiary_id)
    if apiary is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "APIARY_NOT_FOUND", "message": "Apiary not found."},
        )
    apiary.is_public = False
    apiary.city_name = None
    apiary.city_latitude = None
    apiary.city_longitude = None
    db.commit()
    db.refresh(apiary)
    hive_count = db.query(func.count(Hive.id)).filter(Hive.apiary_id == apiary_id).scalar() or 0
    owner = db.get(User, apiary.user_id)
    return _apiary_row_to_out(apiary, owner.email, hive_count)


@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: str, admin: CurrentAdmin, db: DB):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found."},
        )
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "CANNOT_DELETE_SELF", "message": "Admins cannot delete their own account."},
        )
    # Delete in FK dependency order so the ORM cascade on User works cleanly.
    # Inspections → Hives must go before User cascade deletes QrTokens (referenced by Hive.qr_token).
    db.query(Inspection).filter(
        Inspection.hive_id.in_(db.query(Hive.id).filter(Hive.user_id == user_id))
    ).delete(synchronize_session=False)
    db.query(Hive).filter(Hive.user_id == user_id).delete(synchronize_session=False)
    db.delete(user)
    db.commit()


# ---------------------------------------------------------------------------
# Data health
# ---------------------------------------------------------------------------

def _users_with_inspections_sq(db):
    return db.query(Hive.user_id).join(Inspection, Inspection.hive_id == Hive.id).distinct()


def _inactive_users_q(db):
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    return (
        db.query(User)
        .filter(User.created_at < thirty_days_ago)
        .filter(~User.id.in_(_users_with_inspections_sq(db)))
    )


def _zero_inspection_hives_q(db):
    inspected = db.query(Inspection.hive_id).distinct()
    return (
        db.query(Hive, Apiary.name, User.email)
        .join(Apiary, Apiary.id == Hive.apiary_id)
        .join(User, User.id == Hive.user_id)
        .filter(~Hive.id.in_(inspected))
        .order_by(Hive.initialized_at.desc())
    )


@router.get("/health/summary")
def health_summary(admin: CurrentAdmin, db: DB) -> HealthSummary:
    inactive_users = _inactive_users_q(db).with_entities(func.count(User.id)).scalar() or 0
    zero_inspection_hives = (
        db.query(func.count(Hive.id))
        .filter(~Hive.id.in_(db.query(Inspection.hive_id).distinct()))
        .scalar() or 0
    )
    no_varroa_inspections = (
        db.query(func.count(Inspection.id)).filter(Inspection.varroa_count.is_(None)).scalar() or 0
    )
    return HealthSummary(
        inactive_users=inactive_users,
        zero_inspection_hives=zero_inspection_hives,
        no_varroa_inspections=no_varroa_inspections,
    )


@router.get("/health/inactive-users")
def health_inactive_users(
    admin: CurrentAdmin,
    db: DB,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
) -> PaginatedResponse:
    apiary_count_sq = (
        db.query(Apiary.user_id, func.count(Apiary.id).label("ac"))
        .group_by(Apiary.user_id)
        .subquery()
    )
    base = (
        _inactive_users_q(db)
        .add_columns(func.coalesce(apiary_count_sq.c.ac, 0))
        .outerjoin(apiary_count_sq, User.id == apiary_count_sq.c.user_id)
        .order_by(User.created_at.asc())
    )
    total = _inactive_users_q(db).with_entities(func.count(User.id)).scalar() or 0
    rows = base.offset((page - 1) * per_page).limit(per_page).all()
    return PaginatedResponse(
        items=[
            InactiveUserOut(
                id=u.id, email=u.email, name=u.name,
                created_at=u.created_at, apiary_count=ac,
            )
            for u, ac in rows
        ],
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total else 1,
    )


@router.get("/health/no-varroa-inspections")
def health_no_varroa_inspections(admin: CurrentAdmin, db: DB) -> list:
    rows = (
        db.query(
            Apiary.id,
            Apiary.name,
            User.email,
            func.count(Inspection.id).label("missing"),
        )
        .join(Hive, Hive.apiary_id == Apiary.id)
        .join(Inspection, Inspection.hive_id == Hive.id)
        .join(User, User.id == Apiary.user_id)
        .filter(Inspection.varroa_count.is_(None))
        .group_by(Apiary.id, Apiary.name, User.email)
        .order_by(func.count(Inspection.id).desc())
        .all()
    )
    return [
        NoVarroaApiaryOut(
            apiary_id=apiary_id,
            apiary_name=apiary_name,
            owner_email=email,
            missing_varroa_count=missing,
        )
        for apiary_id, apiary_name, email, missing in rows
    ]


@router.get("/health/zero-inspection-hives")
def health_zero_inspection_hives(admin: CurrentAdmin, db: DB) -> list:
    rows = _zero_inspection_hives_q(db).all()
    return [
        ZeroInspectionHiveOut(
            id=hive.id, name=hive.name, hive_type=hive.hive_type,
            apiary_id=hive.apiary_id, apiary_name=apiary_name,
            owner_email=email, initialized_at=hive.initialized_at,
        )
        for hive, apiary_name, email in rows
    ]


# ---------------------------------------------------------------------------
# Token management (force-logout)
# ---------------------------------------------------------------------------

def _active_tokens_q(db, user_id: str):
    now = datetime.utcnow()
    return (
        db.query(RefreshToken)
        .filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked.is_(False),
            RefreshToken.expires_at > now,
        )
    )


@router.get("/tokens/stats")
def token_stats(admin: CurrentAdmin, db: DB) -> AdminTokenStats:
    now = datetime.utcnow()
    active_q = db.query(RefreshToken).filter(
        RefreshToken.revoked.is_(False),
        RefreshToken.expires_at > now,
    )
    total_active = active_q.count()
    users_with_sessions = (
        active_q.with_entities(func.count(func.distinct(RefreshToken.user_id))).scalar() or 0
    )
    avg_per_user = round(total_active / users_with_sessions, 2) if users_with_sessions else 0.0
    return AdminTokenStats(
        total_active_sessions=total_active,
        users_with_active_sessions=users_with_sessions,
        avg_sessions_per_user=avg_per_user,
    )


@router.get("/users/{user_id}/tokens")
def list_user_tokens(user_id: str, admin: CurrentAdmin, db: DB) -> list:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found."},
        )
    tokens = _active_tokens_q(db, user_id).order_by(RefreshToken.expires_at.desc()).all()
    return [AdminTokenOut(id=t.id, expires_at=t.expires_at) for t in tokens]


@router.delete("/users/{user_id}/tokens", status_code=204)
def revoke_user_tokens(user_id: str, admin: CurrentAdmin, db: DB):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found."},
        )
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update(
        {"revoked": True}, synchronize_session=False
    )
    db.commit()


# ---------------------------------------------------------------------------
# Hornet Tracker — admin overrides
# ---------------------------------------------------------------------------

@router.put("/hornets/sightings/{sighting_id}/status", status_code=204)
def set_sighting_status(
    sighting_id: str, body: HornetSightingStatusUpdate, admin: CurrentAdmin, db: DB
):
    sighting = db.get(HornetSighting, sighting_id)
    if sighting is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "HORNET_SIGHTING_NOT_FOUND", "message": "Sighting not found."},
        )
    sighting.status = body.status
    db.commit()
