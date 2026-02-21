"""Audit log API. Logging is done via services.audit in other routers."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("")
def list_audit_logs(
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Return audit logs for current portal (optional endpoint for future UI)."""
    if not current_user.portal_id:
        return []
    logs = (
        db.query(models.AuditLog)
        .filter(models.AuditLog.portal_id == current_user.portal_id)
        .order_by(models.AuditLog.created_at.desc())
        .limit(100)
        .all()
    )
    return [
        {
            "id": l.id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "diff_json": l.diff_json,
            "user_id": l.user_id,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in logs
    ]
