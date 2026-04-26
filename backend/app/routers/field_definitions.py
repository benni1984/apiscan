from typing import Optional
from fastapi import APIRouter, Header, HTTPException
from app.deps import CurrentUser, DB
from app.i18n import error
from app.models import Apiary, FieldDefinition
from app.schemas import FieldDefinitionCreate, FieldDefinitionOut, FieldDefinitionUpdate

router = APIRouter(tags=["field-definitions"])


def _get_apiary_or_404(apiary_id: str, user_id: str, db: DB, lang):
    apiary = db.get(Apiary, apiary_id)
    if not apiary or apiary.user_id != user_id:
        raise HTTPException(404, detail=error("APIARY_NOT_FOUND", lang))
    return apiary


def _get_fd_or_404(fd_id: str, user_id: str, db: DB, lang):
    fd = db.get(FieldDefinition, fd_id)
    if not fd or fd.user_id != user_id:
        raise HTTPException(404, detail=error("FIELD_DEFINITION_NOT_FOUND", lang))
    return fd


# User-scope

@router.get("/field-definitions", response_model=list[FieldDefinitionOut])
def list_user_field_definitions(current_user: CurrentUser, db: DB):
    return db.query(FieldDefinition).filter(
        FieldDefinition.user_id == current_user.id,
        FieldDefinition.scope == "user",
    ).order_by(FieldDefinition.sort_order).all()


@router.post("/field-definitions", response_model=FieldDefinitionOut, status_code=201)
def create_user_field_definition(
    body: FieldDefinitionCreate,
    current_user: CurrentUser,
    db: DB,
):
    fd = FieldDefinition(
        user_id=current_user.id,
        scope="user",
        apiary_id=None,
        **body.model_dump(),
    )
    db.add(fd)
    db.commit()
    db.refresh(fd)
    return fd


@router.put("/field-definitions/{fd_id}", response_model=FieldDefinitionOut)
def update_user_field_definition(
    fd_id: str,
    body: FieldDefinitionUpdate,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    fd = _get_fd_or_404(fd_id, current_user.id, db, accept_language)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(fd, field, value)
    db.commit()
    db.refresh(fd)
    return fd


@router.delete("/field-definitions/{fd_id}", status_code=204)
def delete_user_field_definition(
    fd_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    fd = _get_fd_or_404(fd_id, current_user.id, db, accept_language)
    db.delete(fd)
    db.commit()


# Apiary-scope

@router.get("/apiaries/{apiary_id}/field-definitions", response_model=list[FieldDefinitionOut])
def list_apiary_field_definitions(
    apiary_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    _get_apiary_or_404(apiary_id, current_user.id, db, accept_language)
    return db.query(FieldDefinition).filter(
        FieldDefinition.apiary_id == apiary_id,
        FieldDefinition.scope == "apiary",
    ).order_by(FieldDefinition.sort_order).all()


@router.post("/apiaries/{apiary_id}/field-definitions", response_model=FieldDefinitionOut, status_code=201)
def create_apiary_field_definition(
    apiary_id: str,
    body: FieldDefinitionCreate,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    _get_apiary_or_404(apiary_id, current_user.id, db, accept_language)
    fd = FieldDefinition(
        user_id=current_user.id,
        scope="apiary",
        apiary_id=apiary_id,
        **body.model_dump(),
    )
    db.add(fd)
    db.commit()
    db.refresh(fd)
    return fd


@router.put("/apiaries/{apiary_id}/field-definitions/{fd_id}", response_model=FieldDefinitionOut)
def update_apiary_field_definition(
    apiary_id: str,
    fd_id: str,
    body: FieldDefinitionUpdate,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    _get_apiary_or_404(apiary_id, current_user.id, db, accept_language)
    fd = _get_fd_or_404(fd_id, current_user.id, db, accept_language)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(fd, field, value)
    db.commit()
    db.refresh(fd)
    return fd


@router.delete("/apiaries/{apiary_id}/field-definitions/{fd_id}", status_code=204)
def delete_apiary_field_definition(
    apiary_id: str,
    fd_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    _get_apiary_or_404(apiary_id, current_user.id, db, accept_language)
    fd = _get_fd_or_404(fd_id, current_user.id, db, accept_language)
    db.delete(fd)
    db.commit()
