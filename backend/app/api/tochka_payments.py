"""
API роутер для интеграции с банком Точка — Интернет-эквайринг.

Endpoints:
- POST /tochka/create-payment — создать платёжную ссылку для оплаты подписки
- GET  /tochka/payment-status/{operation_id} — получить информацию по операции
- GET  /tochka/payments — список операций (с фильтром по датам)
- POST /tochka/webhook — webhook от Точки при изменении статуса платежа
- GET  /tochka/check-connection — проверить подключение к API Точка
"""
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Depends, Query
from pydantic import BaseModel

from app.dependencies import get_current_user, require_admin
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.tochka_payment import (
    create_payment_link,
    get_payment_info,
    get_payment_list,
    get_retailers,
    get_customers,
    verify_webhook_signature,
    TochkaPaymentError,
)
from app.config import settings
from app import models

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tochka", tags=["Tochka Payments"])


class CreatePaymentRequest(BaseModel):
    plan_tier: str  # start, business, premium, unlim
    plan_interval: str  # monthly, yearly
    amount: float
    purpose: Optional[str] = None


class CreatePaymentResponse(BaseModel):
    payment_url: str
    payment_id: str
    amount: float
    status: str


# Тарифы (дублируем из фронтенда для валидации на бэке)
PLAN_PRICES = {
    "start": {"monthly": 1_500, "yearly": 16_200},
    "business": {"monthly": 3_000, "yearly": 32_400},
    "premium": {"monthly": 5_000, "yearly": 54_000},
    "unlim": {"monthly": 10_000, "yearly": 108_000},
}


@router.post("/create-payment", response_model=CreatePaymentResponse)
async def create_payment(
    req: CreatePaymentRequest,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Создать платёжную ссылку для оплаты подписки."""
    if req.plan_tier not in PLAN_PRICES:
        raise HTTPException(400, f"Неизвестный тариф: {req.plan_tier}")
    if req.plan_interval not in ("monthly", "yearly"):
        raise HTTPException(400, f"Неизвестный интервал: {req.plan_interval}")

    expected_amount = PLAN_PRICES[req.plan_tier][req.plan_interval]
    if abs(req.amount - expected_amount) > 1:
        raise HTTPException(400, f"Некорректная сумма. Ожидается {expected_amount} ₽")

    portal_id = user.portal_id or 0
    now = datetime.utcnow()

    from app.api.billing import _get_or_create_subscription, _add_log
    sub = _get_or_create_subscription(db, user)

    invoice = models.BillingInvoice(
        subscription_id=sub.id,
        portal_id=portal_id,
        user_id=user.id,
        plan_tier=req.plan_tier,
        plan_interval=req.plan_interval,
        amount=expected_amount,
        status="pending",
        created_at=now,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    purpose = req.purpose or f"Подписка ТОРАТАУ — {req.plan_tier} ({req.plan_interval})"

    try:
        result = await create_payment_link(
            amount=expected_amount,
            purpose=purpose,
            payment_link_id=str(invoice.id),
            payment_modes=["sbp", "tinkoff", "card"],
        )

        invoice.tochka_operation_id = result.get("operationId", "")
        invoice.tochka_payment_link = result.get("paymentLink", "")
        invoice.tochka_payment_link_id = result.get("paymentLinkId", "")

        sub.previous_status = sub.status
        sub.status = "pending_payment"
        sub.plan_tier = req.plan_tier
        sub.plan_interval = req.plan_interval
        sub.updated_at = now
        db.commit()

        _add_log(
            db, portal_id,
            action=f"Создана ссылка на оплату ({req.plan_tier}, {req.plan_interval})",
            status="pending",
            amount=expected_amount,
            details=f"Счёт #{invoice.id}, operation={invoice.tochka_operation_id}",
            invoice_id=invoice.id,
        )

        return CreatePaymentResponse(
            payment_url=result.get("paymentLink", result.get("paymentUrl", "")),
            payment_id=result.get("operationId", result.get("paymentLinkId", str(invoice.id))),
            amount=expected_amount,
            status=result.get("status", "pending"),
        )
    except TochkaPaymentError as e:
        invoice.status = "failed"
        db.commit()
        logger.error("Tochka create payment error: %s", str(e))
        raise HTTPException(502, str(e))


@router.get("/payment-status/{operation_id}")
async def check_payment_status(operation_id: str, user=Depends(get_current_user)):
    """Получить информацию по операции (operationId из webhook или списка)."""
    try:
        result = await get_payment_info(operation_id)
        return result
    except TochkaPaymentError as e:
        raise HTTPException(502, str(e))


@router.get("/payments")
async def list_payments(
    from_date: Optional[str] = Query(None, description="Дата начала (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="Дата конца (YYYY-MM-DD)"),
    user=Depends(require_admin),
):
    """Получить список платёжных операций (рекомендуется указывать даты)."""
    try:
        result = await get_payment_list(from_date=from_date, to_date=to_date)
        return result
    except TochkaPaymentError as e:
        raise HTTPException(502, str(e))


@router.post("/webhook")
async def tochka_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Webhook от Точка Банка при изменении статуса платежа.
    Событие: acquiringInternetPayment
    """
    body = await request.body()
    signature = request.headers.get("X-Signature", "")

    if not verify_webhook_signature(body, signature):
        raise HTTPException(403, "Invalid signature")

    try:
        data = await request.json()
    except Exception:
        raise HTTPException(400, "Invalid JSON")

    event_type = data.get("eventType", "")
    payment_data = data.get("data", data.get("Data", {}))
    payment_id = payment_data.get("paymentLinkId", "")
    operation_id = payment_data.get("operationId", "")
    status = payment_data.get("status", "")

    logger.info(
        "Tochka webhook: event=%s, payment_id=%s, operation_id=%s, status=%s",
        event_type, payment_id, operation_id, status,
    )

    if event_type == "acquiringInternetPayment" and status == "EXECUTED":
        from app.api.billing import activate_subscription_by_tochka
        activated = activate_subscription_by_tochka(db, operation_id, payment_id)
        if activated:
            logger.info("Tochka webhook: subscription activated for operation=%s", operation_id)
        else:
            logger.warning("Tochka webhook: could not activate subscription for operation=%s", operation_id)

    return {"status": "ok"}


@router.get("/check-connection")
async def check_connection(user=Depends(require_admin)):
    """Проверить подключение к API Точка Банка: JWT-токен + статус эквайринга."""
    if not settings.tochka_jwt_token:
        return {
            "connected": False,
            "message": "JWT-токен Точка не настроен. Укажите TOCHKA_JWT_TOKEN в .env",
        }

    result: dict = {"connected": False, "message": ""}

    # 1. Проверяем список клиентов (customerCode)
    try:
        customers = await get_customers()
        result["customers"] = customers
    except TochkaPaymentError as e:
        result["message"] = f"Ошибка получения клиентов: {e}"
        return result

    # 2. Проверяем статус эквайринга (retailers)
    try:
        from app.services.tochka_payment import resolve_customer_code
        customer_code = await resolve_customer_code()
        retailers = await get_retailers(customer_code)
        result["retailers"] = retailers
        result["connected"] = True
        result["message"] = "Подключение к Точка Банку установлено"
    except TochkaPaymentError as e:
        result["message"] = f"Ошибка получения торговых точек: {e}"

    return result
