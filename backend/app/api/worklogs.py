from datetime import datetime, date as date_type
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.dependencies import get_current_user, user_to_response, require_admin
from app.schemas import WorkLogCreate, WorkLogUpdate, WorkLogResponse, ProjectResponse, CrewResponse, WorkTypeResponse, UserResponse
from app.services.audit import log_audit

router = APIRouter(prefix="/work-logs", tags=["work-logs"])


def _foreman_can_access_project(db: Session, user: models.User, project_id: int) -> bool:
    if user.role != "foreman":
        return True
    return db.query(models.UserProject).filter(
        models.UserProject.user_id == user.id,
        models.UserProject.project_id == project_id,
    ).first() is not None


def _enrich_work_log(db: Session, wl: models.WorkLog, portal_id: int) -> WorkLogResponse:
    project = db.query(models.Project).filter(models.Project.id == wl.project_id).first()
    crew = db.query(models.Crew).filter(models.Crew.id == wl.crew_id).first()
    work_type = db.query(models.WorkType).filter(models.WorkType.id == wl.work_type_id).first()
    creator = db.query(models.User).filter(models.User.id == wl.created_by).first()
    updated_by_user = db.query(models.User).filter(models.User.id == wl.updated_by).first() if wl.updated_by else None
    portal = db.query(models.Portal).filter(models.Portal.id == portal_id).first()
    portal_slug = portal.slug if portal else None
    return WorkLogResponse(
        id=wl.id,
        project_id=wl.project_id,
        crew_id=wl.crew_id,
        work_type_id=wl.work_type_id,
        date=wl.date.isoformat() if wl.date else "",
        volume=float(wl.volume or 0),
        comment=wl.comment or "",
        created_by=wl.created_by,
        updated_by=wl.updated_by,
        status=wl.status or "pending",
        accrued_amount=float(wl.accrued_amount or 0),
        photos=wl.photos or [],
        project=ProjectResponse.from_orm_with_portal(project, portal_slug) if project else None,
        crew=CrewResponse(id=crew.id, name=crew.name, contact=crew.contact or "", phone=crew.phone, notes=crew.notes or "", is_active=crew.is_active) if crew else None,
        work_type=WorkTypeResponse(id=work_type.id, name=work_type.name, unit=work_type.unit, rate=float(work_type.rate or 0), category=work_type.category or "", is_active=work_type.is_active) if work_type else None,
        creator=user_to_response(creator, db) if creator else None,
        updated_by_user=user_to_response(updated_by_user, db) if updated_by_user else None,
    )


@router.get("", response_model=list[WorkLogResponse])
def get_work_logs(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
    project_id: int | None = Query(None, alias="project_id"),
):
    if not current_user.portal_id:
        return []
    q = db.query(models.WorkLog).join(models.Project).filter(models.Project.portal_id == current_user.portal_id)
    if project_id is not None:
        if not _foreman_can_access_project(db, current_user, project_id):
            return []
        q = q.filter(models.WorkLog.project_id == project_id)
    elif current_user.role == "foreman":
        allowed = db.query(models.UserProject.project_id).filter(models.UserProject.user_id == current_user.id).subquery()
        q = q.filter(models.WorkLog.project_id.in_(allowed))
    logs = q.all()
    return [_enrich_work_log(db, wl, current_user.portal_id) for wl in logs]


