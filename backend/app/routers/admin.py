from fastapi import APIRouter

from app.deps import CurrentAdmin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/ping")
def ping(admin: CurrentAdmin) -> dict:
    """Health-check for the admin dependency. Returns 403 for non-admins."""
    return {"ok": True, "email": admin.email}
