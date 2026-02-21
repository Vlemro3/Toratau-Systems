from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models
from app.schemas import ProjectReportResponse, ProjectResponse, CrewSummaryResponse, CrewResponse


def get_project_report(db: Session, project_id: int, portal_id: int) -> ProjectReportResponse | None:
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.portal_id == portal_id,
    ).first()
    if not project:
        return None

    work_logs = db.query(models.WorkLog).filter(models.WorkLog.project_id == project_id).all()
    payouts = db.query(models.Payout).filter(models.Payout.project_id == project_id).all()

    total_cash_in = db.query(func.coalesce(func.sum(models.CashIn.amount), 0)).filter(
        models.CashIn.project_id == project_id
    ).scalar() or Decimal(0)
    total_expenses = db.query(func.coalesce(func.sum(models.Expense.amount), 0)).filter(
        models.Expense.project_id == project_id
    ).scalar() or Decimal(0)
    total_accrued = sum((wl.accrued_amount or Decimal(0)) for wl in work_logs)
    total_paid = sum((p.amount for p in payouts))

    total_fact_expense = float(total_expenses) + float(total_paid)
    balance = float(total_cash_in) - total_fact_expense
    forecast_profit = float(project.contract_amount or 0) - (float(total_expenses) + float(total_accrued))
    plan_deviation = (float(total_expenses) + float(total_accrued)) - float(project.planned_cost or 0)

    crew_map: dict[int, tuple[Decimal, Decimal]] = {}
    for wl in work_logs:
        acc, paid = crew_map.get(wl.crew_id, (Decimal(0), Decimal(0)))
        crew_map[wl.crew_id] = (acc + (wl.accrued_amount or 0), paid)
    for p in payouts:
        acc, paid = crew_map.get(p.crew_id, (Decimal(0), Decimal(0)))
        crew_map[p.crew_id] = (acc, paid + p.amount)

    portal = db.query(models.Portal).filter(models.Portal.id == portal_id).first()
    portal_slug = portal.slug if portal else None
    project_resp = ProjectResponse.from_orm_with_portal(project, portal_slug)

    crews_summary: list[CrewSummaryResponse] = []
    for crew_id, (acc, paid) in crew_map.items():
        crew = db.query(models.Crew).filter(models.Crew.id == crew_id).first()
        if crew:
            crews_summary.append(CrewSummaryResponse(
                crew=CrewResponse(
                    id=crew.id,
                    name=crew.name,
                    contact=crew.contact or "",
                    phone=crew.phone,
                    notes=crew.notes or "",
                    is_active=crew.is_active,
                ),
                accrued=float(acc),
                paid=float(paid),
                debt=float(acc - paid),
            ))

    return ProjectReportResponse(
        project=project_resp,
        total_cash_in=float(total_cash_in),
        total_expenses=float(total_expenses),
        total_accrued=float(total_accrued),
        total_paid=float(total_paid),
        total_fact_expense=total_fact_expense,
        balance=balance,
        forecast_profit=forecast_profit,
        plan_deviation=plan_deviation,
        crews_summary=crews_summary,
    )
