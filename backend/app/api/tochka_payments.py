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
async def create_payment(req: CreatePaymentRequest, user=Depends(require_admin)):
    """Создать платёжную ссылку для оплаты подписки."""
    if req.plan_tier not in PLAN_PRICES:
        raise HTTPException(400, f"Неизвестный тариф: {req.plan_tier}")
    if req.plan_interval not in ("monthly", "yearly"):
        raise HTTPException(400, f"Неизвестный интервал: {req.plan_interval}")

    expected_amount = PLAN_PRICES[req.plan_tier][req.plan_interval]
    if abs(req.amount - expected_amount) > 1:
        raise HTTPException(400, f"Некорректная сумма. Ожидается {expected_amount} ₽")

    purpose = req.purpose or f"Подписка ТОРАТАУ — {req.plan_tier} ({req.plan_interval})"
    payment_link_id = f"sub_{user.id}_{req.plan_tier}_{req.plan_interval}_{int(datetime.utcnow().timestamp())}"

    try:
        result = await create_payment_link(
            amount=expected_amount,
            purpose=purpose,
            payment_link_id=payment_link_id,
            payment_modes=["card", "sbp"],
        )

        return CreatePaymentResponse(
            payment_url=result.get("paymentUrl", ""),
            payment_id=result.get("paymentLinkId", payment_link_id),
            amount=expected_amount,
            status="pending",
        )
    except TochkaPaymentError as e:
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
async def tochka_webhook(request: Request):
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
    payment_data = data.get("data", {})
    payment_id = payment_data.get("paymentLinkId", "")
    operation_id = payment_data.get("operationId", "")
    status = payment_data.get("status", "")

    logger.info(
        "Tochka webhook: event=%s, payment_id=%s, operation_id=%s, status=%s",
        event_type, payment_id, operation_id, status,
    )

    if event_type == "acquiringInternetPayment" and status == "EXECUTED":
        # Платёж успешен — здесь нужно обновить статус подписки
        # payment_id формат: sub_{userId}_{planTier}_{planInterval}_{timestamp}
        parts = payment_id.split("_")
        if len(parts) >= 4 and parts[0] == "sub":
            user_id = int(parts[1])
            plan_tier = parts[2]
            plan_interval = parts[3]
            logger.info(
                "Tochka: payment successful for user=%d, tier=%s, interval=%s",
                user_id, plan_tier, plan_interval,
            )
            # TODO: обновить подписку пользователя в БД
            # await activate_subscription(user_id, plan_tier, plan_interval)

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
        retailers = await get_retailers()
        result["retailers"] = retailers
        result["connected"] = True
        result["message"] = "Подключение к Точка Банку установлено"
    except TochkaPaymentError as e:
        result["message"] = f"Ошибка получения торговых точек: {e}"

    return result
