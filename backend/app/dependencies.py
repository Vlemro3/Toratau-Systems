from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth import decode_token
from app.schemas import UserResponse

security = HTTPBearer(auto_error=False)


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> models.User | None:
    if not credentials or not credentials.credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> models.User:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Не авторизован")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Недействительный токен")
    user_id = payload.get("sub")
    role = payload.get("role")
    if not user_id:
        raise HTTPException(status_code=401, detail="Недействительный токен")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Пользователь деактивирован")
    if role == "superAdmin":
        return user
    if user.portal_id:
        portal = db.query(models.Portal).filter(models.Portal.id == user.portal_id).first()
        if portal and portal.status == "blocked":
            raise HTTPException(status_code=403, detail="Портал заблокирован")
    return user


def get_portal_id(user: models.User) -> int | None:
    return user.portal_id


def user_to_response(user: models.User, db: Session) -> UserResponse:
    from app.schemas import UserResponse
    portal_slug = None
    if user.portal_id:
        portal = db.query(models.Portal).filter(models.Portal.id == user.portal_id).first()
        if portal:
            portal_slug = portal.slug
    project_ids = None
    if user.role == "foreman":
        links = db.query(models.UserProject).filter(models.UserProject.user_id == user.id).all()
        project_ids = [l.project_id for l in links]
    return UserResponse(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        portal_id=portal_slug,
        project_ids=project_ids,
    )


def require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role not in ("admin", "superAdmin"):
        raise HTTPException(status_code=403, detail="Требуются права администратора")
    return current_user


def require_superadmin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "superAdmin":
        raise HTTPException(status_code=403, detail="Требуются права суперадмина")
    return current_user
