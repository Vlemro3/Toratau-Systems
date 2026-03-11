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
            raw = resp.json()
            return raw.get("Data", raw)
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

async def get_retailers(customer_code: Optional[str] = None) -> dict:
    """
    Получить список торговых точек (GET /acquiring/v1.0/retailers).
    Статус REG + isActive: true = эквайринг подключён.
    """
    url = f"{TOCHKA_BASE}/acquiring/v1.0/retailers"
    params: dict = {}
    if customer_code:
        params["customerCode"] = customer_code

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, params=params, headers=_headers())
            resp.raise_for_status()
            raw = resp.json()
            return raw.get("Data", raw)
        except httpx.HTTPStatusError as e:
            body = e.response.text
            logger.error("Tochka get_retailers error %s: %s", e.response.status_code, body)
            raise TochkaPaymentError(f"Ошибка Tochka API ({e.response.status_code}): {body}")
        except httpx.RequestError as e:
            raise TochkaPaymentError(f"Ошибка соединения: {str(e)}")


async def resolve_merchant_id() -> str:
    """
    Определить merchantId: из настроек или автоматически через Get Retailers API.
    Ищем retailer с status == 'REG' и isActive == True.
    """
    if settings.tochka_merchant_id:
        return settings.tochka_merchant_id

    customer_code = await resolve_customer_code()
    retailers_data = await get_retailers(customer_code)
    retailers = []
    if isinstance(retailers_data, list):
        retailers = retailers_data
    elif isinstance(retailers_data, dict):
        retailers = retailers_data.get("retailers", retailers_data.get("Retailers", []))
        if not retailers and "merchantId" in retailers_data:
            retailers = [retailers_data]

    for r in retailers:
        status = r.get("status", r.get("Status", ""))
        is_active = r.get("isActive", r.get("IsActive", False))
        mid = r.get("merchantId", r.get("MerchantId", ""))
        if status == "REG" and is_active and mid:
            logger.info("Tochka: resolved merchantId=%s (REG, active)", mid)
            return mid

    # Если REG не нашёлся, берём первый с merchantId
    for r in retailers:
        mid = r.get("merchantId", r.get("MerchantId", ""))
        if mid:
            logger.warning("Tochka: active retailer not found, using first: %s", mid)
            return mid

    logger.error("Tochka retailers response: %s", retailers_data)
    raise TochkaPaymentError(
        "Не удалось определить merchantId из Get Retailers. "
        "Убедитесь что интернет-эквайринг подключён (status=REG, isActive=true)."
    )


# ──────────────────────────────────────────────────
# Payments — создание и получение платежей
# ──────────────────────────────────────────────────

