import math
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func

from app.deps import CurrentAdmin, DB
from app.models import Apiary, Hive, Inspection, User
from app.schemas import AdminUserDetail, PaginatedResponse, SupporterUpdate, UserOut

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
