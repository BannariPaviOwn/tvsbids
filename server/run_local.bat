@echo off
REM Local dev: uses SQLite via .env.local (no Neon needed). Run from project root or server/
cd /d "%~dp0"
if not exist .env.local (
  echo DATABASE_URL=> .env.local
  echo Created .env.local for SQLite
)
echo Seeding local SQLite database...
python -m seed_data --local
echo.
echo Starting backend on http://127.0.0.1:8000
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
