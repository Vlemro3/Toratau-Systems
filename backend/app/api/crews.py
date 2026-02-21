from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.dependencies import get_current_user
from app.schemas import CrewCreate, CrewUpdate, CrewResponse
from app.services.audit import log_audit

router = APIRouter(prefix="/crews", tags=["crews"])


@router.get("", response_model=list[CrewResponse])
def get_crews(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.portal_id:
        return []
    crews = db.query(models.Crew).filter(models.Crew.portal_id == current_user.portal_id).all()
    return [CrewResponse(
        id=c.id,
        name=c.name,
        contact=c.contact or "",
        phone=c.phone,
        notes=c.notes or "",
        is_active=c.is_active,
    ) for c in crews]


@router.get("/{crew_id}", response_model=CrewResponse)
def get_crew(
    crew_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    crew = db.query(models.Crew).filter(
        models.Crew.id == crew_id,
        models.Crew.portal_id == current_user.portal_id,
    ).first()
    if not crew:
        raise HTTPException(status_code=404, detail="Бригада не найдена")
    return CrewResponse(
        id=crew.id,
        name=crew.name,
        contact=crew.contact or "",
        phone=crew.phone,
        notes=crew.notes or "",
        is_active=crew.is_active,
    )


@router.post("", response_model=CrewResponse)
def create_crew(
    data: CrewCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.portal_id:
        raise HTTPException(status_code=403, detail="Нет портала")
    crew = models.Crew(
        portal_id=current_user.portal_id,
        name=data.name,
        contact=data.contact or "",
        phone=data.phone,
        notes=data.notes or "",
        is_active=data.is_active if data.is_active is not None else True,
    )
    db.add(crew)
    db.commit()
    db.refresh(crew)
    log_audit(db, "CREATE", "crew", str(crew.id), current_user.portal_id, current_user.id, {"name": crew.name})
    return CrewResponse(
        id=crew.id,
        name=crew.name,
        contact=crew.contact or "",
        phone=crew.phone,
        notes=crew.notes or "",
        is_active=crew.is_active,
    )


@router.put("/{crew_id}", response_model=CrewResponse)
def update_crew(
    crew_id: int,
    data: CrewUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    crew = db.query(models.Crew).filter(
        models.Crew.id == crew_id,
        models.Crew.portal_id == current_user.portal_id,
    ).first()
    if not crew:
        raise HTTPException(status_code=404, detail="Бригада не найдена")
    if data.name is not None:
        crew.name = data.name
    if data.contact is not None:
        crew.contact = data.contact
    if data.phone is not None:
        crew.phone = data.phone
    if data.notes is not None:
        crew.notes = data.notes
    if data.is_active is not None:
        crew.is_active = data.is_active
    db.commit()
    db.refresh(crew)
    log_audit(db, "UPDATE", "crew", str(crew_id), current_user.portal_id, current_user.id, None)
    return CrewResponse(
        id=crew.id,
        name=crew.name,
        contact=crew.contact or "",
        phone=crew.phone,
        notes=crew.notes or "",
        is_active=crew.is_active,
    )


@router.delete("/{crew_id}", status_code=204)
def delete_crew(
    crew_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    crew = db.query(models.Crew).filter(
        models.Crew.id == crew_id,
        models.Crew.portal_id == current_user.portal_id,
    ).first()
    if not crew:
        raise HTTPException(status_code=404, detail="Бригада не найдена")
    db.delete(crew)
    log_audit(db, "DELETE", "crew", str(crew_id), current_user.portal_id, current_user.id, None)
    db.commit()
    return None
