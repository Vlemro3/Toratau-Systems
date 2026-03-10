"""add organizations table

Revision ID: 002
Revises: 001
Create Date: 2026-03-10

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("portal_id", sa.Integer(), nullable=False),
        sa.Column("org_type", sa.String(32), nullable=False, server_default="ip"),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("comment", sa.Text(), server_default="", nullable=True),
        sa.Column("inn", sa.String(20), server_default="", nullable=True),
        sa.Column("kpp", sa.String(20), server_default="", nullable=True),
        sa.Column("address", sa.String(512), server_default="", nullable=True),
        sa.Column("ogrn", sa.String(20), server_default="", nullable=True),
        sa.Column("ogrn_date", sa.String(20), server_default="", nullable=True),
        sa.Column("director_title", sa.String(256), server_default="", nullable=True),
        sa.Column("director_name", sa.String(256), server_default="", nullable=True),
        sa.Column("chief_accountant", sa.String(256), server_default="", nullable=True),
        sa.Column("phone", sa.String(64), server_default="", nullable=True),
        sa.Column("email", sa.String(256), server_default="", nullable=True),
        sa.Column("telegram", sa.String(128), server_default="", nullable=True),
        sa.Column("website", sa.String(256), server_default="", nullable=True),
        sa.Column("edo_operator", sa.String(64), server_default="diadoc", nullable=True),
        sa.Column("bank_account", sa.String(30), server_default="", nullable=True),
        sa.Column("personal_account", sa.String(30), server_default="", nullable=True),
        sa.Column("bik", sa.String(12), server_default="", nullable=True),
        sa.Column("bank_name", sa.String(256), server_default="", nullable=True),
        sa.Column("corr_account", sa.String(30), server_default="", nullable=True),
        sa.Column("bank_address", sa.String(512), server_default="", nullable=True),
        sa.Column("sender_type", sa.String(32), server_default="seller", nullable=True),
        sa.Column("permit_title", sa.String(256), server_default="", nullable=True),
        sa.Column("permit_name", sa.String(256), server_default="", nullable=True),
        sa.Column("release_title", sa.String(256), server_default="", nullable=True),
        sa.Column("release_name", sa.String(256), server_default="", nullable=True),
        sa.Column("responsible_title", sa.String(256), server_default="", nullable=True),
        sa.Column("responsible_name", sa.String(256), server_default="", nullable=True),
        sa.Column("economic_entity", sa.String(256), server_default="", nullable=True),
        sa.Column("invoice_message", sa.Text(), server_default="", nullable=True),
        sa.Column("add_stamp_to_invoice", sa.Boolean(), server_default="true", nullable=True),
        sa.Column("add_logo_to_invoice", sa.Boolean(), server_default="true", nullable=True),
        sa.Column("add_qr_to_invoice", sa.Boolean(), server_default="true", nullable=True),
        sa.Column("add_contacts_to_invoice", sa.Boolean(), server_default="false", nullable=True),
        sa.Column("act_conditions", sa.Text(), server_default="", nullable=True),
        sa.Column("order_conditions", sa.Text(), server_default="", nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["portal_id"], ["portals.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_organizations_portal_id", "organizations", ["portal_id"], unique=False)


def downgrade() -> None:
    op.drop_table("organizations")
