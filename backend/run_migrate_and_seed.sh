#!/bin/sh
set -e
echo "Waiting for DB..."
sleep 2
cd /app
alembic upgrade head
python seed.py
echo "Migrations and seed done."
