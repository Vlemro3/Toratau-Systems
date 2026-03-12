"""
API смет: чтение файла (.xls, .xlsx, .xml), ЛСР и сравнение (локальные расчёты).
Парсинг файлов — прямое чтение без нейросети (estimate_file_parser).
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from app.dependencies import require_admin
from app import models
from app.services.estimate_file_parser import parse_estimate_file

router = APIRouter(prefix="/estimates", tags=["estimates"])


class LSRRequest(BaseModel):
    positions: list[dict]
    strategy: str = "standard"


class CompareRequest(BaseModel):
    positions: list[dict]
    lsr: dict


def _safe_float(val, default: float = 0) -> float:
    if val is None:
        return default
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def _generate_lsr_local(positions: list[dict], strategy: str = "standard") -> dict:
    """Локальное формирование ЛСР: копирует позиции сметы заказчика как шаблон для внутренней сметы.
    Пользователь затем редактирует цены вручную на фронтенде."""
    lsr_positions = []
    for i, p in enumerate(positions):
        volume = _safe_float(p.get("volume"))
        total = _safe_float(p.get("total"))
        # Начальная разбивка: материалы ~55%, труд ~30%, машины ~15% от total
        materials = round(total * 0.55, 2)
        labor = round(total * 0.30, 2)
        machines = round(total * 0.15, 2)
        direct_cost = round(materials + labor + machines, 2)
        overhead = round(_safe_float(p.get("overhead")), 2)
        profit = round(_safe_float(p.get("profit")), 2)
        row_total = round(direct_cost + overhead + profit, 2)

        lsr_positions.append({
            "id": i + 1,
            "num": str(p.get("num", i + 1)),
            "name": str(p.get("name", "")),
            "unit": str(p.get("unit", "")),
            "volume": volume,
            "materials": materials,
            "labor": labor,
            "machines": machines,
            "directCost": direct_cost,
            "overhead": overhead,
            "profit": profit,
            "total": row_total,
        })

    return {
        "positions": lsr_positions,
        "totalMaterials": round(sum(p["materials"] for p in lsr_positions), 2),
        "totalLabor": round(sum(p["labor"] for p in lsr_positions), 2),
        "totalMachines": round(sum(p["machines"] for p in lsr_positions), 2),
        "totalDirect": round(sum(p["directCost"] for p in lsr_positions), 2),
        "totalOverhead": round(sum(p["overhead"] for p in lsr_positions), 2),
        "totalProfit": round(sum(p["profit"] for p in lsr_positions), 2),
        "grandTotal": round(sum(p["total"] for p in lsr_positions), 2),
    }


def _run_compare_local(positions: list[dict], lsr: dict) -> dict:
    """Локальное сравнение сметы заказчика и нашего ЛСР — простой расчёт разницы по позициям."""
    lsr_positions = lsr.get("positions") or []
    rows = []
    total_customer = 0.0
    total_our = 0.0

    for i, p in enumerate(positions):
        customer_sum = _safe_float(p.get("total")) + _safe_float(p.get("overhead")) + _safe_float(p.get("profit"))
        # Ищем соответствующую ЛСР-позицию по индексу
        lsr_p = lsr_positions[i] if i < len(lsr_positions) else None
        our_sum = _safe_float(lsr_p.get("total")) if lsr_p else 0
        diff_rub = round(customer_sum - our_sum, 2)
        diff_pct = round((diff_rub / customer_sum * 100) if customer_sum else 0, 1)

        rows.append({
            "num": str(p.get("num", i + 1)),
            "name": str(p.get("name", "")),
            "customerSum": round(customer_sum, 2),
            "ourSum": round(our_sum, 2),
            "diffRub": diff_rub,
            "diffPct": diff_pct,
        })
        total_customer += customer_sum
        total_our += our_sum

    total_diff = round(total_customer - total_our, 2)
    marginality = round((total_diff / total_customer * 100) if total_customer else 0, 1)

    return {
        "rows": rows,
        "totalCustomer": round(total_customer, 2),
        "totalOur": round(total_our, 2),
        "totalDiff": total_diff,
        "marginality": marginality,
        "possibleProfit": total_diff,
    }


@router.post("/parse")
async def parse_file(
    file: UploadFile = File(...),
    base_type: str = Form("FER"),
    current_user: models.User = Depends(require_admin),
):
    """Загрузка файла сметы (.xls, .xlsx, .xml) и извлечение позиций прямым чтением (без нейросети)."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Файл не выбран")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Файл пустой")
    try:
        positions = parse_estimate_file(content, file.filename or "", base_type)
        return {"positions": positions}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка чтения файла: {e}")


@router.post("/lsr")
async def lsr(
    body: LSRRequest,
    current_user: models.User = Depends(require_admin),
):
    """Формирование ЛСР — локальный расчёт на основе позиций сметы (без нейросети)."""
    try:
        result = _generate_lsr_local(body.positions, body.strategy)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка формирования ЛСР: {e}")


@router.post("/compare")
async def compare(
    body: CompareRequest,
    current_user: models.User = Depends(require_admin),
):
    """Сравнение сметы заказчика и нашего ЛСР — локальный расчёт разницы (без нейросети)."""
    try:
        result = _run_compare_local(body.positions, body.lsr)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка сравнения: {e}")
