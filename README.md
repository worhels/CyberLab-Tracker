# CyberLab Tracker

Minimal study workload tracker for labs, coursework, debts, deadlines, and academic progress.

## Stack

- FastAPI
- PostgreSQL
- React
- TypeScript
- Three.js
- Tailwind CSS

## Quick Start

Run everything with one command from the project root:

```powershell
.\scripts\dev.ps1
```

If PowerShell blocks local scripts, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev.ps1
```

The script does the local setup for you:

- creates `.env` and `frontend/.env` if they do not exist
- generates local `POSTGRES_PASSWORD` and `JWT_SECRET_KEY` when placeholders are still present
- starts PostgreSQL and the FastAPI backend with Docker Compose
- applies Alembic migrations
- seeds the demo account and demo data
- installs frontend dependencies
- starts the Vite frontend

Open the app:

- App: [http://localhost:5173](http://localhost:5173)
- Login: [http://localhost:5173/login](http://localhost:5173/login)
- Register: [http://localhost:5173/register](http://localhost:5173/register)
- API health: [http://localhost:8000/health](http://localhost:8000/health)

Demo login:

- Email: `demo@cyberlab.dev`
- Password: `password123`

## Useful Script Options

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

## Manual Run

If you do not want to use the script, do the same steps manually.

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

In `.env`:

```env
DEBUG=true
```

Restart the backend:

```powershell
docker compose restart backend
```

Then open:

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- OpenAPI JSON: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

## Troubleshooting

### `POSTGRES_PASSWORD is required`

Use the automated script:

```powershell
.\scripts\dev.ps1
```

It creates `.env` and fills missing local secrets.

### Password authentication failed for user `cyberlab`

This usually means the existing Docker volume was created with a different `POSTGRES_PASSWORD`.

The script tries to synchronize the local PostgreSQL user password automatically. If you want a clean database instead, run:

```powershell
.\scripts\dev.ps1 -ResetDb
```

This deletes local database data.

### `/docs` returns 404

This is expected when `DEBUG=false`. Set `DEBUG=true` in `.env` and restart the backend.

## Stop

Stop frontend with `Ctrl+C` in the Vite terminal.

Stop backend and database:

```powershell
docker compose down
```
