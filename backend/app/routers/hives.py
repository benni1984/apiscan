import io
import math
from typing import Optional, Union

import qrcode
from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.deps import CurrentUser, DB
from app.i18n import error
from app.models import Apiary, Hive, QrBatch, QrToken
from app.schemas import HiveCreate, HiveInitialize, HiveOut, HiveUpdate, PaginatedResponse, QrScanUnlinked

router = APIRouter(tags=["hives"])


def _get_hive_or_404(hive_id: str, user_id: str, db: DB, lang):
    hive = db.get(Hive, hive_id)
    if not hive or hive.user_id != user_id:
        raise HTTPException(404, detail=error("HIVE_NOT_FOUND", lang))
    return hive


def _hive_out(hive: Hive) -> HiveOut:
    return HiveOut.model_validate(hive)


@router.get("/hives/by-qr/{token}", response_model=Union[HiveOut, QrScanUnlinked])
def resolve_qr(
    token: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    qr = db.get(QrToken, token)
    if not qr or qr.user_id != current_user.id:
        raise HTTPException(404, detail=error("QR_TOKEN_NOT_FOUND", accept_language))
    if qr.hive is None:
        return QrScanUnlinked(token=token)
    return _hive_out(qr.hive)


@router.get("/apiaries/{apiary_id}/hives", response_model=PaginatedResponse)
def list_hives(
    apiary_id: str,
    current_user: CurrentUser,
    db: DB,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    accept_language: Optional[str] = Header(default=None),
):
    apiary = db.get(Apiary, apiary_id)
    if not apiary or apiary.user_id != current_user.id:
        raise HTTPException(404, detail=error("APIARY_NOT_FOUND", accept_language))
    q = db.query(Hive).filter(Hive.apiary_id == apiary_id)
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    return PaginatedResponse(
        items=[_hive_out(h) for h in items],
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total else 0,
    )


@router.post("/apiaries/{apiary_id}/hives", response_model=HiveOut, status_code=201)
def create_hive(
    apiary_id: str,
    body: HiveCreate,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    apiary = db.get(Apiary, apiary_id)
    if not apiary or apiary.user_id != current_user.id:
        raise HTTPException(404, detail=error("APIARY_NOT_FOUND", accept_language))

    batch = QrBatch(user_id=current_user.id, count=1)
    db.add(batch)
    db.flush()

    token = QrToken(user_id=current_user.id, batch_id=batch.id)
    db.add(token)
    db.flush()

    hive = Hive(
        user_id=current_user.id,
        qr_token=token.token,
        apiary_id=apiary_id,
        name=body.name,
        hive_type=body.hive_type,
        acquisition_date=body.acquisition_date,
        notes=body.notes,
    )
    db.add(hive)
    db.commit()
    db.refresh(hive)
    return _hive_out(hive)


@router.post("/hives/initialize", response_model=HiveOut, status_code=201)
def initialize_hive(
    body: HiveInitialize,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    qr = db.get(QrToken, body.qr_token)
    if not qr or qr.user_id != current_user.id:
        raise HTTPException(404, detail=error("QR_TOKEN_NOT_FOUND", accept_language))
    if qr.hive is not None:
        raise HTTPException(409, detail=error("QR_TOKEN_ALREADY_LINKED", accept_language))

    apiary = db.get(Apiary, body.apiary_id)
    if not apiary or apiary.user_id != current_user.id:
        raise HTTPException(404, detail=error("APIARY_NOT_FOUND", accept_language))

    hive = Hive(
        user_id=current_user.id,
        qr_token=body.qr_token,
        apiary_id=body.apiary_id,
        name=body.name,
        hive_type=body.hive_type,
        latitude=body.latitude,
        longitude=body.longitude,
        acquisition_date=body.acquisition_date,
        notes=body.notes,
        custom_fields=body.custom_fields,
    )
    db.add(hive)
    db.commit()
    db.refresh(hive)
    return _hive_out(hive)


@router.get("/hives/{hive_id}", response_model=HiveOut)
def get_hive(
    hive_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    return _hive_out(_get_hive_or_404(hive_id, current_user.id, db, accept_language))


@router.put("/hives/{hive_id}", response_model=HiveOut)
def update_hive(
    hive_id: str,
    body: HiveUpdate,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    hive = _get_hive_or_404(hive_id, current_user.id, db, accept_language)
    if body.apiary_id is not None:
        apiary = db.get(Apiary, body.apiary_id)
        if not apiary or apiary.user_id != current_user.id:
            raise HTTPException(404, detail=error("APIARY_NOT_FOUND", accept_language))
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(hive, field, value)
    db.commit()
    db.refresh(hive)
    return _hive_out(hive)


@router.delete("/hives/{hive_id}", status_code=204)
def delete_hive(
    hive_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    hive = _get_hive_or_404(hive_id, current_user.id, db, accept_language)
    db.delete(hive)
    db.commit()


@router.get("/hives/{hive_id}/qr")
def get_hive_qr(
    hive_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    hive = _get_hive_or_404(hive_id, current_user.id, db, accept_language)
    img = qrcode.make(hive.qr_token)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")
