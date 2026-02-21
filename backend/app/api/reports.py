from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.dependencies import get_current_user
from app.services.metrics import get_project_report

router = APIRouter(prefix="/reports", tags=["reports"])


def _foreman_can_access_project(db: Session, user: models.User, project_id: int) -> bool:
    if user.role != "foreman":
        return True
    return db.query(models.UserProject).filter(
        models.UserProject.user_id == user.id,
        models.UserProject.project_id == project_id,
    ).first() is not None


@router.get("/project/{project_id}")
def get_project_report_endpoint(
    project_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.portal_id:
        raise HTTPException(status_code=404, detail="Объект не найден")
    if not _foreman_can_access_project(db, current_user, project_id):
        raise HTTPException(status_code=404, detail="Объект не найден")
    report = get_project_report(db, project_id, current_user.portal_id)
    if not report:
        raise HTTPException(status_code=404, detail="Объект не найден")
    return report
