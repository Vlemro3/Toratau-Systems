# Toratau Backend

FastAPI + SQLAlchemy 2 + PostgreSQL. Все маршруты без префикса `/api` (Vite proxy убирает `/api` при проксировании).

## Локальный запуск (без Docker)

1. PostgreSQL 16 должен быть запущен (например `docker-compose up -d db`).
2. Создайте `.env` из `.env.example`, укажите `DATABASE_URL`.
3. Виртуальное окружение и зависимости:
   ```bash
   python3 -m venv .venv
   .venv/bin/pip install -r requirements.txt
   ```
4. Миграции и seed:
   ```bash
   export PYTHONPATH=$PWD
   alembic upgrade head
   python seed.py
   ```
5. Запуск:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Запуск через Docker

```bash
docker-compose up --build
```

Backend поднимется после готовности БД, выполнит миграции и seed, затем запустит uvicorn.

## Демо-данные (seed)

- Портал: `demo`
- Логины: `owner` / `owner123`, `admin` / `admin123`, `foreman` / `foreman123`
- Суперадмин: из `.env` (`SUPERADMIN_LOGIN` / `SUPERADMIN_PASSWORD`), по умолчанию `superadmin` / `superadmin123`
- Вход суперадмина: `POST /super-admin/login` (отдельно от портального логина)

## Переменные окружения

- `DATABASE_URL` — строка подключения PostgreSQL
- `SECRET_KEY` — ключ для JWT
- `SUPERADMIN_LOGIN`, `SUPERADMIN_PASSWORD` — логин/пароль суперадмина
- `DEFAULT_PORTAL_SLUG` — портал по умолчанию при логине без `portal_slug` (по умолчанию `demo`)
