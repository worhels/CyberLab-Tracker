# CyberLab Tracker

[![CI](https://github.com/worhels/CyberLab-Tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/worhels/CyberLab-Tracker/actions/workflows/ci.yml)

CyberLab Tracker is a full-stack study workload tracker for labs, coursework, debts,
deadlines, and academic progress. It combines a FastAPI/PostgreSQL backend with a
React/TypeScript workspace UI and a dedicated Crisis Mode for prioritizing the
highest-risk tasks.

## Product Scope

- Track subjects, labs, practice work, coursework, exams, and debts.
- Prioritize urgent academic work with Crisis Mode scoring.
- Store task metadata such as deadlines, status, priority, links, reports, and estimates.
- Provide a demo account and seeded local data for fast review.
- Run the whole project locally with one PowerShell command.

## Stack

| Area | Technology |
| --- | --- |
| Backend | FastAPI, SQLAlchemy 2, Alembic |
| Database | PostgreSQL 16 |
| Frontend | React, TypeScript, Vite |
| Visuals | Three.js, React Three Fiber, Framer Motion |
| Styling | Tailwind CSS, custom CSS tokens |
| Tooling | Docker Compose, PowerShell dev script, GitHub Actions |

## Repository Layout

```text
.
|-- backend/              # FastAPI app, SQLAlchemy models, Alembic migrations
|-- frontend/             # React/Vite client
|-- scripts/              # Local developer automation
|-- docs/                 # Architecture and workflow documentation
|-- .github/              # CI, issue templates, PR template
|-- docker-compose.yml    # PostgreSQL + backend services
|-- .env.example          # Root backend/database environment template
`-- README.md
```

## Quick Start

Run everything from the project root:

```powershell
.\scripts\dev.ps1
```

If PowerShell blocks local scripts:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev.ps1
```

The script will:

- create `.env` and `frontend/.env` when missing
- generate local `POSTGRES_PASSWORD` and `JWT_SECRET_KEY` values
- start PostgreSQL and the FastAPI backend with Docker Compose
- apply Alembic migrations
- seed the demo user and demo data
- install frontend dependencies
- start the Vite frontend

Open:

- App: [http://localhost:5173](http://localhost:5173)
- API health: [http://localhost:8000/health](http://localhost:8000/health)

Demo account:

- Email: `demo@cyberlab.dev`
- Password: `password123`

## Useful Commands

Reset the local Docker database volume and start fresh:

```powershell
.\scripts\dev.ps1 -ResetDb
```

Start without reseeding demo data:

```powershell
.\scripts\dev.ps1 -NoSeed
```

Start without running `npm install`:

```powershell
.\scripts\dev.ps1 -SkipInstall
```

Start only PostgreSQL and backend:

```powershell
.\scripts\dev.ps1 -BackendOnly
```

Run frontend checks manually:

```powershell
cd frontend
npm ci
npm run lint
npm run build
```

Run a backend syntax check:

```powershell
python -m compileall backend\app backend\scripts backend\alembic
```

## Manual Run

Create environment files:

```powershell
Copy-Item .env.example .env
Copy-Item frontend\.env.example frontend\.env
```

Edit `.env` and set:

```env
POSTGRES_PASSWORD=your-local-db-password
JWT_SECRET_KEY=your-long-random-local-secret
```

Start backend and database:

```powershell
docker compose up --build -d
docker compose exec backend alembic upgrade head
docker compose exec backend python -m scripts.seed_demo
```

Start frontend:

```powershell
cd frontend
npm install
npm run dev
```

## API Docs

API docs are only enabled when `DEBUG=true`.

Set this in `.env`:

```env
DEBUG=true
```

Restart backend:

```powershell
docker compose restart backend
```

Then open:

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- OpenAPI JSON: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

## Branching Model

This repository uses a simple project workflow:

- `main` is stable and release-ready.
- `develop` is the integration branch for completed work before release.
- `feature/<scope>` is for product work.
- `fix/<scope>` is for bug fixes.
- `chore/<scope>` is for repository, tooling, and maintenance work.

See [docs/BRANCHING.md](docs/BRANCHING.md) for the full workflow.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Branching and PR workflow](docs/BRANCHING.md)
- [Contributing](CONTRIBUTING.md)

## Troubleshooting

### `POSTGRES_PASSWORD is required`

Use the automated script:

```powershell
.\scripts\dev.ps1
```

It creates `.env` and fills missing local secrets.

### Password authentication failed for user `cyberlab`

This usually means the existing Docker volume was created with a different
`POSTGRES_PASSWORD`.

The script tries to synchronize the local PostgreSQL user password automatically.
If you want a clean database instead, run:

```powershell
.\scripts\dev.ps1 -ResetDb
```

### `/docs` returns 404

This is expected when `DEBUG=false`. Set `DEBUG=true` in `.env` and restart the
backend.

## Stop

Stop frontend with `Ctrl+C` in the Vite terminal.

Stop backend and database:

```powershell
docker compose down
```
