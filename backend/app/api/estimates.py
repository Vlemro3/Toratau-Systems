"""
API смет: чтение файла (.xls, .xlsx, .xml), проверка, ЛСР, сравнение.
Парсинг файлов — прямое чтение без нейросети (estimate_file_parser).
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from app.dependencies import require_admin
from app import models
from app.services.estimate_file_parser import parse_estimate_file
from app.services.openai_estimates import (
    check_estimate,
    generate_lsr,
    run_compare,
)

router = APIRouter(prefix="/estimates", tags=["estimates"])


class CheckRequest(BaseModel):
    positions: list[dict]
    region: str = ""


class LSRRequest(BaseModel):
    positions: list[dict]
    strategy: str = "standard"


class CompareRequest(BaseModel):
    positions: list[dict]
    lsr: dict


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


@router.post("/check")
async def check(
    body: CheckRequest,
    current_user: models.User = Depends(require_admin),
):
    """Проверка сметы по позициям (OpenAI)."""
    try:
        result = check_estimate(body.positions, body.region)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Ошибка проверки: {e}")


@router.post("/lsr")
async def lsr(
    body: LSRRequest,
    current_user: models.User = Depends(require_admin),
):
    """Формирование ЛСР по позициям сметы (OpenAI)."""
    try:
        result = generate_lsr(body.positions, body.strategy)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Ошибка формирования ЛСР: {e}")


@router.post("/compare")
async def compare(
    body: CompareRequest,
    current_user: models.User = Depends(require_admin),
):
    """Сравнение сметы заказчика и нашего ЛСР (OpenAI)."""
    try:
        result = run_compare(body.positions, body.lsr)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Ошибка сравнения: {e}")
