from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, Boolean, Numeric, Date, DateTime, ForeignKey, Text, Enum as SQLEnum, Table, JSON,
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class PortalStatus(str, enum.Enum):
    active = "active"
    blocked = "blocked"


class Portal(Base):
    __tablename__ = "portals"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(64), unique=True, nullable=False, index=True)
    name = Column(String(256), nullable=False)
    owner_email = Column(String(256), nullable=False)
    status = Column(String(32), default="active", nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    users = relationship("User", back_populates="portal", foreign_keys="User.portal_id")
    projects = relationship("Project", back_populates="portal")
    crews = relationship("Crew", back_populates="portal")
    work_types = relationship("WorkType", back_populates="portal")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(128), nullable=False, index=True)
    hashed_password = Column(String(256), nullable=False)
    full_name = Column(String(256), nullable=False)
    role = Column(String(32), nullable=False)  # admin, foreman, superAdmin
    is_active = Column(Boolean, default=True)
    portal_id = Column(Integer, ForeignKey("portals.id"), index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    portal = relationship("Portal", back_populates="users", foreign_keys=[portal_id])
    project_ids_link = relationship("UserProject", back_populates="user", cascade="all, delete-orphan")


class UserProject(Base):
    __tablename__ = "user_projects"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user = relationship("User", back_populates="project_ids_link")
    project = relationship("Project")


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    portal_id = Column(Integer, ForeignKey("portals.id"), nullable=False, index=True)
    name = Column(String(256), nullable=False)
    address = Column(String(512), default="")
    client = Column(String(256), default="")
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    status = Column(String(32), default="new")
    contract_amount = Column(Numeric(14, 2), default=0)
    planned_cost = Column(Numeric(14, 2), default=0)
    notes = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    portal = relationship("Portal", back_populates="projects")
    work_logs = relationship("WorkLog", back_populates="project")
    payouts = relationship("Payout", back_populates="project")
    expenses = relationship("Expense", back_populates="project")
    cash_ins = relationship("CashIn", back_populates="project")


class Crew(Base):
    __tablename__ = "crews"
    id = Column(Integer, primary_key=True, index=True)
    portal_id = Column(Integer, ForeignKey("portals.id"), nullable=False, index=True)
    name = Column(String(256), nullable=False)
    contact = Column(String(256), default="")
    phone = Column(String(64))
    notes = Column(Text, default="")
    is_active = Column(Boolean, default=True)
    portal = relationship("Portal", back_populates="crews")


class WorkType(Base):
    __tablename__ = "work_types"
    id = Column(Integer, primary_key=True, index=True)
    portal_id = Column(Integer, ForeignKey("portals.id"), nullable=False, index=True)
    name = Column(String(256), nullable=False)
    unit = Column(String(32), nullable=False)
    rate = Column(Numeric(14, 2), nullable=False)
    category = Column(String(128), default="")
    is_active = Column(Boolean, default=True)
    portal = relationship("Portal", back_populates="work_types")
    work_logs = relationship("WorkLog", back_populates="work_type")


class WorkLog(Base):
    __tablename__ = "work_logs"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    crew_id = Column(Integer, ForeignKey("crews.id"), nullable=False, index=True)
    work_type_id = Column(Integer, ForeignKey("work_types.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    volume = Column(Numeric(14, 2), nullable=False)
    comment = Column(Text, default="")
    rate_snapshot = Column(Numeric(14, 2), nullable=False)
    accrued_amount = Column(Numeric(14, 2), nullable=False)
    status = Column(String(32), default="pending")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"))
    project = relationship("Project", back_populates="work_logs")
    crew = relationship("Crew")
    work_type = relationship("WorkType", back_populates="work_logs")
    photos = Column(JSON, default=list)


class Payout(Base):
    __tablename__ = "payouts"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    crew_id = Column(Integer, ForeignKey("crews.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    payment_method = Column(String(32), nullable=False)
    comment = Column(Text, default="")
    status = Column(String(32), default="created")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id"))
    updated_by = Column(Integer, ForeignKey("users.id"))
    project = relationship("Project", back_populates="payouts")
    crew = relationship("Crew")


class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    category = Column(String(128), nullable=False)
    comment = Column(Text, default="")
    file_url = Column(String(512))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"))
    project = relationship("Project", back_populates="expenses")


class CashIn(Base):
    __tablename__ = "cash_ins"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    comment = Column(Text, default="")
    file_url = Column(String(512))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"))
    project = relationship("Project", back_populates="cash_ins")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    portal_id = Column(Integer, ForeignKey("portals.id"), index=True)
    action = Column(String(32), nullable=False)  # CREATE, UPDATE, DELETE, APPROVE, REJECT
    entity_type = Column(String(64), nullable=False)
    entity_id = Column(String(64), nullable=False)
    diff_json = Column(JSON)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class CustomExpenseCategory(Base):
    __tablename__ = "custom_expense_categories"
    id = Column(Integer, primary_key=True, index=True)
    portal_id = Column(Integer, ForeignKey("portals.id"), nullable=False, index=True)
    name = Column(String(128), nullable=False)


class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    portal_id = Column(Integer, ForeignKey("portals.id"), nullable=False, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(32), nullable=False, default="trial")  # trial, active, expiring, expired, blocked, pending_payment
    plan_tier = Column(String(32), nullable=True)  # start, business, premium, unlim
    plan_interval = Column(String(16), nullable=True)  # monthly, yearly
    current_period_start = Column(DateTime(timezone=True), default=datetime.utcnow)
    current_period_end = Column(DateTime(timezone=True))
    trial_ends_at = Column(DateTime(timezone=True))
    cancelled_at = Column(DateTime(timezone=True))
    blocked_at = Column(DateTime(timezone=True))
    blocked_reason = Column(String(512))
    previous_status = Column(String(32))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    portal = relationship("Portal")
    user = relationship("User")
    invoices = relationship("BillingInvoice", back_populates="subscription")


class BillingInvoice(Base):
    __tablename__ = "billing_invoices"
    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False, index=True)
    portal_id = Column(Integer, ForeignKey("portals.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_tier = Column(String(32), nullable=False)
    plan_interval = Column(String(16), nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    status = Column(String(32), nullable=False, default="pending")  # pending, paid, failed, cancelled
    tochka_operation_id = Column(String(256), nullable=True, index=True)
    tochka_payment_link = Column(String(1024), nullable=True)
    tochka_payment_link_id = Column(String(256), nullable=True)
    paid_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    subscription = relationship("Subscription", back_populates="invoices")


class PaymentLog(Base):
    __tablename__ = "payment_logs"
    id = Column(Integer, primary_key=True, index=True)
    portal_id = Column(Integer, ForeignKey("portals.id"), nullable=False, index=True)
    invoice_id = Column(Integer, ForeignKey("billing_invoices.id"), nullable=True, index=True)
    action = Column(String(128), nullable=False)
    status = Column(String(32), nullable=False)
    amount = Column(Numeric(14, 2), default=0)
    details = Column(Text, default="")
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)


class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    portal_id = Column(Integer, ForeignKey("portals.id"), nullable=False, index=True)
    org_type = Column(String(32), nullable=False, default="ip")
    name = Column(String(256), nullable=False)
    comment = Column(Text, default="")
    inn = Column(String(20), default="")
    kpp = Column(String(20), default="")
    address = Column(String(512), default="")
    ogrn = Column(String(20), default="")
    ogrn_date = Column(String(20), default="")
    director_title = Column(String(256), default="")
    director_name = Column(String(256), default="")
    chief_accountant = Column(String(256), default="")
    phone = Column(String(64), default="")
    email = Column(String(256), default="")
    telegram = Column(String(128), default="")
    website = Column(String(256), default="")
    edo_operator = Column(String(64), default="diadoc")
    bank_account = Column(String(30), default="")
    personal_account = Column(String(30), default="")
    bik = Column(String(12), default="")
    bank_name = Column(String(256), default="")
    corr_account = Column(String(30), default="")
    bank_address = Column(String(512), default="")
    sender_type = Column(String(32), default="seller")
    permit_title = Column(String(256), default="")
    permit_name = Column(String(256), default="")
    release_title = Column(String(256), default="")
    release_name = Column(String(256), default="")
    responsible_title = Column(String(256), default="")
    responsible_name = Column(String(256), default="")
    economic_entity = Column(String(256), default="")
    invoice_message = Column(Text, default="")
    add_stamp_to_invoice = Column(Boolean, default=True)
    add_logo_to_invoice = Column(Boolean, default=True)
    add_qr_to_invoice = Column(Boolean, default=True)
    add_contacts_to_invoice = Column(Boolean, default=False)
    act_conditions = Column(Text, default="")
    order_conditions = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    portal = relationship("Portal")
