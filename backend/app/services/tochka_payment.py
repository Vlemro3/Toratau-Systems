"""
Сервис интеграции с банком Точка — Интернет-эквайринг.

Документация:
- Платёжные ссылки: https://developers.tochka.com/docs/tochka-api/opisanie-metodov/platyozhnye-ssylki
- Get Customers:    https://enter.tochka.com/uapi/open-banking/v1.0/customers
- Get Retailers:    https://enter.tochka.com/uapi/acquiring/v1.0/retailers
- Create Payment:   https://enter.tochka.com/uapi/acquiring/v1.0/payments
- Get Payments:     https://enter.tochka.com/uapi/acquiring/v1.0/payments
- Get Payment Info: https://enter.tochka.com/uapi/acquiring/v1.0/payments/{operationId}

Авторизация: JWT-токен (Bearer), генерируется в ЛК Точка → Сервисы → Интеграции и API.

Основной flow:
1. Backend создаёт платёжную ссылку через Tochka API
2. Пользователь переходит по ссылке и оплачивает (карта / СБП / T-Pay)
3. Tochka отправляет webhook acquiringInternetPayment на наш URL
4. Backend обновляет статус подписки
"""
import logging
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
        "Authorization": f"Bearer {settings.tochka_jwt_token}",
        "Content-Type": "application/json",
    }


# ──────────────────────────────────────────────────
# Customers — получение customerCode
# ──────────────────────────────────────────────────

async def get_customers() -> list[dict]:
    """
    Получить список клиентов (GET /open-banking/v1.0/customers).
    customerCode берётся из записи с customerType == "Business".
    """
    url = f"{TOCHKA_BASE}/open-banking/v1.0/customers"

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, headers=_headers())
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            body = e.response.text
            logger.error("Tochka get_customers error %s: %s", e.response.status_code, body)
            raise TochkaPaymentError(f"Ошибка получения клиентов ({e.response.status_code}): {body}")
        except httpx.RequestError as e:
            raise TochkaPaymentError(f"Ошибка соединения: {str(e)}")


async def resolve_customer_code() -> str:
    """
    Определить customerCode: из настроек или автоматически через API.
    """
    if settings.tochka_customer_code:
        return settings.tochka_customer_code

    customers = await get_customers()
    # Ищем customerType == "Business"
    data = customers if isinstance(customers, list) else customers.get("customers", customers.get("data", []))
    for c in data:
        if c.get("customerType") == "Business":
            code = c.get("customerCode", "")
            if code:
                logger.info("Tochka: resolved customerCode=%s (Business)", code)
                return code
    # Если Business не нашёлся, берём первый
    if data:
        code = data[0].get("customerCode", "")
        if code:
            logger.warning("Tochka: Business customer not found, using first: %s", code)
            return code
    raise TochkaPaymentError("Не удалось определить customerCode. Укажите TOCHKA_CUSTOMER_CODE в .env")


# ──────────────────────────────────────────────────
# Retailers — проверка подключения эквайринга
# ──────────────────────────────────────────────────

async def get_retailers() -> dict:
    """
    Получить список торговых точек (GET /acquiring/v1.0/retailers).
    Статус REG + isActive: true = эквайринг подключён.
    """
    url = f"{TOCHKA_BASE}/acquiring/v1.0/retailers"

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, headers=_headers())
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            body = e.response.text
            logger.error("Tochka get_retailers error %s: %s", e.response.status_code, body)
            raise TochkaPaymentError(f"Ошибка Tochka API ({e.response.status_code}): {body}")
        except httpx.RequestError as e:
            raise TochkaPaymentError(f"Ошибка соединения: {str(e)}")


# ──────────────────────────────────────────────────
# Payments — создание и получение платежей
# ──────────────────────────────────────────────────

async def create_payment_link(
    amount: float,
    purpose: str,
    payment_link_id: Optional[str] = None,
    ttl: int = 10080,
    payment_modes: Optional[list[str]] = None,
) -> dict:
    """
    Создаёт платёжную ссылку (POST /acquiring/v1.0/payments).

    Args:
        amount: Сумма платежа в рублях
        purpose: Назначение платежа (видно покупателю)
        payment_link_id: Уникальный ID заказа (опционально)
        ttl: Время жизни ссылки в минутах (макс 44640 = 31 день)
        payment_modes: Способы оплаты ["card", "sbp", "tinkoff"]

    Returns:
        dict с полями: paymentLinkId, paymentUrl, status
    """
    if not settings.tochka_jwt_token:
        raise TochkaPaymentError("Tochka API не настроен. Укажите TOCHKA_JWT_TOKEN в .env")

    customer_code = await resolve_customer_code()
    url = f"{TOCHKA_BASE}/acquiring/v1.0/payments"

    payload: dict = {
        "customerCode": customer_code,
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


async def get_payment_info(operation_id: str) -> dict:
    """
    Получить информацию по одной операции (GET /acquiring/v1.0/payments/{operationId}).
    operationId можно получить из webhook или из списка операций.
    """
    url = f"{TOCHKA_BASE}/acquiring/v1.0/payments/{operation_id}"

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, headers=_headers())
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            body = e.response.text
            raise TochkaPaymentError(f"Ошибка получения операции ({e.response.status_code}): {body}")
        except httpx.RequestError as e:
            raise TochkaPaymentError(f"Ошибка соединения: {str(e)}")


async def get_payment_list(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
) -> dict:
    """
    Получить список операций (GET /acquiring/v1.0/payments).
    Рекомендуется указывать fromDate и toDate (формат YYYY-MM-DD).
    """
    url = f"{TOCHKA_BASE}/acquiring/v1.0/payments"
    params: dict = {}
    if from_date:
        params["fromDate"] = from_date
    if to_date:
        params["toDate"] = to_date

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, params=params, headers=_headers())
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            body = e.response.text
            raise TochkaPaymentError(f"Ошибка получения списка операций ({e.response.status_code}): {body}")
        except httpx.RequestError as e:
            raise TochkaPaymentError(f"Ошибка соединения: {str(e)}")


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """
    Проверка подписи webhook от Точка.
    Если tochka_webhook_secret не задан — пропускаем проверку.
    """
    if not settings.tochka_webhook_secret:
        return True
    # TODO: реализовать проверку HMAC при необходимости
    return True
