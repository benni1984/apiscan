import math
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query

from app.deps import CurrentUser, DB
from app.i18n import error
from app.models import Hive, Inspection
from app.schemas import InspectionCreate, InspectionOut, InspectionUpdate, PaginatedResponse

router = APIRouter(tags=["inspections"])


def _get_hive_or_404(hive_id: str, user_id: str, db: DB, lang):
    hive = db.get(Hive, hive_id)
    if not hive or hive.user_id != user_id:
        raise HTTPException(404, detail=error("HIVE_NOT_FOUND", lang))
    return hive


def _get_inspection_or_404(inspection_id: str, user_id: str, db: DB, lang):
    insp = db.get(Inspection, inspection_id)
    if not insp:
        raise HTTPException(404, detail=error("INSPECTION_NOT_FOUND", lang))
    hive = db.get(Hive, insp.hive_id)
    if not hive or hive.user_id != user_id:
        raise HTTPException(404, detail=error("INSPECTION_NOT_FOUND", lang))
    return insp


@router.get("/hives/{hive_id}/inspections", response_model=PaginatedResponse)
def list_inspections(
    hive_id: str,
    current_user: CurrentUser,
    db: DB,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    accept_language: Optional[str] = Header(default=None),
):
    _get_hive_or_404(hive_id, current_user.id, db, accept_language)
    q = db.query(Inspection).filter(Inspection.hive_id == hive_id).order_by(Inspection.date.desc())
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    return PaginatedResponse(
        items=[InspectionOut.model_validate(i) for i in items],
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total else 0,
    )


@router.post("/hives/{hive_id}/inspections", response_model=InspectionOut, status_code=201)
def create_inspection(
    hive_id: str,
    body: InspectionCreate,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    _get_hive_or_404(hive_id, current_user.id, db, accept_language)
    insp = Inspection(hive_id=hive_id, **body.model_dump())
    db.add(insp)
    db.commit()
    db.refresh(insp)
    return InspectionOut.model_validate(insp)


@router.get("/inspections/{inspection_id}", response_model=InspectionOut)
def get_inspection(
    inspection_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    return InspectionOut.model_validate(
        _get_inspection_or_404(inspection_id, current_user.id, db, accept_language)
    )


@router.put("/inspections/{inspection_id}", response_model=InspectionOut)
def update_inspection(
    inspection_id: str,
    body: InspectionUpdate,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    insp = _get_inspection_or_404(inspection_id, current_user.id, db, accept_language)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(insp, field, value)
    db.commit()
    db.refresh(insp)
    return InspectionOut.model_validate(insp)


@router.delete("/inspections/{inspection_id}", status_code=204)
def delete_inspection(
    inspection_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    insp = _get_inspection_or_404(inspection_id, current_user.id, db, accept_language)
    db.delete(insp)
    db.commit()
