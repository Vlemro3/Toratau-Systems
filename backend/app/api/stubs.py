"""Контрагенты и документы — полноценные эндпоинты с хранением в PostgreSQL."""
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_current_user, require_admin
from app.database import get_db
from app import models
from pydantic import BaseModel
from typing import Any

router = APIRouter(tags=["counterparties_documents"])


# ──────────────────────────────────────────────
# Pydantic schemas
# ──────────────────────────────────────────────

class CounterpartyCreateSchema(BaseModel):
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


class DocumentCreateSchema(BaseModel):
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


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

_CP_FIELDS = [
    "org_type", "name", "comment", "inn", "kpp", "address", "ogrn", "ogrn_date",
    "director_title", "director_name", "chief_accountant", "phone", "email",
    "website", "edo_operator", "bank_account", "personal_account", "bik",
    "bank_name", "corr_account", "bank_address", "receiver_type", "receiver_title",
    "receiver_name", "responsible_title", "responsible_name", "economic_entity",
]


def _counterparty_to_response(c: models.Counterparty) -> dict:
    return {
        "id": c.id,
        "org_type": c.org_type or "legal",
        "name": c.name or "",
        "comment": c.comment or "",
        "inn": c.inn or "",
        "kpp": c.kpp or "",
        "address": c.address or "",
        "ogrn": c.ogrn or "",
        "ogrn_date": c.ogrn_date or "",
        "director_title": c.director_title or "",
        "director_name": c.director_name or "",
        "chief_accountant": c.chief_accountant or "",
        "phone": c.phone or "",
        "email": c.email or "",
        "website": c.website or "",
        "edo_operator": c.edo_operator or "none",
        "bank_account": c.bank_account or "",
        "personal_account": c.personal_account or "",
        "bik": c.bik or "",
        "bank_name": c.bank_name or "",
        "corr_account": c.corr_account or "",
        "bank_address": c.bank_address or "",
        "receiver_type": c.receiver_type or "buyer",
        "receiver_title": c.receiver_title or "",
        "receiver_name": c.receiver_name or "",
        "responsible_title": c.responsible_title or "",
        "responsible_name": c.responsible_name or "",
        "economic_entity": c.economic_entity or "",
        "created_at": c.created_at.isoformat() if c.created_at else "",
    }


# All CpDocument column names that can be set from the request
_DOC_SIMPLE_FIELDS = [
    "organization_id", "doc_type", "number", "date", "basis", "notes", "taxation",
    "investor_id", "construction_name", "construction_address", "object_name", "okdp",
    "contract_number", "contract_date", "operation_type", "estimated_cost",
    "period_from", "period_to", "print_vat_amounts",
    "contract_creation_date", "contract_location", "premises_area", "premises_address",
    "transfer_date_from", "premises_condition",
    "valid_until", "goods_source", "person_name_dative",
    "passport_series", "passport_number", "passport_issued_by", "passport_issue_date",
    "consumer_type", "payer_type",
    "text_above", "text_below",
    "payment_purpose", "delivery_address", "contract_text", "add_buyer_signature",
    "correction_number", "correction_date", "advance_invoice",
    "payment_doc_number", "payment_doc_date",
    "shipment_doc_name", "shipment_doc_number", "shipment_doc_date",
    "had_advance_invoices", "state_contract_id", "currency", "form_version",
    "shipper_type", "consignee_type",
    "torg12_form_version", "torg12_supplier_type", "torg12_consignee_type",
    "basis_number", "basis_date", "basis_number2", "basis_date2",
    "transport_waybill_name", "transport_waybill_number", "transport_waybill_date",
    "attachment_sheets", "shipment_date_matches_doc", "shipment_date",
    "add_discount_markup", "ks3_reporting_period_from", "ks3_reporting_period_to",
]


def _calc_total(items: list[dict[str, Any]] | None) -> float:
    if not items:
        return 0.0
    total = 0.0
    for item in items:
        qty = float(item.get("qty", 0) or 0)
        price = float(item.get("price", 0) or 0)
        total += qty * price
    return total


def _doc_to_response(d: models.CpDocument) -> dict:
    result: dict[str, Any] = {
        "id": d.id,
        "counterparty_id": d.counterparty_id,
        "organization_id": d.organization_id,
        "doc_type": d.doc_type or "payment_invoice",
        "number": d.number or "",
        "date": d.date or "",
        "basis": d.basis or "",
        "items": d.items if d.items is not None else [],
        "notes": d.notes or "",
        "taxation": d.taxation,
        "total": float(d.total) if d.total is not None else 0,
        "created_at": d.created_at.isoformat() if d.created_at else "",
    }
    for f in _DOC_SIMPLE_FIELDS:
        if f not in result:
            val = getattr(d, f, None)
            if isinstance(val, Decimal):
                val = float(val)
            result[f] = val
    return result


