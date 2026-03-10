from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.dependencies import get_current_user, require_admin
from app.schemas import OrganizationCreate, OrganizationResponse
from app.services.audit import log_audit

router = APIRouter(prefix="/organizations", tags=["organizations"])


def _org_response(o: models.Organization) -> OrganizationResponse:
    return OrganizationResponse(
        id=o.id,
        org_type=o.org_type or "ip",
        name=o.name,
        comment=o.comment or "",
        inn=o.inn or "",
        kpp=o.kpp or "",
        address=o.address or "",
        ogrn=o.ogrn or "",
        ogrn_date=o.ogrn_date or "",
        director_title=o.director_title or "",
        director_name=o.director_name or "",
        chief_accountant=o.chief_accountant or "",
        phone=o.phone or "",
        email=o.email or "",
        telegram=o.telegram or "",
        website=o.website or "",
        edo_operator=o.edo_operator or "diadoc",
        bank_account=o.bank_account or "",
        personal_account=o.personal_account or "",
        bik=o.bik or "",
        bank_name=o.bank_name or "",
        corr_account=o.corr_account or "",
        bank_address=o.bank_address or "",
        sender_type=o.sender_type or "seller",
        permit_title=o.permit_title or "",
        permit_name=o.permit_name or "",
        release_title=o.release_title or "",
        release_name=o.release_name or "",
        responsible_title=o.responsible_title or "",
        responsible_name=o.responsible_name or "",
        economic_entity=o.economic_entity or "",
        invoice_message=o.invoice_message or "",
        add_stamp_to_invoice=o.add_stamp_to_invoice if o.add_stamp_to_invoice is not None else True,
        add_logo_to_invoice=o.add_logo_to_invoice if o.add_logo_to_invoice is not None else True,
        add_qr_to_invoice=o.add_qr_to_invoice if o.add_qr_to_invoice is not None else True,
        add_contacts_to_invoice=o.add_contacts_to_invoice if o.add_contacts_to_invoice is not None else False,
        act_conditions=o.act_conditions or "",
        order_conditions=o.order_conditions or "",
        created_at=o.created_at.isoformat() if o.created_at else "",
    )


@router.get("", response_model=list[OrganizationResponse])
def get_organizations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.portal_id:
        return []
    orgs = db.query(models.Organization).filter(
        models.Organization.portal_id == current_user.portal_id,
    ).order_by(models.Organization.name).all()
    return [_org_response(o) for o in orgs]


