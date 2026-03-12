#!/usr/bin/env python3
"""Seed demo portal and superadmin. Run after migrations."""
import os
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models
from app.auth import get_password_hash
from app.config import settings


def seed():
    db = SessionLocal()
    try:
        portal = db.query(models.Portal).filter(models.Portal.slug == "demo").first()
        if portal:
            print("Demo portal already exists, skipping seed.")
            return

        portal = models.Portal(
            slug="demo",
            name="Демо портал",
            owner_email="owner@demo.local",
            status="active",
        )
        db.add(portal)
        db.flush()

        for username, password, full_name, role in [
            ("owner", "owner123", "Владелец", "admin"),
            ("admin", "admin123", "Ахметов Рустам", "admin"),
            ("foreman", "foreman123", "Сергеев Дмитрий", "foreman"),
        ]:
            user = models.User(
                username=username,
                hashed_password=get_password_hash(password),
                full_name=full_name,
                role=role,
                is_active=True,
                portal_id=portal.id,
            )
            db.add(user)
            db.flush()
            if role == "foreman":
                break

        foreman = db.query(models.User).filter(
            models.User.portal_id == portal.id,
            models.User.username == "foreman",
        ).first()
        project = models.Project(
            portal_id=portal.id,
            name='ЖК «Солнечный»',
            address="ул. Центральная, 45",
            client="ООО «Стройинвест»",
            start_date=date(2025, 9, 1),
            end_date=date(2026, 6, 30),
            status="in_progress",
            contract_amount=5_000_000,
            planned_cost=3_800_000,
            notes="Многоквартирный дом, 3 подъезда",
        )
        db.add(project)
        db.flush()
        if foreman:
            db.add(models.UserProject(user_id=foreman.id, project_id=project.id))

        for name, contact, phone, notes in [
            ("Бригада Иванова", "Иванов С.П.", "+7 900 111-22-33", "Общестроительные работы"),
            ("Бригада Петрова", "Петров А.В.", "+7 900 444-55-66", "Отделочные работы"),
            ("Электрики Сидорова", "Сидоров И.К.", "+7 900 777-88-99", "Электромонтаж"),
        ]:
            db.add(models.Crew(
                portal_id=portal.id,
                name=name,
                contact=contact,
                phone=phone,
                notes=notes,
                is_active=True,
            ))
        db.flush()

        for name, unit, rate, category in [
            ("Штукатурка стен", "м²", 350, "Отделочные"),
            ("Укладка плитки", "м²", 500, "Отделочные"),
            ("Электромонтаж", "шт", 800, "Электромонтаж"),
            ("Покраска стен", "м²", 200, "Отделочные"),
            ("Стяжка пола", "м²", 450, "Общестроительные"),
            ("Демонтаж", "м²", 150, "Общестроительные"),
        ]:
            db.add(models.WorkType(
                portal_id=portal.id,
                name=name,
                unit=unit,
                rate=rate,
                category=category,
                is_active=True,
            ))

        superadmin_user = db.query(models.User).filter(
            models.User.username == settings.superadmin_login,
            models.User.role == "superAdmin",
        ).first()
        if not superadmin_user:
            db.add(models.User(
                username=settings.superadmin_login,
                hashed_password=get_password_hash(settings.superadmin_password),
                full_name="Super Admin",
                role="superAdmin",
                is_active=True,
                portal_id=None,
            ))
        else:
            superadmin_user.hashed_password = get_password_hash(settings.superadmin_password)

        db.commit()
        print("Seed completed: demo portal (owner/admin/foreman), superadmin.")

        # --- Backfill: добавить контакты по умолчанию во все порталы ---
        _ensure_default_crews(db)

    finally:
        db.close()


DEFAULT_CREWS = [
    {
        "name": 'ООО "ИДЕАЛСТРОЙИНВЕСТ"',
        "contact": "Черная Яна",
        "phone": "+7 (917) 360-00-91",
        "notes": "Аутсорсинг производственно-технического отдела с предоставлением инженеров ПТО на объект. Исполнительная документация, сдача объектов.",
    },
    {
        "name": 'ООО "ТРУДОГОУ"',
        "contact": "Хасанова Ольга",
        "phone": "+7 (903) 311-13-05",
        "notes": "Разнорабочие, подсобники, погрузка/разгрузка. Аутсорсинг рабочего персонала по всей России: услуги разнорабочих и грузчиков для строительных компаний и бизнеса. Погрузка/разгрузка",
    },
]


def _ensure_default_crews(db):
    """Add default crew contacts to every portal that doesn't have them yet."""
    portals = db.query(models.Portal).all()
    added = 0
    for portal in portals:
        for crew_data in DEFAULT_CREWS:
            exists = db.query(models.Crew).filter(
                models.Crew.portal_id == portal.id,
                models.Crew.name == crew_data["name"],
            ).first()
            if not exists:
                db.add(models.Crew(
                    portal_id=portal.id,
                    name=crew_data["name"],
                    contact=crew_data["contact"],
                    phone=crew_data["phone"],
                    notes=crew_data["notes"],
                    is_active=True,
                ))
                added += 1
    if added:
        db.commit()
        print(f"Default crews backfill: added {added} crew(s) across {len(portals)} portal(s).")
    else:
        print("Default crews backfill: all portals already have default crews.")


if __name__ == "__main__":
    seed()
