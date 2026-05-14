import math
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, or_, and_

from app.deps import CurrentAdmin, DB
from app.models import Apiary, Hive, Inspection, User
from app.schemas import (
    AdminApiaryOut, AdminPlatformStats, AdminUserDetail, PaginatedResponse,
    SignupDay, SupporterUpdate, UserOut,
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
