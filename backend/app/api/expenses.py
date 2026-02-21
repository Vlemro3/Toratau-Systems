from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.dependencies import get_current_user, user_to_response
from app.schemas import ExpenseCreate, ExpenseUpdate, ExpenseResponse, UserResponse
from app.services.audit import log_audit

router = APIRouter(prefix="/expenses", tags=["expenses"])


def _foreman_can_access_project(db: Session, user: models.User, project_id: int) -> bool:
    if user.role != "foreman":
        return True
    return db.query(models.UserProject).filter(
        models.UserProject.user_id == user.id,
        models.UserProject.project_id == project_id,
    ).first() is not None


def _enrich_expense(db: Session, e: models.Expense) -> ExpenseResponse:
    creator = db.query(models.User).filter(models.User.id == e.created_by).first()
    updated_by_user = db.query(models.User).filter(models.User.id == e.updated_by).first() if e.updated_by else None
    return ExpenseResponse(
        id=e.id,
        project_id=e.project_id,
        date=e.date.isoformat() if e.date else "",
        amount=float(e.amount or 0),
        category=e.category or "",
        comment=e.comment or "",
        file_url=e.file_url,
        created_by=e.created_by,
        updated_by=e.updated_by,
        creator=user_to_response(creator, db) if creator else None,
        updated_by_user=user_to_response(updated_by_user, db) if updated_by_user else None,
    )


@router.get("", response_model=list[ExpenseResponse])
def get_expenses(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
    project_id: int | None = Query(None),
):
    if not current_user.portal_id:
        return []
    q = db.query(models.Expense).join(models.Project).filter(models.Project.portal_id == current_user.portal_id)
    if project_id is not None:
        if not _foreman_can_access_project(db, current_user, project_id):
            return []
        q = q.filter(models.Expense.project_id == project_id)
    elif current_user.role == "foreman":
        allowed = db.query(models.UserProject.project_id).filter(models.UserProject.user_id == current_user.id).subquery()
        q = q.filter(models.Expense.project_id.in_(allowed))
    rows = q.all()
    return [_enrich_expense(db, e) for e in rows]


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    e = db.query(models.Expense).join(models.Project).filter(
        models.Expense.id == expense_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not e:
        raise HTTPException(status_code=404, detail="Расход не найден")
    if not _foreman_can_access_project(db, current_user, e.project_id):
        raise HTTPException(status_code=404, detail="Расход не найден")
    return _enrich_expense(db, e)


@router.post("", response_model=ExpenseResponse)
def create_expense(
    data: ExpenseCreate,
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
    e = models.Expense(
        project_id=data.project_id,
        date=datetime.fromisoformat(data.date.replace("Z", "+00:00")).date() if data.date else datetime.utcnow().date(),
        amount=Decimal(str(data.amount)),
        category=data.category,
        comment=data.comment or "",
        created_by=current_user.id,
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    log_audit(db, "CREATE", "expense", str(e.id), current_user.portal_id, current_user.id, None)
    return _enrich_expense(db, e)


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    data: ExpenseUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    e = db.query(models.Expense).join(models.Project).filter(
        models.Expense.id == expense_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not e:
        raise HTTPException(status_code=404, detail="Расход не найден")
    if not _foreman_can_access_project(db, current_user, e.project_id):
        raise HTTPException(status_code=403, detail="Нет доступа")
    if data.date is not None:
        e.date = datetime.fromisoformat(data.date.replace("Z", "+00:00")).date()
    if data.amount is not None:
        e.amount = Decimal(str(data.amount))
    if data.category is not None:
        e.category = data.category
    if data.comment is not None:
        e.comment = data.comment
    e.updated_by = current_user.id
    db.commit()
    db.refresh(e)
    log_audit(db, "UPDATE", "expense", str(expense_id), current_user.portal_id, current_user.id, None)
    return _enrich_expense(db, e)


@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    e = db.query(models.Expense).join(models.Project).filter(
        models.Expense.id == expense_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not e:
        raise HTTPException(status_code=404, detail="Расход не найден")
    if not _foreman_can_access_project(db, current_user, e.project_id):
        raise HTTPException(status_code=403, detail="Нет доступа")
    db.delete(e)
    log_audit(db, "DELETE", "expense", str(expense_id), current_user.portal_id, current_user.id, None)
    db.commit()
    return None


