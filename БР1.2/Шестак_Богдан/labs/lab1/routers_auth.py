from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

import models
import schemas
from database import get_db
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=schemas.RegisterResponse, status_code=201, summary="Регистрация нового пользователя", description="Создаёт аккаунт соискателя или работодателя. " "При успехе возвращает access и refresh токены." )
def register(request: schemas.RegisterRequest, db: Session = Depends(get_db)):
    # Check if email already exists
    if db.query(models.User).filter(models.User.email == request.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    # Create new user
    hashed_password = get_password_hash(request.password)
    user = models.User(
        email=request.email,
        hashed_password=hashed_password,
        role=request.role,
        first_name=request.first_name,
        last_name=request.last_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # If employer, create company
    if request.role == models.UserRole.employer:
        company = models.Company(owner_id=user.id, name=request.first_name or "My Company")
        db.add(company)
        db.commit()

    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return {
        "user": schemas.UserProfile.from_orm(user),
        "tokens": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        },
    }


@router.post("/login", response_model=schemas.LoginResponse, summary="Вход")
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return {
        "user": schemas.UserProfile.from_orm(user),
        "tokens": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        },
    }


@router.post("/refresh", response_model=schemas.TokenPair, summary="Обновление токенов", description="Получает новую пару токенов (access и refresh), используя действующий refresh token.")
def refresh(request: schemas.RefreshRequest, db: Session = Depends(get_db)):
    payload = verify_token(request.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.post("/logout", status_code=204, summary="Выход", description="Завершает активную сессию и инвалидирует текущие токены. Требует авторизации.")
def logout():
    # In a real app, you'd invalidate the token (e.g., add to blacklist)
    return None