@router.get("/{work_log_id}", response_model=WorkLogResponse)
def get_work_log(
    work_log_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wl = db.query(models.WorkLog).join(models.Project).filter(
        models.WorkLog.id == work_log_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not wl:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    if not _foreman_can_access_project(db, current_user, wl.project_id):
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return _enrich_work_log(db, wl, current_user.portal_id)


@router.post("", response_model=WorkLogResponse)
def create_work_log(
    data: WorkLogCreate,
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
        raise HTTPException(status_code=403, detail="Нет доступа к объекту")
    work_type = db.query(models.WorkType).filter(
        models.WorkType.id == data.work_type_id,
        models.WorkType.portal_id == current_user.portal_id,
    ).first()
    if not work_type:
        raise HTTPException(status_code=404, detail="Вид работ не найден")
    crew = db.query(models.Crew).filter(
        models.Crew.id == data.crew_id,
        models.Crew.portal_id == current_user.portal_id,
    ).first()
    if not crew:
        raise HTTPException(status_code=404, detail="Подрядчик не найден")
    rate_snapshot = work_type.rate or Decimal(0)
    accrued = Decimal(str(data.accrued_amount)) if data.accrued_amount is not None else (Decimal(str(data.volume)) * rate_snapshot)
    wl = models.WorkLog(
        project_id=data.project_id,
        crew_id=data.crew_id,
        work_type_id=data.work_type_id,
        date=datetime.fromisoformat(data.date.replace("Z", "+00:00")).date() if data.date else date_type.today(),
        volume=Decimal(str(data.volume)),
        comment=data.comment or "",
        rate_snapshot=rate_snapshot,
        accrued_amount=accrued,
        status="pending",
        created_by=current_user.id,
        photos=[],
    )
    db.add(wl)
    db.commit()
    db.refresh(wl)
    log_audit(db, "CREATE", "work_log", str(wl.id), current_user.portal_id, current_user.id, {"project_id": wl.project_id})
    return _enrich_work_log(db, wl, current_user.portal_id)


@router.put("/{work_log_id}", response_model=WorkLogResponse)
def update_work_log(
    work_log_id: int,
    data: WorkLogUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wl = db.query(models.WorkLog).join(models.Project).filter(
        models.WorkLog.id == work_log_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not wl:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    if not _foreman_can_access_project(db, current_user, wl.project_id):
        raise HTTPException(status_code=403, detail="Нет доступа")
    if data.date is not None:
        wl.date = datetime.fromisoformat(data.date.replace("Z", "+00:00")).date()
    if data.volume is not None:
        wl.volume = Decimal(str(data.volume))
    if data.comment is not None:
        wl.comment = data.comment
    if data.accrued_amount is not None:
        wl.accrued_amount = Decimal(str(data.accrued_amount))
    elif data.volume is not None:
        wl.accrued_amount = wl.volume * wl.rate_snapshot
    wl.updated_by = current_user.id
    db.commit()
    db.refresh(wl)
    log_audit(db, "UPDATE", "work_log", str(work_log_id), current_user.portal_id, current_user.id, None)
    return _enrich_work_log(db, wl, current_user.portal_id)


@router.delete("/{work_log_id}", status_code=204)
def delete_work_log(
    work_log_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wl = db.query(models.WorkLog).join(models.Project).filter(
        models.WorkLog.id == work_log_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not wl:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    if not _foreman_can_access_project(db, current_user, wl.project_id):
        raise HTTPException(status_code=403, detail="Нет доступа")
    db.delete(wl)
    log_audit(db, "DELETE", "work_log", str(work_log_id), current_user.portal_id, current_user.id, None)
    db.commit()
    return None


@router.post("/{work_log_id}/approve", response_model=WorkLogResponse)
def approve_work_log(
    work_log_id: int,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    wl = db.query(models.WorkLog).join(models.Project).filter(
        models.WorkLog.id == work_log_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not wl:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    wl.status = "approved"
    wl.updated_by = current_user.id
    db.commit()
    db.refresh(wl)
    log_audit(db, "APPROVE", "work_log", str(work_log_id), current_user.portal_id, current_user.id, None)
    return _enrich_work_log(db, wl, current_user.portal_id)


@router.post("/{work_log_id}/reject", response_model=WorkLogResponse)
def reject_work_log(
    work_log_id: int,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    wl = db.query(models.WorkLog).join(models.Project).filter(
        models.WorkLog.id == work_log_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not wl:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    wl.status = "rejected"
    wl.updated_by = current_user.id
    db.commit()
    db.refresh(wl)
    log_audit(db, "REJECT", "work_log", str(work_log_id), current_user.portal_id, current_user.id, None)
    return _enrich_work_log(db, wl, current_user.portal_id)


@router.post("/{work_log_id}/photos", response_model=WorkLogResponse)
def upload_work_log_photos(
    work_log_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wl = db.query(models.WorkLog).join(models.Project).filter(
        models.WorkLog.id == work_log_id,
        models.Project.portal_id == current_user.portal_id,
    ).first()
    if not wl:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return _enrich_work_log(db, wl, current_user.portal_id)
