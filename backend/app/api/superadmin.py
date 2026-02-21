from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models
from app.auth import verify_password, create_access_token
from app.config import settings
from app.dependencies import get_current_user, require_superadmin
from app.schemas import (
    SuperadminLoginRequest,
    LoginResponse,
    UserResponse,
    PortalCreate,
    PortalUpdate,
    PortalResponse,
)
from app.dependencies import user_to_response

router = APIRouter(prefix="/super-admin", tags=["super-admin"])


@router.post("/login", response_model=LoginResponse)
def superadmin_login(data: SuperadminLoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.username == settings.superadmin_login,
        models.User.role == "superAdmin",
    ).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    token = create_access_token({"sub": str(user.id), "role": "superAdmin"})
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=user_to_response(user, db),
    )


def _portal_to_response(p: models.Portal, db: Session) -> PortalResponse:
    users_count = db.query(func.count(models.User.id)).filter(models.User.portal_id == p.id).scalar() or 0
    return PortalResponse(
        id=p.slug,
        name=p.name,
        ownerEmail=p.owner_email,
        createdAt=p.created_at.isoformat() if p.created_at else "",
        usersCount=users_count,
        subscription={"plan": "pro", "isPaid": True, "paidUntil": None},
        status=p.status or "active",
        limits={"maxUsers": 50, "maxStorageMb": 5000},
    )


@router.get("/portals", response_model=list[PortalResponse])
def get_all_portals(
    current_user: models.User = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    portals = db.query(models.Portal).all()
    return [_portal_to_response(p, db) for p in portals]


@router.get("/portals/{portal_id}", response_model=PortalResponse)
def get_portal(
    portal_id: str,
    current_user: models.User = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    portal = db.query(models.Portal).filter(models.Portal.slug == portal_id).first()
    if not portal:
        raise HTTPException(status_code=404, detail="Портал не найден")
    return _portal_to_response(portal, db)


@router.post("/portals", response_model=PortalResponse)
def create_portal(
    data: PortalCreate,
    current_user: models.User = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    slug = "portal-" + (data.name or "new")[:32].lower().replace(" ", "-")
    if db.query(models.Portal).filter(models.Portal.slug == slug).first():
        slug = slug + "-" + str(hash(data.ownerEmail) % 10000)
    portal = models.Portal(
        slug=slug,
        name=data.name or "Новый портал",
        owner_email=data.ownerEmail,
        status="active",
    )
    db.add(portal)
    db.commit()
    db.refresh(portal)
    return _portal_to_response(portal, db)


@router.put("/portals/{portal_id}", response_model=PortalResponse)
def update_portal(
    portal_id: str,
    data: PortalUpdate,
    current_user: models.User = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    portal = db.query(models.Portal).filter(models.Portal.slug == portal_id).first()
    if not portal:
        raise HTTPException(status_code=404, detail="Портал не найден")
    if data.name is not None:
        portal.name = data.name
    if data.status is not None:
        portal.status = data.status
    if data.subscription is not None:
        pass  # store in portal if we add columns
    db.commit()
    db.refresh(portal)
    return _portal_to_response(portal, db)


@router.delete("/portals/{portal_id}", status_code=204)
def delete_portal(
    portal_id: str,
    current_user: models.User = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    portal = db.query(models.Portal).filter(models.Portal.slug == portal_id).first()
    if not portal:
        raise HTTPException(status_code=404, detail="Портал не найден")
    db.delete(portal)
    db.commit()
    return None


@router.post("/portals/{portal_id}/block", response_model=PortalResponse)
def block_portal(
    portal_id: str,
    current_user: models.User = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    portal = db.query(models.Portal).filter(models.Portal.slug == portal_id).first()
    if not portal:
        raise HTTPException(status_code=404, detail="Портал не найден")
    portal.status = "blocked"
    db.commit()
    db.refresh(portal)
    return _portal_to_response(portal, db)


@router.post("/portals/{portal_id}/unblock", response_model=PortalResponse)
def unblock_portal(
    portal_id: str,
    current_user: models.User = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    portal = db.query(models.Portal).filter(models.Portal.slug == portal_id).first()
    if not portal:
        raise HTTPException(status_code=404, detail="Портал не найден")
    portal.status = "active"
    db.commit()
    db.refresh(portal)
    return _portal_to_response(portal, db)
