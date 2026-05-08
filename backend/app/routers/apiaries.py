import math
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query
from app.deps import CurrentUser, DB
from app.i18n import error
from app.models import Apiary
from app.schemas import ApiaryCreate, ApiaryOut, ApiaryUpdate, PaginatedResponse

router = APIRouter(prefix="/apiaries", tags=["apiaries"])


def _get_or_404(apiary_id: str, user_id: str, db: DB, lang):
    apiary = db.get(Apiary, apiary_id)
    if not apiary or apiary.user_id != user_id:
        raise HTTPException(404, detail=error("APIARY_NOT_FOUND", lang))
    return apiary


def _to_out(apiary: Apiary) -> ApiaryOut:
    return ApiaryOut(
        id=apiary.id,
        name=apiary.name,
        description=apiary.description,
        latitude=apiary.latitude,
        longitude=apiary.longitude,
        address=apiary.address,
        hive_count=len(apiary.hives),
        is_public=apiary.is_public,
        created_at=apiary.created_at,
    )


@router.get("", response_model=PaginatedResponse)
def list_apiaries(
    current_user: CurrentUser,
    db: DB,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    q = db.query(Apiary).filter(Apiary.user_id == current_user.id)
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    return PaginatedResponse(
        items=[_to_out(a) for a in items],
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total else 0,
    )


@router.post("", response_model=ApiaryOut, status_code=201)
def create_apiary(body: ApiaryCreate, current_user: CurrentUser, db: DB):
    apiary = Apiary(user_id=current_user.id, **body.model_dump())
    db.add(apiary)
    db.commit()
    db.refresh(apiary)
    return _to_out(apiary)


@router.get("/{apiary_id}", response_model=ApiaryOut)
def get_apiary(
    apiary_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    return _to_out(_get_or_404(apiary_id, current_user.id, db, accept_language))


@router.put("/{apiary_id}", response_model=ApiaryOut)
def update_apiary(
    apiary_id: str,
    body: ApiaryUpdate,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    apiary = _get_or_404(apiary_id, current_user.id, db, accept_language)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(apiary, field, value)
    db.commit()
    db.refresh(apiary)
    return _to_out(apiary)


@router.delete("/{apiary_id}", status_code=204)
def delete_apiary(
    apiary_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    apiary = _get_or_404(apiary_id, current_user.id, db, accept_language)
    if apiary.hives:
        raise HTTPException(409, detail=error("APIARY_HAS_HIVES", accept_language))
    db.delete(apiary)
    db.commit()
