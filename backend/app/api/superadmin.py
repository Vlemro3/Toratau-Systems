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


def _portal_to_response(p: models.Portal, db: Session, users_count: int | None = None) -> PortalResponse:
    if users_count is None:
        users_count = db.query(func.count(models.User.id)).filter(models.User.portal_id == p.id).scalar() or 0
    # Read real subscription data from DB
    sub = db.query(models.Subscription).filter(models.Subscription.portal_id == p.id).first()
    if sub:
        is_paid = sub.status in ("active", "expiring")
        paid_until = sub.current_period_end.isoformat() if sub.current_period_end else None
        plan_tier = sub.plan_tier or "start"
    else:
        is_paid = False
        paid_until = None
        plan_tier = "start"
    return PortalResponse(
        id=p.slug,
        name=p.name,
        ownerEmail=p.owner_email,
        createdAt=p.created_at.isoformat() if p.created_at else "",
        usersCount=users_count,
        subscription={"plan": plan_tier, "isPaid": is_paid, "paidUntil": paid_until},
        status=p.status or "active",
        limits={"maxUsers": 50, "maxStorageMb": 5000},
    )


@router.get("/portals", response_model=list[PortalResponse])
def get_all_portals(
    current_user: models.User = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    portals = db.query(models.Portal).all()
    # Один запрос вместо N+1: подсчёт пользователей по всем порталам
    counts = dict(
        db.query(models.User.portal_id, func.count(models.User.id))
        .group_by(models.User.portal_id)
        .all()
    )
    return [_portal_to_response(p, db, users_count=counts.get(p.id, 0)) for p in portals]


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
        sub = db.query(models.Subscription).filter(models.Subscription.portal_id == portal.id).first()
        if sub:
            if "plan" in data.subscription:
                sub.plan_tier = data.subscription["plan"]
            if "isPaid" in data.subscription:
                if data.subscription["isPaid"]:
                    if sub.status in ("trial", "expired", "blocked"):
                        sub.status = "active"
                else:
                    sub.status = "expired"
            if "paidUntil" in data.subscription:
                from datetime import datetime as _dt
                raw = data.subscription["paidUntil"]
                if raw:
                    try:
                        sub.current_period_end = _dt.fromisoformat(raw)
                    except (ValueError, TypeError):
                        pass
                else:
                    sub.current_period_end = None
        else:
            # Create subscription if it doesn't exist yet
            owner = db.query(models.User).filter(models.User.portal_id == portal.id).first()
            if owner:
                from datetime import datetime as _dt
                new_sub = models.Subscription(
                    portal_id=portal.id,
                    user_id=owner.id,
                    status="active" if data.subscription.get("isPaid") else "trial",
                    plan_tier=data.subscription.get("plan", "start"),
                )
                raw = data.subscription.get("paidUntil")
                if raw:
                    try:
                        new_sub.current_period_end = _dt.fromisoformat(raw)
                    except (ValueError, TypeError):
                        pass
                db.add(new_sub)
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
    # Delete related entities that may not have CASCADE in FK
    db.query(models.AuditLog).filter(models.AuditLog.portal_id == portal.id).delete()
    db.query(models.CustomExpenseCategory).filter(models.CustomExpenseCategory.portal_id == portal.id).delete()
    db.query(models.Organization).filter(models.Organization.portal_id == portal.id).delete()
    db.query(models.PaymentLog).filter(models.PaymentLog.portal_id == portal.id).delete()
    # Delete billing invoices (via subscription)
    sub = db.query(models.Subscription).filter(models.Subscription.portal_id == portal.id).first()
    if sub:
        db.query(models.BillingInvoice).filter(models.BillingInvoice.subscription_id == sub.id).delete()
        db.delete(sub)
    # Delete work data from projects
    projects = db.query(models.Project).filter(models.Project.portal_id == portal.id).all()
    for proj in projects:
        db.query(models.WorkLog).filter(models.WorkLog.project_id == proj.id).delete()
        db.query(models.Payout).filter(models.Payout.project_id == proj.id).delete()
        db.query(models.Expense).filter(models.Expense.project_id == proj.id).delete()
        db.query(models.CashIn).filter(models.CashIn.project_id == proj.id).delete()
    db.query(models.Project).filter(models.Project.portal_id == portal.id).delete()
    db.query(models.Crew).filter(models.Crew.portal_id == portal.id).delete()
    db.query(models.WorkType).filter(models.WorkType.portal_id == portal.id).delete()
    # Delete user-project links and users
    users = db.query(models.User).filter(models.User.portal_id == portal.id).all()
    for u in users:
        db.query(models.UserProject).filter(models.UserProject.user_id == u.id).delete()
    db.query(models.User).filter(models.User.portal_id == portal.id).delete()
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
