from datetime import datetime, date as date_type
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.dependencies import get_current_user, require_admin
from app.schemas import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services.audit import log_audit

router = APIRouter(prefix="/projects", tags=["projects"])


def _project_portal_slug(db: Session, project: models.Project) -> str | None:
    if not project.portal_id:
        return None
    p = db.query(models.Portal).filter(models.Portal.id == project.portal_id).first()
    return p.slug if p else None


def _foreman_can_access(db: Session, user: models.User, project_id: int) -> bool:
    if user.role != "foreman":
        return True
    link = db.query(models.UserProject).filter(
        models.UserProject.user_id == user.id,
        models.UserProject.project_id == project_id,
    ).first()
    return link is not None


def _list_projects(db: Session, user: models.User):
    q = db.query(models.Project).filter(models.Project.portal_id == user.portal_id)
    if user.role == "foreman":
        allowed = db.query(models.UserProject.project_id).filter(
            models.UserProject.user_id == user.id
        ).subquery()
        q = q.filter(models.Project.id.in_(allowed))
    return q.all()


@router.get("", response_model=list[ProjectResponse])
def get_projects(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    projects = _list_projects(db, current_user)
    return [
        ProjectResponse.from_orm_with_portal(p, _project_portal_slug(db, p))
        for p in projects
    ]


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Объект не найден")
    if not _foreman_can_access(db, current_user, project_id):
        raise HTTPException(status_code=404, detail="Нет доступа к этому объекту")
    return ProjectResponse.from_orm_with_portal(project, _project_portal_slug(db, project))


@router.post("", response_model=ProjectResponse)
def create_project(
    data: ProjectCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = models.Project(
        portal_id=current_user.portal_id,
        name=data.name,
        address=data.address or "",
        client=data.client or "",
        start_date=datetime.fromisoformat(data.start_date.replace("Z", "+00:00")).date() if data.start_date else date_type.today(),
        end_date=datetime.fromisoformat(data.end_date.replace("Z", "+00:00")).date() if data.end_date else None,
        status=data.status or "new",
        contract_amount=data.contract_amount,
        planned_cost=data.planned_cost,
        notes=data.notes or "",
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    log_audit(db, "CREATE", "project", str(project.id), current_user.portal_id, current_user.id, {"name": project.name})
    return ProjectResponse.from_orm_with_portal(project, _project_portal_slug(db, project))


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Объект не найден")
    if not _foreman_can_access(db, current_user, project_id):
        raise HTTPException(status_code=403, detail="Нет доступа")
    old = {"name": project.name, "status": project.status}
    if data.name is not None:
        project.name = data.name
    if data.address is not None:
        project.address = data.address
    if data.client is not None:
        project.client = data.client
    if data.start_date is not None:
        project.start_date = datetime.fromisoformat(data.start_date.replace("Z", "+00:00")).date()
    if data.end_date is not None:
        project.end_date = datetime.fromisoformat(data.end_date.replace("Z", "+00:00")).date() if data.end_date else None
    if data.status is not None:
        project.status = data.status
    if data.contract_amount is not None:
        project.contract_amount = data.contract_amount
    if data.planned_cost is not None:
        project.planned_cost = data.planned_cost
    if data.notes is not None:
        project.notes = data.notes
    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    log_audit(db, "UPDATE", "project", str(project_id), current_user.portal_id, current_user.id, {"old": old, "new": {"name": project.name, "status": project.status}})
    return ProjectResponse.from_orm_with_portal(project, _project_portal_slug(db, project))


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Объект не найден")
    if not _foreman_can_access(db, current_user, project_id):
        raise HTTPException(status_code=403, detail="Нет доступа")
    db.delete(project)
    log_audit(db, "DELETE", "project", str(project_id), current_user.portal_id, current_user.id, None)
    db.commit()
    return None