# ──────────────────────────────────────────────
# Counterparties CRUD
# ──────────────────────────────────────────────

@router.get("/counterparties")
def get_counterparties(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(models.Counterparty).filter(
        models.Counterparty.portal_id == current_user.portal_id
    ).order_by(models.Counterparty.id).all()
    return [_counterparty_to_response(c) for c in rows]


@router.get("/counterparties/{counterparty_id}")
def get_counterparty(
    counterparty_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    c = db.query(models.Counterparty).filter(
        models.Counterparty.id == counterparty_id,
        models.Counterparty.portal_id == current_user.portal_id,
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="Контрагент не найден")
    return _counterparty_to_response(c)


@router.post("/counterparties")
def create_counterparty(
    data: CounterpartyCreateSchema,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    c = models.Counterparty(portal_id=current_user.portal_id)
    for field in _CP_FIELDS:
        val = getattr(data, field, None)
        if val is not None:
            setattr(c, field, val)
        elif field == "org_type":
            c.org_type = "legal"
    db.add(c)
    db.commit()
    db.refresh(c)
    return _counterparty_to_response(c)


@router.put("/counterparties/{counterparty_id}")
def update_counterparty(
    counterparty_id: int,
    data: CounterpartyCreateSchema,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    c = db.query(models.Counterparty).filter(
        models.Counterparty.id == counterparty_id,
        models.Counterparty.portal_id == current_user.portal_id,
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="Контрагент не найден")
    for field in _CP_FIELDS:
        val = getattr(data, field, None)
        setattr(c, field, val if val is not None else getattr(c, field))
    db.commit()
    db.refresh(c)
    return _counterparty_to_response(c)


@router.delete("/counterparties/{counterparty_id}", status_code=204)
def delete_counterparty(
    counterparty_id: int,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    c = db.query(models.Counterparty).filter(
        models.Counterparty.id == counterparty_id,
        models.Counterparty.portal_id == current_user.portal_id,
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="Контрагент не найден")
    db.delete(c)
    db.commit()
    return None


# ──────────────────────────────────────────────
# Documents CRUD
# ──────────────────────────────────────────────

@router.get("/documents")
def get_documents(
    counterparty_id: int | None = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(models.CpDocument).filter(
        models.CpDocument.portal_id == current_user.portal_id
    )
    if counterparty_id is not None:
        q = q.filter(models.CpDocument.counterparty_id == counterparty_id)
    rows = q.order_by(models.CpDocument.id.desc()).all()
    return [_doc_to_response(d) for d in rows]


@router.get("/documents/{document_id}")
def get_document(
    document_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    d = db.query(models.CpDocument).filter(
        models.CpDocument.id == document_id,
        models.CpDocument.portal_id == current_user.portal_id,
    ).first()
    if not d:
        raise HTTPException(status_code=404, detail="Документ не найден")
    return _doc_to_response(d)


@router.post("/documents")
def create_document(
    data: DocumentCreateSchema,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = data.items or []
    d = models.CpDocument(
        portal_id=current_user.portal_id,
        counterparty_id=data.counterparty_id,
        items=items,
        total=_calc_total(items),
    )
    raw = data.model_dump(exclude={"counterparty_id", "items"})
    for field in _DOC_SIMPLE_FIELDS:
        if field in raw and raw[field] is not None:
            setattr(d, field, raw[field])
    db.add(d)
    db.commit()
    db.refresh(d)
    return _doc_to_response(d)


@router.put("/documents/{document_id}")
def update_document(
    document_id: int,
    data: DocumentCreateSchema,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    d = db.query(models.CpDocument).filter(
        models.CpDocument.id == document_id,
        models.CpDocument.portal_id == current_user.portal_id,
    ).first()
    if not d:
        raise HTTPException(status_code=404, detail="Документ не найден")
    raw = data.model_dump(exclude_unset=True)
    if "items" in raw:
        d.items = raw["items"] or []
        d.total = _calc_total(d.items)
    if "counterparty_id" in raw:
        d.counterparty_id = raw["counterparty_id"]
    for field in _DOC_SIMPLE_FIELDS:
        if field in raw:
            setattr(d, field, raw[field])
    db.commit()
    db.refresh(d)
    return _doc_to_response(d)


@router.delete("/documents/{document_id}", status_code=204)
def delete_document(
    document_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    d = db.query(models.CpDocument).filter(
        models.CpDocument.id == document_id,
        models.CpDocument.portal_id == current_user.portal_id,
    ).first()
    if not d:
        raise HTTPException(status_code=404, detail="Документ не найден")
    db.delete(d)
    db.commit()
    return None
