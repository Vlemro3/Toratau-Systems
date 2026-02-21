from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.dependencies import get_current_user
from app.schemas import WorkTypeCreate, WorkTypeUpdate, WorkTypeResponse, AdjustRatesRequest
from app.services.audit import log_audit

router = APIRouter(prefix="/work-types", tags=["work-types"])


@router.get("", response_model=list[WorkTypeResponse])
def get_work_types(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.portal_id:
        return []
    rows = db.query(models.WorkType).filter(models.WorkType.portal_id == current_user.portal_id).all()
    return [WorkTypeResponse(
        id=r.id,
        name=r.name,
        unit=r.unit,
        rate=float(r.rate or 0),
        category=r.category or "",
        is_active=r.is_active,
    ) for r in rows]


@router.get("/{work_type_id}", response_model=WorkTypeResponse)
def get_work_type(
    work_type_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wt = db.query(models.WorkType).filter(
        models.WorkType.id == work_type_id,
        models.WorkType.portal_id == current_user.portal_id,
    ).first()
    if not wt:
        raise HTTPException(status_code=404, detail="Вид работ не найден")
    return WorkTypeResponse(
        id=wt.id,
        name=wt.name,
        unit=wt.unit,
        rate=float(wt.rate or 0),
        category=wt.category or "",
        is_active=wt.is_active,
    )


@router.post("", response_model=WorkTypeResponse)
def create_work_type(
    data: WorkTypeCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.portal_id:
        raise HTTPException(status_code=403, detail="Нет портала")
    wt = models.WorkType(
        portal_id=current_user.portal_id,
        name=data.name,
        unit=data.unit,
        rate=Decimal(str(data.rate)),
        category=data.category or "",
        is_active=data.is_active if data.is_active is not None else True,
    )
    db.add(wt)
    db.commit()
    db.refresh(wt)
    log_audit(db, "CREATE", "work_type", str(wt.id), current_user.portal_id, current_user.id, {"name": wt.name})
    return WorkTypeResponse(
        id=wt.id,
        name=wt.name,
        unit=wt.unit,
        rate=float(wt.rate),
        category=wt.category or "",
        is_active=wt.is_active,
    )


@router.put("/{work_type_id}", response_model=WorkTypeResponse)
def update_work_type(
    work_type_id: int,
    data: WorkTypeUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wt = db.query(models.WorkType).filter(
        models.WorkType.id == work_type_id,
        models.WorkType.portal_id == current_user.portal_id,
    ).first()
    if not wt:
        raise HTTPException(status_code=404, detail="Вид работ не найден")
    if data.name is not None:
        wt.name = data.name
    if data.unit is not None:
        wt.unit = data.unit
    if data.rate is not None:
        wt.rate = Decimal(str(data.rate))
    if data.category is not None:
        wt.category = data.category
    if data.is_active is not None:
        wt.is_active = data.is_active
    db.commit()
    db.refresh(wt)
    log_audit(db, "UPDATE", "work_type", str(work_type_id), current_user.portal_id, current_user.id, None)
    return WorkTypeResponse(
        id=wt.id,
        name=wt.name,
        unit=wt.unit,
        rate=float(wt.rate),
        category=wt.category or "",
        is_active=wt.is_active,
    )


@router.delete("/{work_type_id}", status_code=204)
def delete_work_type(
    work_type_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wt = db.query(models.WorkType).filter(
        models.WorkType.id == work_type_id,
        models.WorkType.portal_id == current_user.portal_id,
    ).first()
    if not wt:
        raise HTTPException(status_code=404, detail="Вид работ не найден")
    db.delete(wt)
    log_audit(db, "DELETE", "work_type", str(work_type_id), current_user.portal_id, current_user.id, None)
    db.commit()
    return None


@router.post("/adjust-rates", response_model=list[WorkTypeResponse])
def adjust_rates(
    data: AdjustRatesRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.portal_id:
        return []
    multiplier = 1 + (data.percentage / 100)
    rows = db.query(models.WorkType).filter(models.WorkType.portal_id == current_user.portal_id).all()
    for wt in rows:
        wt.rate = (wt.rate or 0) * Decimal(str(multiplier))
        wt.rate = wt.rate.quantize(Decimal("0.01"))
    db.commit()
    return [WorkTypeResponse(
        id=r.id,
        name=r.name,
        unit=r.unit,
        rate=float(r.rate),
        category=r.category or "",
        is_active=r.is_active,
    ) for r in rows]
