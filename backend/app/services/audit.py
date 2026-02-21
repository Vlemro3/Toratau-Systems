from sqlalchemy.orm import Session
from app import models


def log_audit(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: str,
    portal_id: int | None = None,
    user_id: int | None = None,
    diff_json: dict | None = None,
) -> None:
    entry = models.AuditLog(
        portal_id=portal_id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        user_id=user_id,
        diff_json=diff_json,
    )
    db.add(entry)
    db.commit()
