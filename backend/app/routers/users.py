from fastapi import APIRouter
from app.deps import CurrentUser, DB
from app.schemas import UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: CurrentUser):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(body: UserUpdate, current_user: CurrentUser, db: DB):
    if body.name is not None:
        current_user.name = body.name
    if body.locale is not None:
        current_user.locale = body.locale
    db.commit()
    db.refresh(current_user)
    return current_user
