"""Заглушки для эндпоинтов, которые фронт вызывает при VITE_MOCK=false. Возвращают пустые/дефолтные данные."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app import models

router = APIRouter(tags=["stubs"])


def _default_subscription(user_id: int) -> dict:
    now = datetime.utcnow()
    end = now + timedelta(days=365)
    return {
        "id": 1,
        "userId": user_id,
        "status": "active",
        "plan": None,
        "planTier": "business",
        "planInterval": "yearly",
        "currentPeriodStart": now.isoformat() + "Z",
        "currentPeriodEnd": end.isoformat() + "Z",
        "trialEndsAt": None,
        "cancelledAt": None,
        "blockedAt": None,
        "blockedReason": None,
        "previousStatus": None,
        "createdAt": now.isoformat() + "Z",
        "updatedAt": now.isoformat() + "Z",
    }


# --- Billing (чтобы SubscriptionContext не падал) ---
@router.get("/billing/subscription")
def get_subscription_stub(
    current_user: models.User = Depends(get_current_user),
):
    return _default_subscription(current_user.id)


@router.get("/billing/portal-subscription")
def get_portal_subscription_stub(
    current_user: models.User = Depends(get_current_user),
):
    return _default_subscription(current_user.id)


@router.get("/billing/invoices")
def get_invoices_stub(
    current_user: models.User = Depends(get_current_user),
):
    return []


@router.get("/billing/logs")
def get_logs_stub(
    current_user: models.User = Depends(get_current_user),
):
    return []


# --- Organizations / Counterparties / Documents (пустые списки) ---
@router.get("/organizations")
def get_organizations_stub(
    current_user: models.User = Depends(get_current_user),
):
    return []


@router.get("/counterparties")
def get_counterparties_stub(
    current_user: models.User = Depends(get_current_user),
):
    return []


@router.get("/documents")
def get_documents_stub(
    current_user: models.User = Depends(get_current_user),
):
    return []
