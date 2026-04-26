import io
import math
import uuid
from typing import Optional

import qrcode
from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.deps import CurrentUser, DB
from app.i18n import error
from app.models import QrBatch, QrToken
from app.schemas import QrBatchCreate, QrBatchOut, QrBatchSummary, PaginatedResponse

router = APIRouter(prefix="/qr-batches", tags=["qr-batches"])


def _get_or_404(batch_id: str, user_id: str, db: DB, lang):
    batch = db.get(QrBatch, batch_id)
    if not batch or batch.user_id != user_id:
        raise HTTPException(404, detail=error("QR_BATCH_NOT_FOUND", lang))
    return batch


def _to_summary(batch: QrBatch) -> QrBatchSummary:
    linked = sum(1 for t in batch.tokens if t.hive is not None)
    return QrBatchSummary(id=batch.id, count=batch.count, created_at=batch.created_at, linked_count=linked)


@router.get("", response_model=PaginatedResponse)
def list_batches(
    current_user: CurrentUser,
    db: DB,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    q = db.query(QrBatch).filter(QrBatch.user_id == current_user.id).order_by(QrBatch.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    return PaginatedResponse(
        items=[_to_summary(b) for b in items],
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total else 0,
    )


@router.post("", response_model=QrBatchOut, status_code=201)
def create_batch(body: QrBatchCreate, current_user: CurrentUser, db: DB):
    batch = QrBatch(user_id=current_user.id, count=body.count)
    db.add(batch)
    db.flush()
    for _ in range(body.count):
        db.add(QrToken(token=str(uuid.uuid4()), batch_id=batch.id, user_id=current_user.id))
    db.commit()
    db.refresh(batch)
    return _batch_to_out(batch)


@router.get("/{batch_id}", response_model=QrBatchOut)
def get_batch(
    batch_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    batch = _get_or_404(batch_id, current_user.id, db, accept_language)
    return _batch_to_out(batch)


@router.get("/{batch_id}/pdf")
def get_batch_pdf(
    batch_id: str,
    current_user: CurrentUser,
    db: DB,
    accept_language: Optional[str] = Header(default=None),
):
    batch = _get_or_404(batch_id, current_user.id, db, accept_language)
    pdf_bytes = _generate_pdf(batch)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=qr-batch-{batch_id[:8]}.pdf"},
    )


def _batch_to_out(batch: QrBatch) -> QrBatchOut:
    from app.schemas import QrTokenOut
    tokens = [
        QrTokenOut(token=t.token, linked_hive_id=t.hive.id if t.hive else None)
        for t in batch.tokens
    ]
    return QrBatchOut(id=batch.id, count=batch.count, created_at=batch.created_at, tokens=tokens)


def _generate_pdf(batch: QrBatch) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    from reportlab.pdfgen import canvas as rl_canvas

    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=A4)
    page_w, page_h = A4

    label_w = 6 * cm
    label_h = 6 * cm
    cols = int(page_w // label_w)
    rows = int(page_h // label_h)
    per_page = cols * rows

    for idx, token in enumerate(batch.tokens):
        if idx > 0 and idx % per_page == 0:
            c.showPage()

        pos = idx % per_page
        col = pos % cols
        row = pos // cols

        x = col * label_w + 0.5 * cm
        y = page_h - (row + 1) * label_h + 0.5 * cm

        qr = qrcode.make(token.token)
        qr_buf = io.BytesIO()
        qr.save(qr_buf, format="PNG")
        qr_buf.seek(0)

        img_size = label_w - 1 * cm
        c.drawInlineImage(qr_buf, x, y + 0.6 * cm, width=img_size, height=img_size)
        c.setFontSize(6)
        c.drawCentredString(x + img_size / 2, y + 0.1 * cm, token.token[:16] + "…")

    c.save()
    return buf.getvalue()
