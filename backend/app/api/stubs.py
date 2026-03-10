"""Заглушки для эндпоинтов, которые фронт вызывает при VITE_MOCK=false. Возвращают пустые/дефолтные данные."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user, require_admin
from app import models
from pydantic import BaseModel
from typing import Any

router = APIRouter(tags=["stubs"])

# --- In-memory хранилища (для режима без полного бэкенда) ---
_counterparties_store: list[dict[str, Any]] = []
_counterparty_next_id = 1

# Billing in-memory state (per portal_id)
_subscriptions: dict[int, dict] = {}  # portal_id -> subscription
_invoices: list[dict[str, Any]] = []
_invoice_next_id = 1
_logs: list[dict[str, Any]] = []
_log_next_id = 1

PLAN_PRICES = {
    "start": {"monthly": 1_500, "yearly": 16_200},
    "business": {"monthly": 3_000, "yearly": 32_400},
    "premium": {"monthly": 5_000, "yearly": 54_000},
    "unlim": {"monthly": 10_000, "yearly": 108_000},
}


class SubscribeRequest(BaseModel):
    planTier: str = "business"
    planInterval: str = "monthly"


class InvoiceIdRequest(BaseModel):
    invoiceId: int


def _get_or_create_subscription(user_id: int, portal_id: int) -> dict:
    if portal_id in _subscriptions:
        return _subscriptions[portal_id]
    now = datetime.utcnow()
    end = now + timedelta(days=14)
    sub = {
        "id": 1,
        "userId": user_id,
        "status": "trial",
        "plan": None,
        "planTier": None,
        "planInterval": None,
        "currentPeriodStart": now.isoformat() + "Z",
        "currentPeriodEnd": end.isoformat() + "Z",
        "trialEndsAt": end.isoformat() + "Z",
        "cancelledAt": None,
        "blockedAt": None,
        "blockedReason": None,
        "previousStatus": None,
        "createdAt": now.isoformat() + "Z",
        "updatedAt": now.isoformat() + "Z",
    }
    _subscriptions[portal_id] = sub
    return sub


# --- Billing (чтобы SubscriptionContext не падал) ---
@router.get("/billing/subscription")
def get_subscription_stub(
    current_user: models.User = Depends(get_current_user),
):
    portal_id = current_user.portal_id or 0
    return _get_or_create_subscription(current_user.id, portal_id)


@router.get("/billing/portal-subscription")
def get_portal_subscription_stub(
    current_user: models.User = Depends(get_current_user),
):
    portal_id = current_user.portal_id or 0
    return _get_or_create_subscription(current_user.id, portal_id)


@router.get("/billing/invoices")
def get_invoices_stub(
    current_user: models.User = Depends(get_current_user),
):
    portal_id = current_user.portal_id or 0
    return [inv for inv in _invoices if inv.get("portalId") == portal_id]


@router.get("/billing/logs")
def get_logs_stub(
    current_user: models.User = Depends(get_current_user),
):
    portal_id = current_user.portal_id or 0
    return [log for log in _logs if log.get("portalId") == portal_id]


@router.post("/billing/subscribe")
def subscribe_stub(
    data: SubscribeRequest,
    current_user: models.User = Depends(get_current_user),
):
    global _invoice_next_id, _log_next_id
    now = datetime.utcnow()
    portal_id = current_user.portal_id or 0
    tier = data.planTier
    interval = data.planInterval
    amount = PLAN_PRICES.get(tier, {}).get(interval, 0)
    days = 365 if interval == "yearly" else 30
    end = now + timedelta(days=days)

    sub = _get_or_create_subscription(current_user.id, portal_id)
    sub["status"] = "pending_payment"
    sub["planTier"] = tier
    sub["planInterval"] = interval
    sub["currentPeriodStart"] = now.isoformat() + "Z"
    sub["currentPeriodEnd"] = end.isoformat() + "Z"
    sub["updatedAt"] = now.isoformat() + "Z"

    invoice = {
        "id": _invoice_next_id,
        "portalId": portal_id,
        "userId": current_user.id,
        "planTier": tier,
        "planInterval": interval,
        "amount": amount,
        "status": "pending",
        "createdAt": now.isoformat() + "Z",
    }
    _invoices.append(invoice)
    _invoice_next_id += 1

    _logs.append({
        "id": _log_next_id,
        "portalId": portal_id,
        "timestamp": now.isoformat() + "Z",
        "action": f"Подписка на {tier} ({interval})",
        "status": "pending",
        "amount": amount,
        "details": f"Счёт #{invoice['id']}",
    })
    _log_next_id += 1

    return {"subscription": sub, "invoice": invoice}


@router.post("/billing/simulate-payment-success")
def simulate_payment_success_stub(
    data: InvoiceIdRequest,
    current_user: models.User = Depends(get_current_user),
):
    global _log_next_id
    now = datetime.utcnow()
    portal_id = current_user.portal_id or 0

    invoice = None
    for inv in _invoices:
        if inv["id"] == data.invoiceId:
            inv["status"] = "paid"
            invoice = inv
            break
    if not invoice:
        invoice = {"id": data.invoiceId, "portalId": portal_id, "userId": current_user.id,
                   "planTier": "business", "planInterval": "monthly", "amount": 0,
                   "status": "paid", "createdAt": now.isoformat() + "Z"}

    sub = _get_or_create_subscription(current_user.id, portal_id)
    sub["status"] = "active"
    sub["updatedAt"] = now.isoformat() + "Z"
    if invoice.get("planTier"):
        sub["planTier"] = invoice["planTier"]
    if invoice.get("planInterval"):
        sub["planInterval"] = invoice["planInterval"]
        days = 365 if invoice["planInterval"] == "yearly" else 30
        sub["currentPeriodEnd"] = (now + timedelta(days=days)).isoformat() + "Z"

    _logs.append({
        "id": _log_next_id,
        "portalId": portal_id,
        "timestamp": now.isoformat() + "Z",
        "action": "Оплата",
        "status": "paid",
        "amount": invoice.get("amount", 0),
        "details": f"Счёт #{invoice['id']} оплачен",
    })
    _log_next_id += 1

    return {"subscription": sub, "invoice": invoice}


@router.post("/billing/simulate-payment-fail")
def simulate_payment_fail_stub(
    data: InvoiceIdRequest,
    current_user: models.User = Depends(get_current_user),
):
    global _log_next_id
    now = datetime.utcnow()
    portal_id = current_user.portal_id or 0

    invoice = None
    for inv in _invoices:
        if inv["id"] == data.invoiceId:
            inv["status"] = "failed"
            invoice = inv
            break
    if not invoice:
        invoice = {"id": data.invoiceId, "portalId": portal_id, "userId": current_user.id,
                   "planTier": "business", "planInterval": "monthly", "amount": 0,
                   "status": "failed", "createdAt": now.isoformat() + "Z"}

    sub = _get_or_create_subscription(current_user.id, portal_id)
    sub["updatedAt"] = now.isoformat() + "Z"

    _logs.append({
        "id": _log_next_id,
        "portalId": portal_id,
        "timestamp": now.isoformat() + "Z",
        "action": "Ошибка оплаты",
        "status": "failed",
        "amount": invoice.get("amount", 0),
        "details": f"Счёт #{invoice['id']} отклонён",
    })
    _log_next_id += 1

    return {"subscription": sub, "invoice": invoice}


# --- Counterparties / Documents ---

def _counterparty_to_response(c: dict) -> dict:
    return {
        "id": c["id"],
        "org_type": c.get("org_type", "legal"),
        "name": c.get("name", ""),
        "comment": c.get("comment", ""),
        "inn": c.get("inn", ""),
        "kpp": c.get("kpp", ""),
        "address": c.get("address", ""),
        "ogrn": c.get("ogrn", ""),
        "ogrn_date": c.get("ogrn_date", ""),
        "director_title": c.get("director_title", ""),
        "director_name": c.get("director_name", ""),
        "chief_accountant": c.get("chief_accountant", ""),
        "phone": c.get("phone", ""),
        "email": c.get("email", ""),
        "website": c.get("website", ""),
        "edo_operator": c.get("edo_operator", "none"),
        "bank_account": c.get("bank_account", ""),
        "personal_account": c.get("personal_account", ""),
        "bik": c.get("bik", ""),
        "bank_name": c.get("bank_name", ""),
        "corr_account": c.get("corr_account", ""),
        "bank_address": c.get("bank_address", ""),
        "receiver_type": c.get("receiver_type", "buyer"),
        "receiver_title": c.get("receiver_title", ""),
        "receiver_name": c.get("receiver_name", ""),
        "responsible_title": c.get("responsible_title", ""),
        "responsible_name": c.get("responsible_name", ""),
        "economic_entity": c.get("economic_entity", ""),
        "created_at": c.get("created_at", datetime.utcnow().isoformat() + "Z"),
    }


class CounterpartyCreateStub(BaseModel):
    org_type: str = "legal"
    name: str = ""
    comment: str | None = None
    inn: str | None = None
    kpp: str | None = None
    address: str | None = None
    ogrn: str | None = None
    ogrn_date: str | None = None
    director_title: str | None = None
    director_name: str | None = None
    chief_accountant: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    edo_operator: str | None = None
    bank_account: str | None = None
    personal_account: str | None = None
    bik: str | None = None
    bank_name: str | None = None
    corr_account: str | None = None
    bank_address: str | None = None
    receiver_type: str | None = None
    receiver_title: str | None = None
    receiver_name: str | None = None
    responsible_title: str | None = None
    responsible_name: str | None = None
    economic_entity: str | None = None


@router.get("/counterparties")
def get_counterparties_stub(
    current_user: models.User = Depends(get_current_user),
):
    return [_counterparty_to_response(c) for c in _counterparties_store]


@router.get("/counterparties/{counterparty_id}")
def get_counterparty_stub(
    counterparty_id: int,
    current_user: models.User = Depends(get_current_user),
):
    for c in _counterparties_store:
        if c["id"] == counterparty_id:
            return _counterparty_to_response(c)
    raise HTTPException(status_code=404, detail="Контрагент не найден")


@router.post("/counterparties")
def create_counterparty_stub(
    data: CounterpartyCreateStub,
    current_user: models.User = Depends(require_admin),
):
    global _counterparty_next_id
    now = datetime.utcnow().isoformat() + "Z"
    c = {
        "id": _counterparty_next_id,
        "org_type": data.org_type,
        "name": data.name,
        "comment": data.comment or "",
        "inn": data.inn or "",
        "kpp": data.kpp or "",
        "address": data.address or "",
        "ogrn": data.ogrn or "",
        "ogrn_date": data.ogrn_date or "",
        "director_title": data.director_title or "",
        "director_name": data.director_name or "",
        "chief_accountant": data.chief_accountant or "",
        "phone": data.phone or "",
        "email": data.email or "",
        "website": data.website or "",
        "edo_operator": data.edo_operator or "none",
        "bank_account": data.bank_account or "",
        "personal_account": data.personal_account or "",
        "bik": data.bik or "",
        "bank_name": data.bank_name or "",
        "corr_account": data.corr_account or "",
        "bank_address": data.bank_address or "",
        "receiver_type": data.receiver_type or "buyer",
        "receiver_title": data.receiver_title or "",
        "receiver_name": data.receiver_name or "",
        "responsible_title": data.responsible_title or "",
        "responsible_name": data.responsible_name or "",
        "economic_entity": data.economic_entity or "",
        "created_at": now,
    }
    _counterparties_store.append(c)
    _counterparty_next_id += 1
    return _counterparty_to_response(c)


@router.put("/counterparties/{counterparty_id}")
def update_counterparty_stub(
    counterparty_id: int,
    data: CounterpartyCreateStub,
    current_user: models.User = Depends(require_admin),
):
    for c in _counterparties_store:
        if c["id"] == counterparty_id:
            c["org_type"] = data.org_type
            c["name"] = data.name
            c["comment"] = data.comment or ""
            c["inn"] = data.inn or ""
            c["kpp"] = data.kpp or ""
            c["address"] = data.address or ""
            c["ogrn"] = data.ogrn or ""
            c["ogrn_date"] = data.ogrn_date or ""
            c["director_title"] = data.director_title or ""
            c["director_name"] = data.director_name or ""
            c["chief_accountant"] = data.chief_accountant or ""
            c["phone"] = data.phone or ""
            c["email"] = data.email or ""
            c["website"] = data.website or ""
            c["edo_operator"] = data.edo_operator or "none"
            c["bank_account"] = data.bank_account or ""
            c["personal_account"] = data.personal_account or ""
            c["bik"] = data.bik or ""
            c["bank_name"] = data.bank_name or ""
            c["corr_account"] = data.corr_account or ""
            c["bank_address"] = data.bank_address or ""
            c["receiver_type"] = data.receiver_type or "buyer"
            c["receiver_title"] = data.receiver_title or ""
            c["receiver_name"] = data.receiver_name or ""
            c["responsible_title"] = data.responsible_title or ""
            c["responsible_name"] = data.responsible_name or ""
            c["economic_entity"] = data.economic_entity or ""
            return _counterparty_to_response(c)
    raise HTTPException(status_code=404, detail="Контрагент не найден")


@router.delete("/counterparties/{counterparty_id}", status_code=204)
def delete_counterparty_stub(
    counterparty_id: int,
    current_user: models.User = Depends(require_admin),
):
    global _counterparties_store
    for i, c in enumerate(_counterparties_store):
        if c["id"] == counterparty_id:
            _counterparties_store.pop(i)
            return
    raise HTTPException(status_code=404, detail="Контрагент не найден")


@router.get("/documents")
def get_documents_stub(
    current_user: models.User = Depends(get_current_user),
):
    return []
