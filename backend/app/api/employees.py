from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth import get_password_hash
from app.dependencies import get_current_user, user_to_response, require_admin
from app.schemas import EmployeeCreate, EmployeeResponse
from app.services.audit import log_audit

router = APIRouter(prefix="/employees", tags=["employees"])


def _enrich_employee(db: Session, user: models.User) -> EmployeeResponse:
    portal = db.query(models.Portal).filter(models.Portal.id == user.portal_id).first()
    portal_slug = portal.slug if portal else ""
    project_ids = None
    if user.role == "foreman":
        links = db.query(models.UserProject).filter(models.UserProject.user_id == user.id).all()
        project_ids = [l.project_id for l in links]
    created_at = user.created_at.isoformat() if getattr(user, "created_at", None) else ""
    return EmployeeResponse(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        portal_id=portal_slug,
        created_at=created_at,
        project_ids=project_ids,
    )


@router.get("", response_model=list[EmployeeResponse])
def get_employees(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.portal_id:
        return []
    users = db.query(models.User).filter(
        models.User.portal_id == current_user.portal_id,
        models.User.role != "superAdmin",
    ).all()
    return [_enrich_employee(db, u) for u in users]


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(
        models.User.id == employee_id,
        models.User.portal_id == current_user.portal_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    return _enrich_employee(db, user)


@router.post("", response_model=EmployeeResponse)
def create_employee(
    data: EmployeeCreate,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if not current_user.portal_id:
        raise HTTPException(status_code=403, detail="Нет портала")
    if db.query(models.User).filter(
        models.User.portal_id == current_user.portal_id,
        models.User.username == data.username,
    ).first():
        raise HTTPException(status_code=400, detail="Логин уже занят")
    user = models.User(
        username=data.username,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        role=data.role,
        is_active=True,
        portal_id=current_user.portal_id,
    )
    db.add(user)
    db.flush()
    if data.role == "foreman" and data.project_ids:
        for pid in data.project_ids:
            db.add(models.UserProject(user_id=user.id, project_id=pid))
    db.commit()
    db.refresh(user)
    log_audit(db, "CREATE", "user", str(user.id), current_user.portal_id, current_user.id, {"username": user.username})
    return _enrich_employee(db, user)


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    data: EmployeeCreate,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(
        models.User.id == employee_id,
        models.User.portal_id == current_user.portal_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    if data.username and data.username != user.username:
        if db.query(models.User).filter(
            models.User.portal_id == current_user.portal_id,
            models.User.username == data.username,
        ).first():
            raise HTTPException(status_code=400, detail="Логин уже занят")
        user.username = data.username
    if data.password:
        user.hashed_password = get_password_hash(data.password)
    user.full_name = data.full_name or user.full_name
    user.role = data.role or user.role
    if data.role == "foreman" and data.project_ids is not None:
        db.query(models.UserProject).filter(models.UserProject.user_id == user.id).delete()
        for pid in data.project_ids:
            db.add(models.UserProject(user_id=user.id, project_id=pid))
    db.commit()
    db.refresh(user)
    log_audit(db, "UPDATE", "user", str(employee_id), current_user.portal_id, current_user.id, None)
    return _enrich_employee(db, user)


@router.delete("/{employee_id}", status_code=204)
def delete_employee(
    employee_id: int,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(
        models.User.id == employee_id,
        models.User.portal_id == current_user.portal_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    db.query(models.UserProject).filter(models.UserProject.user_id == user.id).delete()
    db.delete(user)
    log_audit(db, "DELETE", "user", str(employee_id), current_user.portal_id, current_user.id, None)
    db.commit()
    return None