async def create_payment_link(
    amount: float,
    purpose: str,
    payment_link_id: Optional[str] = None,
    ttl: int = 10080,
    payment_modes: Optional[list[str]] = None,
    redirect_url: Optional[str] = None,
    fail_redirect_url: Optional[str] = None,
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

    inner: dict = {
        "customerCode": customer_code,
        "amount": round(amount, 2),
        "purpose": purpose,
        "redirectUrl": redirect_url or settings.tochka_redirect_url,
        "failRedirectUrl": fail_redirect_url or settings.tochka_fail_redirect_url,
        "paymentMode": payment_modes or ["sbp", "tinkoff", "card"],
        "ttl": ttl,
    }

    if settings.tochka_merchant_id:
        inner["merchantId"] = settings.tochka_merchant_id

    if payment_link_id:
        inner["paymentLinkId"] = payment_link_id

    payload = {"Data": inner}

    logger.info("Tochka: creating payment link, amount=%.2f, purpose=%s", amount, purpose)

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(url, json=payload, headers=_headers())
            resp.raise_for_status()
            raw = resp.json()
            data = raw.get("Data", raw)
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

    Точка возвращает: {"Operation": [{...}]}  — массив из одного элемента.
    """
    customer_code = await resolve_customer_code()
    url = f"{TOCHKA_BASE}/acquiring/v1.0/payments/{operation_id}"
    params = {"customerCode": customer_code}

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, params=params, headers=_headers())
            resp.raise_for_status()
            raw = resp.json()
            logger.warning("Tochka get_payment_info raw keys: %s, status_code=%d",
                           list(raw.keys()) if isinstance(raw, dict) else type(raw).__name__,
                           resp.status_code)

            # Точка оборачивает ответ в {"Data": {"Operation": [{...}]}}
            # Снимаем обёртку Data, затем Operation
            data = raw.get("Data", raw)
            if isinstance(data, dict):
                operations = data.get("Operation", data.get("operations", []))
            else:
                operations = data

            if isinstance(operations, list) and operations:
                result = operations[0]
                logger.warning("Tochka get_payment_info parsed: status=%s, operationId=%s",
                               result.get("status", "?"), result.get("operationId", "?"))
                return result
            # Если Data сам содержит operationId (без Operation обёртки)
            if isinstance(data, dict) and "operationId" in data:
                return data
            if isinstance(raw, dict) and "operationId" in raw:
                return raw
            logger.warning("Tochka get_payment_info: unexpected format, returning raw: %s", str(raw)[:500])
            return raw
        except httpx.HTTPStatusError as e:
            body = e.response.text
            logger.warning("Tochka get_payment_info HTTP error %d: %s", e.response.status_code, body[:300])
            raise TochkaPaymentError(f"Ошибка получения операции ({e.response.status_code}): {body}")
        except httpx.RequestError as e:
            raise TochkaPaymentError(f"Ошибка соединения: {str(e)}")


async def get_payment_list(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
) -> list:
    """
    Получить список операций (GET /acquiring/v1.0/payments).
    Рекомендуется указывать fromDate и toDate (формат YYYY-MM-DD).
    Всегда возвращает list[dict].
    """
    customer_code = await resolve_customer_code()
    url = f"{TOCHKA_BASE}/acquiring/v1.0/payments"
    params: dict = {"customerCode": customer_code}
    if from_date:
        params["fromDate"] = from_date
    if to_date:
        params["toDate"] = to_date

    logger.warning("Tochka get_payment_list: params=%s", params)

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, params=params, headers=_headers())
            resp.raise_for_status()
            raw = resp.json()
            logger.warning("Tochka get_payment_list raw response keys: %s", list(raw.keys()) if isinstance(raw, dict) else type(raw).__name__)

            # Точка оборачивает: {"Data": {"Operation": [...]}, "Links": ..., "Meta": ...}
            # Снимаем Data, затем Operation
            result = []
            if isinstance(raw, list):
                result = raw
            elif isinstance(raw, dict):
                data = raw.get("Data", raw)
                if isinstance(data, dict):
                    # Внутри Data ищем Operation или список
                    for key in ("Operation", "operations", "payments", "Payments"):
                        val = data.get(key)
                        if isinstance(val, list):
                            result = val
                            break
                        elif isinstance(val, dict) and "operationId" in val:
                            result = [val]
                            break
                    if not result and "operationId" in data:
                        result = [data]
                elif isinstance(data, list):
                    result = data
                if not result and "operationId" in raw:
                    result = [raw]

            logger.warning("Tochka get_payment_list: found %d operations", len(result))
            if result:
                logger.warning("Tochka get_payment_list: first operation keys: %s", list(result[0].keys()) if isinstance(result[0], dict) else type(result[0]).__name__)
            return result
        except httpx.HTTPStatusError as e:
            body = e.response.text
            raise TochkaPaymentError(f"Ошибка получения списка операций ({e.response.status_code}): {body}")
        except httpx.RequestError as e:
            raise TochkaPaymentError(f"Ошибка соединения: {str(e)}")


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """Legacy stub — не используется, т.к. тело webhook это JWT."""
    return True


# ──────────────────────────────────────────────────
# Webhook JWT decoding
# ──────────────────────────────────────────────────

TOCHKA_PUBLIC_KEY_URL = "https://enter.tochka.com/doc/openapi/static/keys/public"

_cached_public_key: Optional[str] = None


async def _fetch_tochka_public_key() -> str:
    """Скачать публичный RSA-ключ Точки для верификации JWT."""
    global _cached_public_key
    if _cached_public_key:
        return _cached_public_key
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(TOCHKA_PUBLIC_KEY_URL)
        resp.raise_for_status()
        _cached_public_key = resp.text.strip()
        return _cached_public_key


def decode_webhook_jwt(token: str, verify: bool = True) -> dict:
    """
    Декодировать JWT-тело webhook от Точки.
    Тело webhook — строка JWT (RS256), подписанная публичным ключом Точки.
    Возвращает decoded payload (dict).
    """
    from jose import jwt as jose_jwt, JWTError

    if not verify:
        # Декодируем без проверки подписи (для отладки)
        return jose_jwt.get_unverified_claims(token)

    try:
        # Для RS256 нужен публичный ключ в JWK формате
        import json
        key_data = _cached_public_key
        if not key_data:
            # fallback: декодируем без проверки
            logger.warning("Tochka public key not cached, decoding without verification")
            return jose_jwt.get_unverified_claims(token)
        # Ключ может быть JWK JSON
        try:
            key = json.loads(key_data)
        except json.JSONDecodeError:
            key = key_data
        return jose_jwt.decode(token, key, algorithms=["RS256"], options={"verify_aud": False})
    except JWTError as e:
        logger.warning("JWT verification failed, decoding without verification: %s", e)
        return jose_jwt.get_unverified_claims(token)


# ──────────────────────────────────────────────────
# Webhook management (register / list / delete)
# ──────────────────────────────────────────────────

async def get_webhooks() -> list[dict]:
    """Получить список вебхуков (GET /webhook/v1.0/)."""
    customer_code = await resolve_customer_code()
    url = f"{TOCHKA_BASE}/webhook/v1.0/{customer_code}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, headers=_headers())
            resp.raise_for_status()
            raw = resp.json()
            return raw.get("Data", raw) if isinstance(raw.get("Data"), list) else [raw.get("Data", raw)]
        except httpx.HTTPStatusError as e:
            raise TochkaPaymentError(f"Ошибка получения вебхуков ({e.response.status_code}): {e.response.text}")
        except httpx.RequestError as e:
            raise TochkaPaymentError(f"Ошибка соединения: {str(e)}")


async def register_webhook(webhook_url: str, event_type: str = "acquiringInternetPayment") -> dict:
    """
    Зарегистрировать webhook (PUT /webhook/v1.0/{customerCode}).
    При создании Точка отправит тестовый webhook — URL должен ответить HTTP 200.
    Формат: {"url": "...", "webhooks_list": [{"webhookType": "..."}]}
    """
    customer_code = await resolve_customer_code()
    url = f"{TOCHKA_BASE}/webhook/v1.0/{customer_code}"
    payload = {
        "url": webhook_url,
        "webhooks_list": [
            {"webhookType": event_type}
        ],
    }
    logger.warning("Registering Tochka webhook: url=%s, event=%s", webhook_url, event_type)
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.put(url, json=payload, headers=_headers())
            resp.raise_for_status()
            raw = resp.json()
            logger.warning("Tochka webhook registered: %s", raw)
            return raw
        except httpx.HTTPStatusError as e:
            body = e.response.text
            logger.error("Tochka register webhook error %s: %s", e.response.status_code, body)
            raise TochkaPaymentError(f"Ошибка регистрации вебхука ({e.response.status_code}): {body}")
        except httpx.RequestError as e:
            raise TochkaPaymentError(f"Ошибка соединения: {str(e)}")


async def delete_webhook(webhook_id: str) -> dict:
    """Удалить webhook (DELETE /webhook/v1.0/{customerCode})."""
    customer_code = await resolve_customer_code()
    url = f"{TOCHKA_BASE}/webhook/v1.0/{customer_code}"
    payload = {"Data": {"webhookId": webhook_id}}
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.request("DELETE", url, json=payload, headers=_headers())
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            raise TochkaPaymentError(f"Ошибка удаления вебхука ({e.response.status_code}): {e.response.text}")
        except httpx.RequestError as e:
            raise TochkaPaymentError(f"Ошибка соединения: {str(e)}")
