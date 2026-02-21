from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.dependencies import get_current_user

router = APIRouter(prefix="/expense-categories", tags=["expense-categories"])


@router.get("", response_model=list[str])
def get_custom_expense_categories(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.portal_id:
        return []
    rows = db.query(models.CustomExpenseCategory.name).filter(
        models.CustomExpenseCategory.portal_id == current_user.portal_id,
    ).all()
    return [r[0] for r in rows]


@router.post("", response_model=list[str])
def add_custom_expense_category(
    data: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    name = (data.get("name") or "").strip()
    if not name or not current_user.portal_id:
        rows = db.query(models.CustomExpenseCategory.name).filter(
            models.CustomExpenseCategory.portal_id == current_user.portal_id,
        ).all()
        return [r[0] for r in rows]
    existing = db.query(models.CustomExpenseCategory).filter(
        models.CustomExpenseCategory.portal_id == current_user.portal_id,
        models.CustomExpenseCategory.name == name,
    ).first()
    if not existing:
        db.add(models.CustomExpenseCategory(portal_id=current_user.portal_id, name=name))
        db.commit()
    rows = db.query(models.CustomExpenseCategory.name).filter(
        models.CustomExpenseCategory.portal_id == current_user.portal_id,
    ).all()
    return [r[0] for r in rows]
