from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


def decimal_to_float(v):
    return float(v) if v is not None else None


def date_to_str(d):
    return d.isoformat() if d else None


def datetime_to_str(d):
    return d.isoformat() if d else None


# ---- Auth ----
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str
    portal_slug: Optional[str] = None


class UserBase(BaseModel):
    username: str
    full_name: str
    role: str
    is_active: bool
    portal_id: Optional[str] = None
    project_ids: Optional[list[int]] = None


class UserResponse(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    email: str


class ProfileUpdate(BaseModel):
    full_name: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ---- Project ----
class ProjectCreate(BaseModel):
    name: str
    address: str = ""
    client: str = ""
    start_date: str
    end_date: Optional[str] = None
    status: str = "new"
    contract_amount: float
    planned_cost: float
    notes: str = ""


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    client: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    contract_amount: Optional[float] = None
    planned_cost: Optional[float] = None
    notes: Optional[str] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    address: str
    client: str
    start_date: str
    end_date: Optional[str] = None
    status: str
    contract_amount: float
    planned_cost: float
    notes: str
    created_at: str
    updated_at: str
    portal_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_portal(cls, obj, portal_slug: Optional[str] = None):
        return cls(
            id=obj.id,
            name=obj.name,
            address=obj.address or "",
            client=obj.client or "",
            start_date=date_to_str(obj.start_date),
            end_date=date_to_str(obj.end_date),
            status=obj.status or "new",
            contract_amount=float(obj.contract_amount or 0),
            planned_cost=float(obj.planned_cost or 0),
            notes=obj.notes or "",
            created_at=datetime_to_str(obj.created_at),
            updated_at=datetime_to_str(obj.updated_at),
            portal_id=portal_slug,
        )


# ---- Crew ----
class CrewCreate(BaseModel):
    name: str
    contact: str = ""
    phone: Optional[str] = None
    notes: str = ""
    is_active: bool = True


class CrewUpdate(BaseModel):
    name: Optional[str] = None
    contact: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class CrewResponse(BaseModel):
    id: int
    name: str
    contact: str
    phone: Optional[str] = None
    notes: str
    is_active: bool
    model_config = ConfigDict(from_attributes=True)


# ---- WorkType ----
class WorkTypeCreate(BaseModel):
    name: str
    unit: str
    rate: float
    category: str = ""
    is_active: bool = True


class WorkTypeUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    rate: Optional[float] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


class WorkTypeResponse(BaseModel):
    id: int
    name: str
    unit: str
    rate: float
    category: str
    is_active: bool
    model_config = ConfigDict(from_attributes=True)


class AdjustRatesRequest(BaseModel):
    percentage: float


# ---- WorkLog ----
class WorkLogCreate(BaseModel):
    project_id: int
    crew_id: int
    work_type_id: int
    date: str
    volume: float
    accrued_amount: float
    comment: str = ""


class WorkLogUpdate(BaseModel):
    project_id: Optional[int] = None
    crew_id: Optional[int] = None
    work_type_id: Optional[int] = None
    date: Optional[str] = None
    volume: Optional[float] = None
    accrued_amount: Optional[float] = None
    comment: Optional[str] = None


class WorkLogResponse(BaseModel):
    id: int
    project_id: int
    crew_id: int
    work_type_id: int
    date: str
    volume: float
    comment: str
    created_by: int
    updated_by: Optional[int] = None
    status: str
    accrued_amount: float
    photos: list = []
    project: Optional[ProjectResponse] = None
    crew: Optional[CrewResponse] = None
    work_type: Optional[WorkTypeResponse] = None
    creator: Optional[UserResponse] = None
    updated_by_user: Optional[UserResponse] = None
    model_config = ConfigDict(from_attributes=True)


# ---- Payout ----
class PayoutCreate(BaseModel):
    project_id: int
    crew_id: int
    date: str
    amount: float
    payment_method: str
    comment: str = ""


class PayoutUpdate(BaseModel):
    project_id: Optional[int] = None
    crew_id: Optional[int] = None
    date: Optional[str] = None
    amount: Optional[float] = None
    payment_method: Optional[str] = None
    comment: Optional[str] = None


class PayoutResponse(BaseModel):
    id: int
    project_id: int
    crew_id: int
    date: str
    amount: float
    payment_method: str
    comment: str
    status: str
    created_by: int
    approved_by: Optional[int] = None
    updated_by: Optional[int] = None
    crew: Optional[CrewResponse] = None
    creator: Optional[UserResponse] = None
    updated_by_user: Optional[UserResponse] = None
    model_config = ConfigDict(from_attributes=True)


# ---- Expense ----
class ExpenseCreate(BaseModel):
    project_id: int
    date: str
    amount: float
    category: str
    comment: str = ""


class ExpenseUpdate(BaseModel):
    project_id: Optional[int] = None
    date: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    comment: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: int
    project_id: int
    date: str
    amount: float
    category: str
    comment: str
    file_url: Optional[str] = None
    created_by: int
    updated_by: Optional[int] = None
    creator: Optional[UserResponse] = None
    updated_by_user: Optional[UserResponse] = None
    model_config = ConfigDict(from_attributes=True)


# ---- CashIn ----
class CashInCreate(BaseModel):
    project_id: int
    date: str
    amount: float
    comment: str = ""


class CashInUpdate(BaseModel):
    project_id: Optional[int] = None
    date: Optional[str] = None
    amount: Optional[float] = None
    comment: Optional[str] = None


class CashInResponse(BaseModel):
    id: int
    project_id: int
    date: str
    amount: float
    comment: str
    file_url: Optional[str] = None
    created_by: int
    updated_by: Optional[int] = None
    creator: Optional[UserResponse] = None
    updated_by_user: Optional[UserResponse] = None
    model_config = ConfigDict(from_attributes=True)


# ---- Reports ----
class CrewSummaryResponse(BaseModel):
    crew: CrewResponse
    accrued: float
    paid: float
    debt: float


class ProjectReportResponse(BaseModel):
    project: ProjectResponse
    total_cash_in: float
    total_expenses: float
    total_accrued: float
    total_paid: float
    total_fact_expense: float
    balance: float
    forecast_profit: float
    plan_deviation: float
    crews_summary: list[CrewSummaryResponse]


# ---- Employee ----
class EmployeeCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str
    project_ids: Optional[list[int]] = None


class EmployeeResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    is_active: bool
    portal_id: str
    created_at: str
    project_ids: Optional[list[int]] = None
    model_config = ConfigDict(from_attributes=True)


# ---- Superadmin / Portal ----
class PortalCreate(BaseModel):
    name: str
    ownerEmail: str
    subscription: Optional[dict] = None
    status: Optional[str] = None
    limits: Optional[dict] = None


class PortalUpdate(BaseModel):
    name: Optional[str] = None
    subscription: Optional[dict] = None
    status: Optional[str] = None
    limits: Optional[dict] = None
    usersCount: Optional[int] = None


class PortalResponse(BaseModel):
    id: str
    name: str
    ownerEmail: str
    createdAt: str
    usersCount: int
    subscription: dict
    status: str
    limits: dict
    model_config = ConfigDict(from_attributes=True)


# ---- Superadmin login ----
class SuperadminLoginRequest(BaseModel):
    username: str
    password: str
