from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from dependencies import get_current_user
from auth import get_password_hash, verify_password

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=schemas.UserProfile, summary="Профиль")
def get_me(current_user: models.User = Depends(get_current_user)):
    return schemas.UserProfile.from_orm(current_user)


@router.patch("/me", response_model=schemas.UserProfile, summary="Обновить профиль")
def update_me(
    request: schemas.UpdateProfileRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if request.first_name is not None:
        current_user.first_name = request.first_name
    if request.last_name is not None:
        current_user.last_name = request.last_name
    if request.phone is not None:
        current_user.phone = request.phone

    db.commit()
    db.refresh(current_user)
    return schemas.UserProfile.from_orm(current_user)


@router.put("/me/password", status_code=204, summary="Сменить пароль")
def change_password(
    request: schemas.ChangePasswordRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(request.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid current password")

    current_user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    return None
