from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.dependencies import get_current_user, user_to_response, require_admin
from app.schemas import PayoutCreate, PayoutUpdate, PayoutResponse, CrewResponse, UserResponse
from app.services.audit import log_audit

router = APIRouter(prefix="/payouts", tags=["payouts"])


def _foreman_can_access_project(db: Session, user: models.User, project_id: int) -> bool:
    if user.role != "foreman":
        return True
    return db.query(models.UserProject).filter(
        models.UserProject.user_id == user.id,
        models.UserProject.project_id == project_id,
    ).first() is not None


def _enrich_payout(db: Session, p: models.Payout) -> PayoutResponse:
    crew = db.query(models.Crew).filter(models.Crew.id == p.crew_id).first()
    creator = db.query(models.User).filter(models.User.id == p.created_by).first()
    updated_by_user = db.query(models.User).filter(models.User.id == p.updated_by).first() if p.updated_by else None
    return PayoutResponse(
        id=p.id,
        project_id=p.project_id,
        crew_id=p.crew_id,
        date=p.date.isoformat() if p.date else "",
        amount=float(p.amount or 0),
        payment_method=p.payment_method or "transfer",
        comment=p.comment or "",
        status=p.status or "created",
        created_by=p.created_by,
        approved_by=p.approved_by,
        updated_by=p.updated_by,
        crew=CrewResponse(id=crew.id, name=crew.name, contact=crew.contact or "", phone=crew.phone, notes=crew.notes or "", is_active=crew.is_active) if crew else None,
        creator=user_to_response(creator, db) if creator else None,
        updated_by_user=user_to_response(updated_by_user, db) if updated_by_user else None,
    )


@router.get("", response_model=list[PayoutResponse])
def get_payouts(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
    project_id: int | None = Query(None),
):
    if not current_user.portal_id:
        return []
    q = db.query(models.Payout).join(models.Project).filter(models.Project.portal_id == current_user.portal_id)
    if project_id is not None:
        if not _foreman_can_access_project(db, current_user, project_id):
            return []
        q = q.filter(models.Payout.project_id == project_id)
    elif current_user.role == "foreman":
        allowed = db.query(models.UserProject.project_id).filter(models.UserProject.user_id == current_user.id).subquery()
        q = q.filter(models.Payout.project_id.in_(allowed))
    payouts = q.all()
    return [_enrich_payout(db, p) for p in payouts]


@router.get("/{payout_id}", response_model=PayoutResponse)
def get_payout(
    payout_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.query(models.Payout).join(models.Project).filter(
        models.Payout.id == payout_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Выплата не найдена")
    if not _foreman_can_access_project(db, current_user, p.project_id):
        raise HTTPException(status_code=404, detail="Выплата не найдена")
    return _enrich_payout(db, p)


@router.post("", response_model=PayoutResponse)
def create_payout(
    data: PayoutCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.query(models.Project).filter(
        models.Project.id == data.project_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Объект не найден")
    if not _foreman_can_access_project(db, current_user, data.project_id):
        raise HTTPException(status_code=403, detail="Нет доступа")
    crew = db.query(models.Crew).filter(
        models.Crew.id == data.crew_id,
        models.Crew.portal_id == current_user.portal_id,
    ).first()
    if not crew:
        raise HTTPException(status_code=404, detail="Подрядчик не найден")
    p = models.Payout(
        project_id=data.project_id,
        crew_id=data.crew_id,
        date=datetime.fromisoformat(data.date.replace("Z", "+00:00")).date() if data.date else datetime.utcnow().date(),
        amount=Decimal(str(data.amount)),
        payment_method=data.payment_method or "transfer",
        comment=data.comment or "",
        status="created",
        created_by=current_user.id,
        approved_by=None,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    log_audit(db, "CREATE", "payout", str(p.id), current_user.portal_id, current_user.id, None)
    return _enrich_payout(db, p)


@router.put("/{payout_id}", response_model=PayoutResponse)
def update_payout(
    payout_id: int,
    data: PayoutUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.query(models.Payout).join(models.Project).filter(
        models.Payout.id == payout_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Выплата не найдена")
    if not _foreman_can_access_project(db, current_user, p.project_id):
        raise HTTPException(status_code=403, detail="Нет доступа")
    if data.date is not None:
        p.date = datetime.fromisoformat(data.date.replace("Z", "+00:00")).date()
    if data.amount is not None:
        p.amount = Decimal(str(data.amount))
    if data.payment_method is not None:
        p.payment_method = data.payment_method
    if data.comment is not None:
        p.comment = data.comment
    p.updated_by = current_user.id
    db.commit()
    db.refresh(p)
    log_audit(db, "UPDATE", "payout", str(payout_id), current_user.portal_id, current_user.id, None)
    return _enrich_payout(db, p)


@router.delete("/{payout_id}", status_code=204)
def delete_payout(
    payout_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.query(models.Payout).join(models.Project).filter(
        models.Payout.id == payout_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Выплата не найдена")
    if not _foreman_can_access_project(db, current_user, p.project_id):
        raise HTTPException(status_code=403, detail="Нет доступа")
    db.delete(p)
    log_audit(db, "DELETE", "payout", str(payout_id), current_user.portal_id, current_user.id, None)
    db.commit()
    return None


@router.post("/{payout_id}/approve", response_model=PayoutResponse)
def approve_payout(
    payout_id: int,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    p = db.query(models.Payout).join(models.Project).filter(
        models.Payout.id == payout_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Выплата не найдена")
    p.status = "approved"
    p.approved_by = current_user.id
    p.updated_by = current_user.id
    db.commit()
    db.refresh(p)
    log_audit(db, "APPROVE", "payout", str(payout_id), current_user.portal_id, current_user.id, None)
    return _enrich_payout(db, p)


@router.post("/{payout_id}/cancel", response_model=PayoutResponse)
def cancel_payout(
    payout_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.query(models.Payout).join(models.Project).filter(
        models.Payout.id == payout_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Выплата не найдена")
    if not _foreman_can_access_project(db, current_user, p.project_id):
        raise HTTPException(status_code=403, detail="Нет доступа")
    p.status = "cancelled"
    p.updated_by = current_user.id
    db.commit()
    db.refresh(p)
    log_audit(db, "REJECT", "payout", str(payout_id), current_user.portal_id, current_user.id, None)
    return _enrich_payout(db, p)
