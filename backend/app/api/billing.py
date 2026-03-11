"""
API роутер биллинга — подписки, счета, логи платежей.
Работает с реальной БД (PostgreSQL).
"""
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.dependencies import get_current_user, require_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/billing", tags=["Billing"])

PLAN_PRICES = {
    "start": {"monthly": 1_500, "yearly": 16_200},
    "business": {"monthly": 3_000, "yearly": 32_400},
    "premium": {"monthly": 5_000, "yearly": 54_000},
    "unlim": {"monthly": 10_000, "yearly": 108_000},
}

TRIAL_DAYS = 14


# ── Pydantic schemas ──

class SubscribeRequest(BaseModel):
    planTier: str = "business"
    planInterval: str = "monthly"


class InvoiceIdRequest(BaseModel):
    invoiceId: int


# ── Helpers ──

def _fmt_dt(dt) -> str | None:
    """Format datetime to ISO string with Z suffix, handling timezone-aware datetimes from PostgreSQL."""
    if dt is None:
        return None
    s = dt.isoformat()
    if s.endswith('+00:00'):
        return s[:-6] + 'Z'
    if '+' in s[10:] or s.endswith('Z'):
        return s
    return s + 'Z'

def _sub_to_dict(sub: models.Subscription) -> dict:
    return {
        "id": sub.id,
        "userId": sub.user_id,
        "status": sub.status,
        "plan": sub.plan_interval,
        "planTier": sub.plan_tier,
        "planInterval": sub.plan_interval,
        "currentPeriodStart": _fmt_dt(sub.current_period_start),
        "currentPeriodEnd": _fmt_dt(sub.current_period_end),
        "trialEndsAt": _fmt_dt(sub.trial_ends_at),
        "cancelledAt": _fmt_dt(sub.cancelled_at),
        "blockedAt": _fmt_dt(sub.blocked_at),
        "blockedReason": sub.blocked_reason,
        "previousStatus": sub.previous_status,
        "createdAt": _fmt_dt(sub.created_at),
        "updatedAt": _fmt_dt(sub.updated_at),
    }


def _invoice_to_dict(inv: models.BillingInvoice) -> dict:
    return {
        "id": inv.id,
        "subscriptionId": inv.subscription_id,
        "amount": float(inv.amount),
        "plan": inv.plan_interval,
        "planTier": inv.plan_tier,
        "status": inv.status,
        "createdAt": _fmt_dt(inv.created_at),
        "paidAt": _fmt_dt(inv.paid_at),
    }


def _log_to_dict(log: models.PaymentLog) -> dict:
    return {
        "id": log.id,
        "invoiceId": log.invoice_id,
        "action": log.action,
        "status": log.status,
        "amount": float(log.amount) if log.amount else 0,
        "timestamp": _fmt_dt(log.timestamp),
        "details": log.details or "",
    }


