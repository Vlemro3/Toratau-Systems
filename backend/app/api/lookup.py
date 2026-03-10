"""
Proxy-эндпоинты для DaData API — автозаполнение по ИНН и БИК.
API-ключ хранится на сервере, фронтенд вызывает наши endpoints.
"""
import logging
from fastapi import APIRouter, HTTPException, Depends
import httpx

from app.config import settings
from app.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/lookup", tags=["Lookup"])

DADATA_BASE = "https://suggestions.dadata.ru/suggestions/api/4_1/rs"


def _dadata_headers() -> dict:
    return {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Token {settings.dadata_api_key}",
    }


@router.get("/inn/{inn}")
async def lookup_by_inn(inn: str, _user=Depends(get_current_user)):
    """Найти организацию/ИП по ИНН через DaData."""
    if not settings.dadata_api_key:
        raise HTTPException(503, "DaData API ключ не настроен")

    inn = inn.strip()
    if not inn.isdigit() or len(inn) not in (10, 12):
        raise HTTPException(400, "ИНН должен содержать 10 или 12 цифр")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{DADATA_BASE}/findById/party",
                json={"query": inn},
                headers=_dadata_headers(),
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as e:
        logger.error("DaData INN lookup error: %s %s", e.response.status_code, e.response.text[:300])
        raise HTTPException(502, "Ошибка запроса к DaData")
    except Exception as e:
        logger.error("DaData INN lookup exception: %s", str(e))
        raise HTTPException(502, "Ошибка соединения с DaData")

    suggestions = data.get("suggestions", [])
    if not suggestions:
        return {"found": False}

    s = suggestions[0]
    d = s.get("data", {})
    name = d.get("name", {})
    management = d.get("management", {})
    address = d.get("address", {})

    org_type_map = {"LEGAL": "legal", "INDIVIDUAL": "ip"}
    detected_type = org_type_map.get(d.get("type", ""), "legal")

    ogrn_date_raw = d.get("ogrn_date")
    ogrn_date = ""
    if ogrn_date_raw:
        try:
            from datetime import datetime
            dt = datetime.fromtimestamp(ogrn_date_raw / 1000)
            ogrn_date = dt.strftime("%d.%m.%Y")
        except Exception:
            pass

    result = {
        "found": True,
        "org_type": detected_type,
        "name": name.get("short_with_opf") or name.get("full_with_opf") or s.get("value", ""),
        "full_name": name.get("full_with_opf", ""),
        "inn": d.get("inn", inn),
        "kpp": d.get("kpp", ""),
        "ogrn": d.get("ogrn", ""),
        "ogrn_date": ogrn_date,
        "address": address.get("unrestricted_value") or address.get("value", ""),
        "director_title": management.get("post", ""),
        "director_name": management.get("name", ""),
    }
    return result


@router.get("/bik/{bik}")
async def lookup_by_bik(bik: str, _user=Depends(get_current_user)):
    """Найти банк по БИК через DaData."""
    if not settings.dadata_api_key:
        raise HTTPException(503, "DaData API ключ не настроен")

    bik = bik.strip()
    if not bik.isdigit() or len(bik) != 9:
        raise HTTPException(400, "БИК должен содержать 9 цифр")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{DADATA_BASE}/findById/bank",
                json={"query": bik},
                headers=_dadata_headers(),
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as e:
        logger.error("DaData BIK lookup error: %s %s", e.response.status_code, e.response.text[:300])
        raise HTTPException(502, "Ошибка запроса к DaData")
    except Exception as e:
        logger.error("DaData BIK lookup exception: %s", str(e))
        raise HTTPException(502, "Ошибка соединения с DaData")

    suggestions = data.get("suggestions", [])
    if not suggestions:
        return {"found": False}

    s = suggestions[0]
    d = s.get("data", {})

    result = {
        "found": True,
        "bik": d.get("bic", bik),
        "bank_name": s.get("value", ""),
        "corr_account": d.get("correspondent_account", ""),
        "bank_address": d.get("address", {}).get("unrestricted_value", "") if isinstance(d.get("address"), dict) else d.get("address", {}).get("value", "") if isinstance(d.get("address"), dict) else "",
    }

    if isinstance(d.get("address"), dict):
        result["bank_address"] = d["address"].get("unrestricted_value") or d["address"].get("value", "")

    return result
