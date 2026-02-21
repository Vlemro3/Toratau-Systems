from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth import verify_password, get_password_hash, create_access_token
from app.config import settings
from app.dependencies import get_current_user, user_to_response
from app.schemas import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    ProfileUpdate,
    ChangePasswordRequest,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    # Суперадмин: без портала, по username + role superAdmin
    superadmin_user = db.query(models.User).filter(
        models.User.username == data.username,
        models.User.role == "superAdmin",
        models.User.portal_id.is_(None),
    ).first()
    if superadmin_user and verify_password(data.password, superadmin_user.hashed_password):
        if not superadmin_user.is_active:
            raise HTTPException(status_code=401, detail="Пользователь деактивирован")
        token = create_access_token({"sub": str(superadmin_user.id), "role": superadmin_user.role})
        return LoginResponse(
            access_token=token,
            token_type="bearer",
            user=user_to_response(superadmin_user, db),
        )
    # Порталный пользователь
    portal_slug = data.portal_slug or settings.default_portal_slug
    portal = db.query(models.Portal).filter(models.Portal.slug == portal_slug).first()
    if not portal:
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    if portal.status == "blocked":
        raise HTTPException(status_code=403, detail="Портал заблокирован")
    user = db.query(models.User).filter(
        models.User.portal_id == portal.id,
        models.User.username == data.username,
    ).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Пользователь деактивирован")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=user_to_response(user, db),
    )


@router.post("/register", response_model=LoginResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Пользователь с таким логином уже существует")
    slug = "portal-" + data.username.lower().replace(" ", "-")[:32]
    if db.query(models.Portal).filter(models.Portal.slug == slug).first():
        slug = slug + "-" + str(hash(data.email) % 10000)
    portal = models.Portal(
        slug=slug,
        name=f"Портал: {data.full_name}",
        owner_email=data.email,
        status="active",
    )
    db.add(portal)
    db.flush()
    user = models.User(
        username=data.username,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        role="admin",
        is_active=True,
        portal_id=portal.id,
    )
    db.add(user)
    db.flush()
    project = models.Project(
        portal_id=portal.id,
        name="Демонстрационный объект",
        address="",
        client="",
        start_date=portal.created_at.date() if portal.created_at else date.today(),
        status="new",
        contract_amount=1_000_000,
        planned_cost=800_000,
        notes="",
    )
    db.add(project)
    db.commit()
    db.refresh(portal)
    db.refresh(user)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=user_to_response(user, db),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return user_to_response(current_user, db)


@router.put("/profile", response_model=UserResponse)
def update_profile(
    data: ProfileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.full_name = data.full_name
    db.commit()
    db.refresh(current_user)
    return user_to_response(current_user, db)


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Текущий пароль неверен")
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return None
