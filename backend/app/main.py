from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, projects, crews, worktypes, worklogs, payouts, expenses, cashin, expense_categories, reports, employees, superadmin, audit, stubs

app = FastAPI(title="Toratau Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(crews.router)
app.include_router(worktypes.router)
app.include_router(worklogs.router)
app.include_router(payouts.router)
app.include_router(expenses.router)
app.include_router(cashin.router)
app.include_router(expense_categories.router)
app.include_router(reports.router)
app.include_router(employees.router)
app.include_router(superadmin.router)
app.include_router(audit.router)
app.include_router(stubs.router)


@app.get("/health")
def health():
    return {"status": "ok"}
