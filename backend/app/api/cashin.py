from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.dependencies import get_current_user, user_to_response
from app.schemas import CashInCreate, CashInUpdate, CashInResponse, UserResponse
from app.services.audit import log_audit

router = APIRouter(prefix="/cashin", tags=["cashin"])


def _foreman_can_access_project(db: Session, user: models.User, project_id: int) -> bool:
    if user.role != "foreman":
        return True
    return db.query(models.UserProject).filter(
        models.UserProject.user_id == user.id,
        models.UserProject.project_id == project_id,
    ).first() is not None


def _enrich_cash_in(db: Session, c: models.CashIn) -> CashInResponse:
    creator = db.query(models.User).filter(models.User.id == c.created_by).first()
    updated_by_user = db.query(models.User).filter(models.User.id == c.updated_by).first() if c.updated_by else None
    return CashInResponse(
        id=c.id,
        project_id=c.project_id,
        date=c.date.isoformat() if c.date else "",
        amount=float(c.amount or 0),
        comment=c.comment or "",
        file_url=c.file_url,
        created_by=c.created_by,
        updated_by=c.updated_by,
        creator=user_to_response(creator, db) if creator else None,
        updated_by_user=user_to_response(updated_by_user, db) if updated_by_user else None,
    )


@router.get("", response_model=list[CashInResponse])
def get_cash_ins(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
    project_id: int | None = Query(None),
):
    if not current_user.portal_id:
        return []
    q = db.query(models.CashIn).join(models.Project).filter(models.Project.portal_id == current_user.portal_id)
    if project_id is not None:
        if not _foreman_can_access_project(db, current_user, project_id):
            return []
        q = q.filter(models.CashIn.project_id == project_id)
    elif current_user.role == "foreman":
        allowed = db.query(models.UserProject.project_id).filter(models.UserProject.user_id == current_user.id).subquery()
        q = q.filter(models.CashIn.project_id.in_(allowed))
    rows = q.all()
    return [_enrich_cash_in(db, c) for c in rows]


@router.get("/{cash_in_id}", response_model=CashInResponse)
def get_cash_in(
    cash_in_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    c = db.query(models.CashIn).join(models.Project).filter(
        models.CashIn.id == cash_in_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="Платёж не найден")
    if not _foreman_can_access_project(db, current_user, c.project_id):
        raise HTTPException(status_code=404, detail="Платёж не найден")
    return _enrich_cash_in(db, c)


@router.post("", response_model=CashInResponse)
def create_cash_in(
    data: CashInCreate,
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
    c = models.CashIn(
        project_id=data.project_id,
        date=datetime.fromisoformat(data.date.replace("Z", "+00:00")).date() if data.date else datetime.utcnow().date(),
        amount=Decimal(str(data.amount)),
        comment=data.comment or "",
        created_by=current_user.id,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    log_audit(db, "CREATE", "cash_in", str(c.id), current_user.portal_id, current_user.id, None)
    return _enrich_cash_in(db, c)


@router.put("/{cash_in_id}", response_model=CashInResponse)
def update_cash_in(
    cash_in_id: int,
    data: CashInUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    c = db.query(models.CashIn).join(models.Project).filter(
        models.CashIn.id == cash_in_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="Платёж не найден")
    if not _foreman_can_access_project(db, current_user, c.project_id):
        raise HTTPException(status_code=403, detail="Нет доступа")
    if data.date is not None:
        c.date = datetime.fromisoformat(data.date.replace("Z", "+00:00")).date()
    if data.amount is not None:
        c.amount = Decimal(str(data.amount))
    if data.comment is not None:
        c.comment = data.comment
    c.updated_by = current_user.id
    db.commit()
    db.refresh(c)
    log_audit(db, "UPDATE", "cash_in", str(cash_in_id), current_user.portal_id, current_user.id, None)
    return _enrich_cash_in(db, c)


@router.delete("/{cash_in_id}", status_code=204)
def delete_cash_in(
    cash_in_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    c = db.query(models.CashIn).join(models.Project).filter(
        models.CashIn.id == cash_in_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="Платёж не найден")
    if not _foreman_can_access_project(db, current_user, c.project_id):
        raise HTTPException(status_code=403, detail="Нет доступа")
    db.delete(c)
    log_audit(db, "DELETE", "cash_in", str(cash_in_id), current_user.portal_id, current_user.id, None)
    db.commit()
    return None
