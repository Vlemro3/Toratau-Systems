"""add counterparties and cp_documents tables

Revision ID: 004
Revises: 003
Create Date: 2026-03-12

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "counterparties",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("portal_id", sa.Integer(), sa.ForeignKey("portals.id"), nullable=False, index=True),
        sa.Column("org_type", sa.String(32), nullable=False, server_default="legal"),
        sa.Column("name", sa.String(256), nullable=False, server_default=""),
        sa.Column("comment", sa.Text(), server_default=""),
        sa.Column("inn", sa.String(20), server_default=""),
        sa.Column("kpp", sa.String(20), server_default=""),
        sa.Column("address", sa.String(512), server_default=""),
        sa.Column("ogrn", sa.String(20), server_default=""),
        sa.Column("ogrn_date", sa.String(20), server_default=""),
        sa.Column("director_title", sa.String(256), server_default=""),
        sa.Column("director_name", sa.String(256), server_default=""),
        sa.Column("chief_accountant", sa.String(256), server_default=""),
        sa.Column("phone", sa.String(64), server_default=""),
        sa.Column("email", sa.String(256), server_default=""),
        sa.Column("website", sa.String(256), server_default=""),
        sa.Column("edo_operator", sa.String(64), server_default="none"),
        sa.Column("bank_account", sa.String(30), server_default=""),
        sa.Column("personal_account", sa.String(30), server_default=""),
        sa.Column("bik", sa.String(12), server_default=""),
        sa.Column("bank_name", sa.String(256), server_default=""),
        sa.Column("corr_account", sa.String(30), server_default=""),
        sa.Column("bank_address", sa.String(512), server_default=""),
        sa.Column("receiver_type", sa.String(32), server_default="buyer"),
        sa.Column("receiver_title", sa.String(256), server_default=""),
        sa.Column("receiver_name", sa.String(256), server_default=""),
        sa.Column("responsible_title", sa.String(256), server_default=""),
        sa.Column("responsible_name", sa.String(256), server_default=""),
        sa.Column("economic_entity", sa.String(256), server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "cp_documents",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("portal_id", sa.Integer(), sa.ForeignKey("portals.id"), nullable=False, index=True),
        sa.Column("counterparty_id", sa.Integer(), sa.ForeignKey("counterparties.id"), nullable=False, index=True),
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id"), nullable=True),
        sa.Column("doc_type", sa.String(64), nullable=False, server_default="payment_invoice"),
        sa.Column("number", sa.String(64), server_default=""),
        sa.Column("date", sa.String(32), server_default=""),
        sa.Column("basis", sa.Text(), server_default=""),
        sa.Column("items", sa.JSON(), server_default="[]"),
        sa.Column("notes", sa.Text(), server_default=""),
        sa.Column("taxation", sa.String(32), nullable=True),
        sa.Column("total", sa.Numeric(14, 2), server_default="0"),
        # Акт КС-2
        sa.Column("investor_id", sa.Integer(), nullable=True),
        sa.Column("construction_name", sa.String(512), server_default=""),
        sa.Column("construction_address", sa.String(512), server_default=""),
        sa.Column("object_name", sa.String(512), server_default=""),
        sa.Column("okdp", sa.String(64), server_default=""),
        sa.Column("contract_number", sa.String(128), server_default=""),
        sa.Column("contract_date", sa.String(32), server_default=""),
        sa.Column("operation_type", sa.String(128), server_default=""),
        sa.Column("estimated_cost", sa.Numeric(14, 2), nullable=True),
        sa.Column("period_from", sa.String(32), server_default=""),
        sa.Column("period_to", sa.String(32), server_default=""),
        sa.Column("print_vat_amounts", sa.Boolean(), server_default="false"),
        # Акт приема-передачи помещения
        sa.Column("contract_creation_date", sa.String(32), server_default=""),
        sa.Column("contract_location", sa.String(256), server_default=""),
        sa.Column("premises_area", sa.Numeric(14, 2), nullable=True),
        sa.Column("premises_address", sa.String(512), server_default=""),
        sa.Column("transfer_date_from", sa.String(32), server_default=""),
        sa.Column("premises_condition", sa.Text(), server_default=""),
        # Доверенность на получение ТМЦ
        sa.Column("valid_until", sa.String(32), server_default=""),
        sa.Column("goods_source", sa.String(256), server_default=""),
        sa.Column("person_name_dative", sa.String(256), server_default=""),
        sa.Column("passport_series", sa.String(16), server_default=""),
        sa.Column("passport_number", sa.String(16), server_default=""),
        sa.Column("passport_issued_by", sa.String(512), server_default=""),
        sa.Column("passport_issue_date", sa.String(32), server_default=""),
        sa.Column("consumer_type", sa.String(32), server_default="same"),
        sa.Column("payer_type", sa.String(32), server_default="same"),
        # Коммерческое предложение
        sa.Column("text_above", sa.Text(), server_default=""),
        sa.Column("text_below", sa.Text(), server_default=""),
        # Счёт-договор / счёт-оферта
        sa.Column("payment_purpose", sa.String(64), server_default="none"),
        sa.Column("delivery_address", sa.String(512), server_default=""),
        sa.Column("contract_text", sa.Text(), server_default=""),
        sa.Column("add_buyer_signature", sa.Boolean(), server_default="false"),
        # Счет-фактура
        sa.Column("correction_number", sa.String(64), server_default=""),
        sa.Column("correction_date", sa.String(32), server_default=""),
        sa.Column("advance_invoice", sa.String(16), server_default="no"),
        sa.Column("payment_doc_number", sa.String(64), server_default=""),
        sa.Column("payment_doc_date", sa.String(32), server_default=""),
        sa.Column("shipment_doc_name", sa.String(256), server_default=""),
        sa.Column("shipment_doc_number", sa.String(64), server_default=""),
        sa.Column("shipment_doc_date", sa.String(32), server_default=""),
        sa.Column("had_advance_invoices", sa.Boolean(), server_default="false"),
        sa.Column("state_contract_id", sa.String(128), server_default=""),
        sa.Column("currency", sa.String(8), server_default="RUB"),
        sa.Column("form_version", sa.String(32), server_default="current"),
        sa.Column("shipper_type", sa.String(32), server_default="seller"),
        sa.Column("consignee_type", sa.String(32), server_default="buyer"),
        # ТОРГ-12
        sa.Column("torg12_form_version", sa.String(32), server_default="new"),
        sa.Column("torg12_supplier_type", sa.String(32), server_default="seller"),
        sa.Column("torg12_consignee_type", sa.String(32), server_default="payer"),
        sa.Column("basis_number", sa.String(64), server_default=""),
        sa.Column("basis_date", sa.String(32), server_default=""),
        sa.Column("basis_number2", sa.String(64), server_default=""),
        sa.Column("basis_date2", sa.String(32), server_default=""),
        sa.Column("transport_waybill_name", sa.String(256), server_default=""),
        sa.Column("transport_waybill_number", sa.String(64), server_default=""),
        sa.Column("transport_waybill_date", sa.String(32), server_default=""),
        sa.Column("attachment_sheets", sa.Integer(), server_default="5"),
        sa.Column("shipment_date_matches_doc", sa.Boolean(), server_default="false"),
        sa.Column("shipment_date", sa.String(32), server_default=""),
        sa.Column("add_discount_markup", sa.Boolean(), server_default="false"),
        # КС-3
        sa.Column("ks3_reporting_period_from", sa.String(32), server_default=""),
        sa.Column("ks3_reporting_period_to", sa.String(32), server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("cp_documents")
    op.drop_table("counterparties")
