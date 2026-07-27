# Development Guide

## Prerequisites

- Docker Desktop
- Node.js 20+
- npm
- Python 3.12+
- PowerShell
- Ollama with the configured local model (optional with `-NoOllama`)

## One-command Setup

From the project root:

```powershell
.\scripts\dev.ps1
```

On Windows, `Launch CyberLab.cmd` provides the same full-stack startup by double
click and opens the app automatically.

The launcher starts Docker Desktop when needed, PostgreSQL, the API, Ollama, and
Vite. It applies migrations, seeds demo data, and installs frontend dependencies
only when the lockfile changes. Service output is stored under `.dev/logs`
instead of flooding the console. Press `Ctrl+C` to stop the supervised stack.

Useful variants:

```powershell
.\scripts\dev.ps1 -NoOllama
.\scripts\dev.ps1 -KeepServices
.\scripts\dev.ps1 -BackendOnly
```

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
and Vite on port `4173`. The backend starts a disposable, pinned PostgreSQL 16
container with an in-memory data directory, applies the full Alembic chain, and
removes that exact container after the suite. It does not read, migrate, or
reset the normal PostgreSQL database. Docker must be running. Ollama warmup is
disabled. Failure screenshots and traces are kept under `output/playwright/`,
which is ignored by Git.

The local E2E suite covers authentication protection and error display,
registration, subject/task creation, Calendar visibility, and account Settings
visibility. Stable Playwright screenshots protect the login card and the
Subjects workspace in both light and dark themes; animations and the optional
Crisis cube are disabled only for deterministic capture.

## Local Mentor Verifier

Build the pinned verifier image and run the opt-in live acceptance test:

```powershell
Set-Location backend
python -m scripts.build_verifier
$env:RUN_VERIFIER_TESTS = "1"
pytest -m verifier tests/test_mentor_verifier_live.py
```

Verify an existing owned artifact by its local user and artifact IDs:

```powershell
Set-Location backend
python -m scripts.verify_artifact --user-id 42 --artifact-id <artifact-uuid>
```

The supervisor accepts rootless Docker or Docker Desktop's Linux VM, resolves
the built image to its immutable ID, attests the sandbox, and executes only the
image's fixed reviewed test entrypoint. The artifact mount and root filesystem
are read-only; networking and capabilities are disabled; UID/GID, memory, CPU,
PID, temporary storage, output, and wall time are bounded.

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
