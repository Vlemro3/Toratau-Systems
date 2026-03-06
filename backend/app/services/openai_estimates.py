"""
Сервис анализа смет с помощью Anthropic Claude.
Проверка сметы, формирование ЛСР, сравнение.
Чтение/распознавание файлов выполняется в estimate_file_parser.py (без нейросети).
"""
import json
import re
from typing import Any

from app.config import settings


def _get_anthropic_client():
    from anthropic import Anthropic
    if not settings.anthropic_api_key:
        raise ValueError("ANTHROPIC_API_KEY не задан. Укажите в .env для работы с нейросетью.")
    return Anthropic(api_key=settings.anthropic_api_key)


CHECK_SYSTEM = """You are an expert in estimate verification. Based on the given estimate positions, determine:
1) totalSum — total estimate sum (RUB),
2) marketEstimate — realistic market total (RUB),
3) potentialOverprice, potentialOverpricePct — potential overpricing in RUB and %,
4) riskLevel — "low" | "medium" | "high",
5) errors — array of { positionNum, type, description, recommendation }; type one of: arithmetic | wrong_norm | wrong_unit | overpriced | suspicious_coeff.
Return ONLY valid JSON with keys: totalSum, marketEstimate, potentialOverprice, potentialOverpricePct, errorsCount, riskLevel, errors."""

LSR_SYSTEM = """You are an expert in forming local estimate rates (LSR). From the customer estimate positions, build our rates:
For each position output: num, name, unit, volume, materials, labor, machines (direct cost components), directCost, overhead, profit, total.
Aggregates: totalDirect, totalMaterials, totalLabor, totalMachines, totalOverhead, totalProfit, grandTotal.
Return ONLY valid JSON: { "positions": [ { num, name, unit, volume, materials, labor, machines, directCost, overhead, profit, total } ], "totalDirect", "totalMaterials", "totalLabor", "totalMachines", "totalOverhead", "totalProfit", "grandTotal" }."""

COMPARE_SYSTEM = """You are an expert in estimate comparison. Given customer estimate positions and our LSR, produce a comparison:
rows — array of { num, name, customerSum, ourSum, diffRub, diffPct }; plus totalCustomer, totalOur, totalDiff, marginality (%), possibleProfit.
Return ONLY valid JSON with keys: rows, totalCustomer, totalOur, totalDiff, marginality, possibleProfit."""


def _parse_json_from_response(raw: str) -> dict[str, Any]:
    """Parse JSON from Claude response; fix common invalid JSON (trailing commas, single-quoted keys, etc.)."""
    match = re.search(r"\{[\s\S]*\}", raw)
    s = match.group(0) if match else raw
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        pass
    s = re.sub(r",\s*(\]|\})", r"\1", s)
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        pass
    s = re.sub(r"'([^']*)'\s*:", r'"\1":', s)
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        pass
    s = re.sub(r"([\{\,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:", r'\1"\2":', s)
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        pass
    for key in (
        "num", "normCode", "name", "unit", "volume", "price", "total", "overhead", "profit",
        "positions", "adjustmentCoeff", "recalcCoeffNumber", "laborPersonHours", "costPerUnitFromStart",
        "id", "materials", "labor", "machines", "directCost", "totalDirect", "totalMaterials",
        "totalLabor", "totalMachines", "totalOverhead", "totalProfit", "grandTotal",
        "totalSum", "marketEstimate", "potentialOverprice", "potentialOverpricePct",
        "errorsCount", "riskLevel", "errors", "positionNum", "type", "description", "recommendation",
        "rows", "totalCustomer", "totalOur", "totalDiff", "marginality", "possibleProfit",
        "customerSum", "ourSum", "diffRub", "diffPct",
    ):
        s = re.sub(rf'\b{re.escape(key)}\s*:', rf'"{key}":', s)
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        pass
    raise ValueError(
        "Не удалось разобрать ответ нейросети как JSON. Попробуйте повторить запрос."
    )


def _call_claude(system: str, user_content: str, max_tokens: int = 4096) -> dict[str, Any]:
    client = _get_anthropic_client()
    content = user_content[:150000] if len(user_content) > 150000 else user_content
    resp = client.messages.create(
        model=settings.anthropic_estimate_model,
        max_tokens=max_tokens,
        system=system,
        messages=[
            {"role": "user", "content": content},
        ],
        temperature=0.1,
    )
    text = ""
    for block in resp.content:
        if block.type == "text":
            text += block.text
    text = text.strip()
    return _parse_json_from_response(text)


def _safe_float(val: Any, default: float = 0) -> float:
    if val is None:
        return default
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def check_estimate(positions: list[dict], region: str = "") -> dict[str, Any]:
    """Проверка сметы: возвращает CheckResult."""
    user = f"Регион: {region}. Позиции:\n{json.dumps(positions, ensure_ascii=False, indent=0)}"
    out = _call_claude(CHECK_SYSTEM, user)
    return {
        "totalSum": float(out.get("totalSum") or 0),
        "marketEstimate": float(out.get("marketEstimate") or 0),
        "potentialOverprice": float(out.get("potentialOverprice") or 0),
        "potentialOverpricePct": int(out.get("potentialOverpricePct") or 0),
        "errorsCount": len(out.get("errors") or []),
        "riskLevel": out.get("riskLevel") or "medium",
        "errors": out.get("errors") or [],
    }


def generate_lsr(positions: list[dict], strategy: str = "standard") -> dict[str, Any]:
    """Формирование ЛСР по позициям сметы."""
    user = f"Стратегия: {strategy}. Позиции сметы:\n{json.dumps(positions, ensure_ascii=False, indent=0)}"
    out = _call_claude(LSR_SYSTEM, user)
    positions_lsr = out.get("positions") or []
    for i, p in enumerate(positions_lsr):
        p["id"] = i + 1
    return {
        "positions": positions_lsr,
        "totalDirect": float(out.get("totalDirect") or 0),
        "totalMaterials": float(out.get("totalMaterials") or 0),
        "totalLabor": float(out.get("totalLabor") or 0),
        "totalMachines": float(out.get("totalMachines") or 0),
        "totalOverhead": float(out.get("totalOverhead") or 0),
        "totalProfit": float(out.get("totalProfit") or 0),
        "grandTotal": float(out.get("grandTotal") or 0),
    }


def run_compare(positions: list[dict], lsr: dict[str, Any]) -> dict[str, Any]:
    """Сравнение сметы заказчика и нашего ЛСР."""
    user = f"Позиции сметы заказчика:\n{json.dumps(positions, ensure_ascii=False)}\n\nНаш ЛСР:\n{json.dumps(lsr, ensure_ascii=False)}"
    return _call_claude(COMPARE_SYSTEM, user)
