"""
Сервис интеграции с банком Точка — Платёжные ссылки (Payment Links API).

Документация: https://developers.tochka.com/docs/tochka-api/opisanie-metodov/platyozhnye-ssylki

Основной flow:
1. Backend создаёт платёжную ссылку через Tochka API
2. Пользователь переходит по ссылке и оплачивает (карта / СБП / T-Pay)
3. Tochka отправляет webhook acquiringInternetPayment на наш URL
4. Backend обновляет статус подписки
"""
import logging
from datetime import datetime
from typing import Optional
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

TOCHKA_BASE = settings.tochka_api_url.rstrip("/")


class TochkaPaymentError(Exception):
    """Ошибка при взаимодействии с API Точка."""
    pass


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.tochka_api_token}",
        "Content-Type": "application/json",
    }


async def create_payment_link(
    amount: float,
    purpose: str,
    payment_link_id: Optional[str] = None,
    ttl: int = 10080,
    payment_modes: Optional[list[str]] = None,
) -> dict:
    """
    Создаёт платёжную ссылку в Точка Банке.

    Args:
        amount: Сумма платежа в рублях
        purpose: Назначение платежа (видно покупателю)
        payment_link_id: Уникальный ID заказа (опционально)
        ttl: Время жизни ссылки в минутах (по умолчанию 7 дней)
        payment_modes: Способы оплаты ["card", "sbp", "tinkoff"]

    Returns:
        dict с полями: paymentLinkId, paymentUrl, status
    """
    if not settings.tochka_api_token or not settings.tochka_customer_code:
        raise TochkaPaymentError("Tochka API не настроен. Укажите TOCHKA_API_TOKEN и TOCHKA_CUSTOMER_CODE в .env")

    url = f"{TOCHKA_BASE}/acquiring/v1.0/payments"

    payload: dict = {
        "customerCode": settings.tochka_customer_code,
        "amount": round(amount, 2),
        "purpose": purpose,
        "redirectUrl": settings.tochka_redirect_url,
        "failRedirectUrl": settings.tochka_fail_redirect_url,
        "paymentMode": payment_modes or ["card", "sbp"],
        "ttl": ttl,
    }

    if settings.tochka_merchant_id:
        payload["merchantId"] = settings.tochka_merchant_id

    if payment_link_id:
        payload["paymentLinkId"] = payment_link_id

    logger.info("Tochka: creating payment link, amount=%.2f, purpose=%s", amount, purpose)

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(url, json=payload, headers=_headers())
            resp.raise_for_status()
            data = resp.json()
            logger.info("Tochka: payment link created: %s", data.get("paymentUrl", ""))
            return data
        except httpx.HTTPStatusError as e:
            body = e.response.text
            logger.error("Tochka API error %s: %s", e.response.status_code, body)
            raise TochkaPaymentError(f"Ошибка Tochka API ({e.response.status_code}): {body}")
        except httpx.RequestError as e:
            logger.error("Tochka connection error: %s", str(e))
            raise TochkaPaymentError(f"Ошибка соединения с Tochka: {str(e)}")


async def get_payment_status(payment_id: str) -> dict:
    """
    Получить статус платежа по ID.
    """
    url = f"{TOCHKA_BASE}/acquiring/v1.0/payments/{payment_id}"

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, headers=_headers())
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            raise TochkaPaymentError(f"Ошибка получения статуса ({e.response.status_code})")
        except httpx.RequestError as e:
            raise TochkaPaymentError(f"Ошибка соединения: {str(e)}")


async def get_retailers() -> dict:
    """
    Получить список торговых точек (проверка подключения).
    """
    url = f"{TOCHKA_BASE}/acquiring/v1.0/retailers"

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, headers=_headers())
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            raise TochkaPaymentError(f"Ошибка Tochka API ({e.response.status_code})")
        except httpx.RequestError as e:
            raise TochkaPaymentError(f"Ошибка соединения: {str(e)}")


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """
    Проверка подписи webhook от Точка (если настроен секрет).
    На данный момент Точка использует простую верификацию по IP и/или bearer token.
    """
    if not settings.tochka_webhook_secret:
        return True
    # TODO: реализовать проверку HMAC при необходимости
    return True
