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


_documents_store: list[dict[str, Any]] = []
_document_next_id = 1


class DocumentCreateStub(BaseModel):
    counterparty_id: int
    organization_id: int | None = None
    doc_type: str = "payment_invoice"
    number: str | None = None
    date: str | None = None
    basis: str | None = None
    items: list[dict[str, Any]] | None = None
    notes: str | None = None
    taxation: str | None = None
    investor_id: int | None = None
    construction_name: str | None = None
    construction_address: str | None = None
    object_name: str | None = None
    okdp: str | None = None
    contract_number: str | None = None
    contract_date: str | None = None
    operation_type: str | None = None
    estimated_cost: float | None = None
    period_from: str | None = None
    period_to: str | None = None
    print_vat_amounts: bool | None = None
    contract_creation_date: str | None = None
    contract_location: str | None = None
    premises_area: float | None = None
    premises_address: str | None = None
    transfer_date_from: str | None = None
    premises_condition: str | None = None
    valid_until: str | None = None
    goods_source: str | None = None
    person_name_dative: str | None = None
    passport_series: str | None = None
    passport_number: str | None = None
    passport_issued_by: str | None = None
    passport_issue_date: str | None = None
    consumer_type: str | None = None
    payer_type: str | None = None
    text_above: str | None = None
    text_below: str | None = None
    payment_purpose: str | None = None
    delivery_address: str | None = None
    contract_text: str | None = None
    add_buyer_signature: bool | None = None
    correction_number: str | None = None
    correction_date: str | None = None
    advance_invoice: str | None = None
    payment_doc_number: str | None = None
    payment_doc_date: str | None = None
    shipment_doc_name: str | None = None
    shipment_doc_number: str | None = None
    shipment_doc_date: str | None = None
    had_advance_invoices: bool | None = None
    state_contract_id: str | None = None
    currency: str | None = None
    form_version: str | None = None
    shipper_type: str | None = None
    consignee_type: str | None = None
    torg12_form_version: str | None = None
    torg12_supplier_type: str | None = None
    torg12_consignee_type: str | None = None
    basis_number: str | None = None
    basis_date: str | None = None
    basis_number2: str | None = None
    basis_date2: str | None = None
    transport_waybill_name: str | None = None
    transport_waybill_number: str | None = None
    transport_waybill_date: str | None = None
    attachment_sheets: int | None = None
    shipment_date_matches_doc: bool | None = None
    shipment_date: str | None = None
    add_discount_markup: bool | None = None
    ks3_reporting_period_from: str | None = None
    ks3_reporting_period_to: str | None = None

    class Config:
        extra = "allow"


def _doc_to_response(d: dict) -> dict:
    return d


def _calc_total(items: list[dict[str, Any]] | None) -> float:
    if not items:
        return 0.0
    total = 0.0
    for item in items:
        qty = float(item.get("qty", 0) or 0)
        price = float(item.get("price", 0) or 0)
        total += qty * price
    return total


@router.get("/documents")
def get_documents_stub(
    counterparty_id: int | None = None,
    current_user: models.User = Depends(get_current_user),
):
    if counterparty_id is not None:
        return [_doc_to_response(d) for d in _documents_store if d.get("counterparty_id") == counterparty_id]
    return [_doc_to_response(d) for d in _documents_store]


@router.get("/documents/{document_id}")
def get_document_stub(
    document_id: int,
    current_user: models.User = Depends(get_current_user),
):
    for d in _documents_store:
        if d["id"] == document_id:
            return _doc_to_response(d)
    raise HTTPException(status_code=404, detail="Документ не найден")


@router.post("/documents")
def create_document_stub(
    data: DocumentCreateStub,
    current_user: models.User = Depends(get_current_user),
):
    global _document_next_id
    now = datetime.utcnow().isoformat() + "Z"
    raw = data.model_dump()
    items = raw.get("items") or []
    doc = {
        **raw,
        "id": _document_next_id,
        "items": items,
        "total": _calc_total(items),
        "created_at": now,
    }
    _documents_store.append(doc)
    _document_next_id += 1
    return _doc_to_response(doc)


@router.put("/documents/{document_id}")
def update_document_stub(
    document_id: int,
    data: DocumentCreateStub,
    current_user: models.User = Depends(get_current_user),
):
    for d in _documents_store:
        if d["id"] == document_id:
            raw = data.model_dump(exclude_unset=True)
            d.update(raw)
            if "items" in raw:
                d["total"] = _calc_total(d.get("items"))
            return _doc_to_response(d)
    raise HTTPException(status_code=404, detail="Документ не найден")


@router.delete("/documents/{document_id}", status_code=204)
def delete_document_stub(
    document_id: int,
    current_user: models.User = Depends(get_current_user),
):
    global _documents_store
    for i, d in enumerate(_documents_store):
        if d["id"] == document_id:
            _documents_store.pop(i)
            return
    raise HTTPException(status_code=404, detail="Документ не найден")