@router.get("/{org_id}", response_model=OrganizationResponse)
def get_organization(
    org_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = db.query(models.Organization).filter(
        models.Organization.id == org_id,
        models.Organization.portal_id == current_user.portal_id,
    ).first()
    if not org:
        raise HTTPException(status_code=404, detail="Организация не найдена")
    return _org_response(org)


@router.post("", response_model=OrganizationResponse)
def create_organization(
    data: OrganizationCreate,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if not current_user.portal_id:
        raise HTTPException(status_code=403, detail="Нет портала")
    org = models.Organization(
        portal_id=current_user.portal_id,
        org_type=data.org_type,
        name=data.name,
        comment=data.comment or "",
        inn=data.inn or "",
        kpp=data.kpp or "",
        address=data.address or "",
        ogrn=data.ogrn or "",
        ogrn_date=data.ogrn_date or "",
        director_title=data.director_title or "",
        director_name=data.director_name or "",
        chief_accountant=data.chief_accountant or "",
        phone=data.phone or "",
        email=data.email or "",
        telegram=data.telegram or "",
        website=data.website or "",
        edo_operator=data.edo_operator or "diadoc",
        bank_account=data.bank_account or "",
        personal_account=data.personal_account or "",
        bik=data.bik or "",
        bank_name=data.bank_name or "",
        corr_account=data.corr_account or "",
        bank_address=data.bank_address or "",
        sender_type=data.sender_type or "seller",
        permit_title=data.permit_title or "",
        permit_name=data.permit_name or "",
        release_title=data.release_title or "",
        release_name=data.release_name or "",
        responsible_title=data.responsible_title or "",
        responsible_name=data.responsible_name or "",
        economic_entity=data.economic_entity or "",
        invoice_message=data.invoice_message or "",
        add_stamp_to_invoice=data.add_stamp_to_invoice if data.add_stamp_to_invoice is not None else True,
        add_logo_to_invoice=data.add_logo_to_invoice if data.add_logo_to_invoice is not None else True,
        add_qr_to_invoice=data.add_qr_to_invoice if data.add_qr_to_invoice is not None else True,
        add_contacts_to_invoice=data.add_contacts_to_invoice if data.add_contacts_to_invoice is not None else False,
        act_conditions=data.act_conditions or "",
        order_conditions=data.order_conditions or "",
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    log_audit(db, "CREATE", "organization", str(org.id), current_user.portal_id, current_user.id, {"name": org.name})
    return _org_response(org)


@router.put("/{org_id}", response_model=OrganizationResponse)
def update_organization(
    org_id: int,
    data: OrganizationCreate,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    org = db.query(models.Organization).filter(
        models.Organization.id == org_id,
        models.Organization.portal_id == current_user.portal_id,
    ).first()
    if not org:
        raise HTTPException(status_code=404, detail="Организация не найдена")

    org.org_type = data.org_type
    org.name = data.name
    org.comment = data.comment or ""
    org.inn = data.inn or ""
    org.kpp = data.kpp or ""
    org.address = data.address or ""
    org.ogrn = data.ogrn or ""
    org.ogrn_date = data.ogrn_date or ""
    org.director_title = data.director_title or ""
    org.director_name = data.director_name or ""
    org.chief_accountant = data.chief_accountant or ""
    org.phone = data.phone or ""
    org.email = data.email or ""
    org.telegram = data.telegram or ""
    org.website = data.website or ""
    org.edo_operator = data.edo_operator or "diadoc"
    org.bank_account = data.bank_account or ""
    org.personal_account = data.personal_account or ""
    org.bik = data.bik or ""
    org.bank_name = data.bank_name or ""
    org.corr_account = data.corr_account or ""
    org.bank_address = data.bank_address or ""
    org.sender_type = data.sender_type or "seller"
    org.permit_title = data.permit_title or ""
    org.permit_name = data.permit_name or ""
    org.release_title = data.release_title or ""
    org.release_name = data.release_name or ""
    org.responsible_title = data.responsible_title or ""
    org.responsible_name = data.responsible_name or ""
    org.economic_entity = data.economic_entity or ""
    org.invoice_message = data.invoice_message or ""
    org.add_stamp_to_invoice = data.add_stamp_to_invoice if data.add_stamp_to_invoice is not None else True
    org.add_logo_to_invoice = data.add_logo_to_invoice if data.add_logo_to_invoice is not None else True
    org.add_qr_to_invoice = data.add_qr_to_invoice if data.add_qr_to_invoice is not None else True
    org.add_contacts_to_invoice = data.add_contacts_to_invoice if data.add_contacts_to_invoice is not None else False
    org.act_conditions = data.act_conditions or ""
    org.order_conditions = data.order_conditions or ""

    db.commit()
    db.refresh(org)
    log_audit(db, "UPDATE", "organization", str(org_id), current_user.portal_id, current_user.id, None)
    return _org_response(org)


@router.delete("/{org_id}", status_code=204)
def delete_organization(
    org_id: int,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    org = db.query(models.Organization).filter(
        models.Organization.id == org_id,
        models.Organization.portal_id == current_user.portal_id,
    ).first()
    if not org:
        raise HTTPException(status_code=404, detail="Организация не найдена")
    db.delete(org)
    log_audit(db, "DELETE", "organization", str(org_id), current_user.portal_id, current_user.id, None)
    db.commit()
    return None