def _get_or_create_subscription(
    db: Session, user: models.User
) -> models.Subscription:
    portal_id = user.portal_id or 0
    sub = db.query(models.Subscription).filter(
        models.Subscription.portal_id == portal_id
    ).first()
    if sub:
        return sub

    now = datetime.utcnow()
    trial_end = now + timedelta(days=TRIAL_DAYS)
    sub = models.Subscription(
        portal_id=portal_id,
        user_id=user.id,
        status="trial",
        current_period_start=now,
        current_period_end=trial_end,
        trial_ends_at=trial_end,
        created_at=now,
        updated_at=now,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def _add_log(
    db: Session,
    portal_id: int,
    action: str,
    status: str,
    amount: float = 0,
    details: str = "",
    invoice_id: Optional[int] = None,
) -> models.PaymentLog:
    log = models.PaymentLog(
        portal_id=portal_id,
        invoice_id=invoice_id,
        action=action,
        status=status,
        amount=amount,
        details=details,
        timestamp=datetime.utcnow(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


# ── Endpoints ──

@router.get("/subscription")
def get_subscription(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = _get_or_create_subscription(db, current_user)
    return _sub_to_dict(sub)


@router.get("/portal-subscription")
def get_portal_subscription(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = _get_or_create_subscription(db, current_user)
    return _sub_to_dict(sub)


@router.get("/invoices")
def get_invoices(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    portal_id = current_user.portal_id or 0
    invoices = (
        db.query(models.BillingInvoice)
        .filter(models.BillingInvoice.portal_id == portal_id)
        .order_by(models.BillingInvoice.created_at.desc())
        .all()
    )
    return [_invoice_to_dict(inv) for inv in invoices]


@router.get("/logs")
def get_logs(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    portal_id = current_user.portal_id or 0
    logs = (
        db.query(models.PaymentLog)
        .filter(models.PaymentLog.portal_id == portal_id)
        .order_by(models.PaymentLog.timestamp.desc())
        .all()
    )
    return [_log_to_dict(log) for log in logs]


@router.post("/subscribe")
def subscribe(
    data: SubscribeRequest,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    tier = data.planTier
    interval = data.planInterval
    if tier not in PLAN_PRICES:
        raise HTTPException(400, f"Неизвестный тариф: {tier}")
    if interval not in ("monthly", "yearly"):
        raise HTTPException(400, f"Неизвестный интервал: {interval}")

    amount = PLAN_PRICES[tier][interval]
    portal_id = current_user.portal_id or 0
    now = datetime.utcnow()
    days = 365 if interval == "yearly" else 30
    end = now + timedelta(days=days)

    sub = _get_or_create_subscription(db, current_user)
    sub.previous_status = sub.status
    sub.status = "pending_payment"
    sub.plan_tier = tier
    sub.plan_interval = interval
    sub.current_period_start = now
    sub.current_period_end = end
    sub.updated_at = now

    invoice = models.BillingInvoice(
        subscription_id=sub.id,
        portal_id=portal_id,
        user_id=current_user.id,
        plan_tier=tier,
        plan_interval=interval,
        amount=amount,
        status="pending",
        created_at=now,
    )
    db.add(invoice)
    db.commit()
    db.refresh(sub)
    db.refresh(invoice)

    _add_log(
        db, portal_id,
        action=f"Подписка на {tier} ({interval})",
        status="pending",
        amount=amount,
        details=f"Счёт #{invoice.id}",
        invoice_id=invoice.id,
    )

    return {"subscription": _sub_to_dict(sub), "invoice": _invoice_to_dict(invoice)}


@router.post("/simulate-payment-success")
def simulate_payment_success(
    data: InvoiceIdRequest,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Ручная активация подписки (для тестирования или ручного подтверждения)."""
    portal_id = current_user.portal_id or 0
    now = datetime.utcnow()

    invoice = db.query(models.BillingInvoice).filter(
        models.BillingInvoice.id == data.invoiceId,
        models.BillingInvoice.portal_id == portal_id,
    ).first()
    if not invoice:
        raise HTTPException(404, "Счёт не найден")

    invoice.status = "paid"
    invoice.paid_at = now

    sub = _get_or_create_subscription(db, current_user)
    sub.status = "active"
    sub.plan_tier = invoice.plan_tier
    sub.plan_interval = invoice.plan_interval
    days = 365 if invoice.plan_interval == "yearly" else 30
    sub.current_period_start = now
    sub.current_period_end = now + timedelta(days=days)
    sub.updated_at = now

    db.commit()
    db.refresh(sub)
    db.refresh(invoice)

    _add_log(
        db, portal_id,
        action="Оплата",
        status="paid",
        amount=float(invoice.amount),
        details=f"Счёт #{invoice.id} оплачен",
        invoice_id=invoice.id,
    )

    return {"subscription": _sub_to_dict(sub), "invoice": _invoice_to_dict(invoice)}


@router.post("/simulate-payment-fail")
def simulate_payment_fail(
    data: InvoiceIdRequest,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    portal_id = current_user.portal_id or 0
    now = datetime.utcnow()

    invoice = db.query(models.BillingInvoice).filter(
        models.BillingInvoice.id == data.invoiceId,
        models.BillingInvoice.portal_id == portal_id,
    ).first()
    if not invoice:
        raise HTTPException(404, "Счёт не найден")

    invoice.status = "failed"

    sub = _get_or_create_subscription(db, current_user)
    if sub.previous_status:
        sub.status = sub.previous_status
    sub.updated_at = now

    db.commit()
    db.refresh(sub)
    db.refresh(invoice)

    _add_log(
        db, portal_id,
        action="Ошибка оплаты",
        status="failed",
        amount=float(invoice.amount),
        details=f"Счёт #{invoice.id} отклонён",
        invoice_id=invoice.id,
    )

    return {"subscription": _sub_to_dict(sub), "invoice": _invoice_to_dict(invoice)}


@router.post("/verify-payment/{invoice_id}")
async def verify_payment(
    invoice_id: int,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Проверить статус оплаты в Точке (polling fallback если webhook не дошёл).
    Запрашивает operationId у Tochka API и активирует подписку при статусе EXECUTED.
    """
    portal_id = current_user.portal_id or 0
    invoice = db.query(models.BillingInvoice).filter(
        models.BillingInvoice.id == invoice_id,
        models.BillingInvoice.portal_id == portal_id,
    ).first()
    if not invoice:
        raise HTTPException(404, "Счёт не найден")

    if invoice.status == "paid":
        sub = _get_or_create_subscription(db, current_user)
        return {"subscription": _sub_to_dict(sub), "invoice": _invoice_to_dict(invoice), "verified": True}

    operation_id = invoice.tochka_operation_id
    if not operation_id:
        raise HTTPException(400, "Нет operationId для проверки в Точке")

    from app.services.tochka_payment import get_payment_info, TochkaPaymentError
    try:
        info = await get_payment_info(operation_id)
    except TochkaPaymentError as e:
        raise HTTPException(502, f"Ошибка проверки статуса в Точке: {e}")

    tochka_status = info.get("status", "")
    logger.info("Verify payment: invoice #%d, operation=%s, tochka_status=%s", invoice_id, operation_id, tochka_status)

    if tochka_status == "EXECUTED":
        activated = activate_subscription_by_tochka(
            db, operation_id, invoice.tochka_payment_link_id or ""
        )
        if activated:
            db.refresh(invoice)
            sub = _get_or_create_subscription(db, current_user)
            return {"subscription": _sub_to_dict(sub), "invoice": _invoice_to_dict(invoice), "verified": True}

    return {
        "subscription": _sub_to_dict(_get_or_create_subscription(db, current_user)),
        "invoice": _invoice_to_dict(invoice),
        "verified": False,
        "tochkaStatus": tochka_status,
    }


def activate_subscription_by_tochka(
    db: Session,
    operation_id: str,
    payment_link_id: str,
) -> bool:
    """
    Вызывается из webhook при статусе EXECUTED.
    Находит invoice по tochka_operation_id или tochka_payment_link_id, активирует подписку.
    """
    invoice = db.query(models.BillingInvoice).filter(
        (models.BillingInvoice.tochka_operation_id == operation_id) |
        (models.BillingInvoice.tochka_payment_link_id == payment_link_id)
    ).first()

    if not invoice:
        logger.warning("Webhook: invoice not found for operation_id=%s, payment_link_id=%s", operation_id, payment_link_id)
        return False

    if invoice.status == "paid":
        logger.info("Webhook: invoice #%d already paid", invoice.id)
        return True

    now = datetime.utcnow()
    invoice.status = "paid"
    invoice.paid_at = now
    invoice.tochka_operation_id = operation_id

    sub = db.query(models.Subscription).filter(
        models.Subscription.id == invoice.subscription_id
    ).first()
    if sub:
        sub.status = "active"
        sub.plan_tier = invoice.plan_tier
        sub.plan_interval = invoice.plan_interval
        days = 365 if invoice.plan_interval == "yearly" else 30
        sub.current_period_start = now
        sub.current_period_end = now + timedelta(days=days)
        sub.updated_at = now

    _add_log(
        db, invoice.portal_id,
        action="Оплата через Точку",
        status="paid",
        amount=float(invoice.amount),
        details=f"Счёт #{invoice.id} оплачен (operation: {operation_id})",
        invoice_id=invoice.id,
    )

    db.commit()
    logger.info("Webhook: subscription activated, invoice #%d, operation=%s", invoice.id, operation_id)
    return True
