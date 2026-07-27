# Development Guide

## Prerequisites

- Docker Desktop
- Node.js 20+
- npm
- Python 3.12+
- PowerShell

## One-command Setup

From the project root:

```powershell
.\scripts\dev.ps1
```

This command creates local env files, starts Docker services, applies migrations,
seeds demo data, installs frontend dependencies, and starts Vite.

## Environment Files

Root backend/database environment:

```powershell
Copy-Item .env.example .env
```

Frontend environment:

```powershell
Copy-Item frontend\.env.example frontend\.env
```

The development script creates these files automatically when they are missing.

## Docker

Start backend and database:

```powershell
docker compose up --build -d
```

Stop backend and database:

```powershell
docker compose down
```

Reset local database volume:

```powershell
docker compose down -v
```

## Migrations

Apply migrations:

```powershell
docker compose exec backend alembic upgrade head
```

Check model/migration parity and reversibility:

```powershell
docker compose exec backend alembic check
docker compose exec backend alembic downgrade base
docker compose exec backend alembic upgrade head
```

Create a migration after model changes:

```powershell
docker compose exec backend alembic revision --autogenerate -m "describe change"
```

## Seed Data

Seed demo data:

```powershell
docker compose exec backend python -m scripts.seed_demo
```

Demo login:

```text
demo@cyberlab.dev / password123
```

## Backend Commands

Install dev dependencies:

```powershell
cd backend
python -m pip install -r requirements-dev.txt
```

Run checks:

```powershell
ruff check .
pyright
pytest
python -m compileall app scripts alembic
```

## Frontend Commands

```powershell
cd frontend
npm ci
npm run dev
npm test
npm run typecheck
npm run lint
npm run build
npm audit
```

The API accepts only offset-aware task timestamps. Use `Z` or an explicit
offset in direct API calls; the frontend converts `datetime-local` values to an
ISO 8601 instant before submission.

## Local End-to-End Tests

Install the Chromium test browser once, then run the suite:

```powershell
cd frontend
npx playwright install chromium
npm run test:e2e
```

The Playwright configuration starts a dedicated FastAPI process on port `8001`
and Vite on port `4173`. The backend uses a temporary SQLite database under
`output/playwright/`; it does not read, migrate, or reset the normal PostgreSQL
database. Ollama warmup is disabled. Failure screenshots and traces are also
kept under `output/playwright/`, which is ignored by Git.

The local E2E suite covers authentication protection and error display,
registration, subject/task creation, Calendar visibility, and account Settings
visibility. It uses reduced motion to avoid depending on WebGL rendering and
does not assert or modify visual styling.

## Troubleshooting

### `POSTGRES_PASSWORD is required`

Run:

```powershell
.\scripts\dev.ps1
```

The script creates `.env` and fills missing local secrets.

### Password authentication failed for user `cyberlab`

The existing Docker volume probably has a different password. Run:

```powershell
.\scripts\dev.ps1 -ResetDb
```

### `/docs` returns 404

Set `DEBUG=true` in `.env`, then restart backend:

```powershell
docker compose restart backend
```
