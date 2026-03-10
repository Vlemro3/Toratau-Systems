"""Заглушки для эндпоинтов, которые фронт вызывает при VITE_MOCK=false. Возвращают пустые/дефолтные данные."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user, require_admin
from app import models
from pydantic import BaseModel
from typing import Any

router = APIRouter(tags=["stubs"])

# --- In-memory хранилища (для режима без полного бэкенда) ---
_counterparties_store: list[dict[str, Any]] = []
_counterparty_next_id = 1


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
