# CyberLab Tracker Workbench

This is the local navigation panel for the laptop workspace.

## One Command

```powershell
.\start.ps1
```

Use this from the project root:

- opens the main project files in VS Code
- starts PostgreSQL and the FastAPI backend
- runs migrations without resetting the current demo task statuses
- writes the live SQL schema to `.vscode/db-schema-live.sql`
- writes table details to `.vscode/db-tables-live.txt`
- starts the Vite frontend in a separate terminal

## Main Areas

- Roadmap: `ROADMAP.md`
- Run/setup: `scripts/dev.ps1`, `scripts/workbench.ps1`, `docker-compose.yml`
- Database migrations: `backend/alembic/versions/0001_initial.py`, `backend/alembic/versions/0002_add_study_tracker_fields.py`
- Backend tables/models: `backend/app/models/user.py`, `backend/app/models/subject.py`, `backend/app/models/task.py`
- Backend API: `backend/app/api/v1/endpoints/auth.py`, `dashboard.py`, `subjects.py`, `tasks.py`
- Frontend pages: `DashboardPage.tsx`, `SubjectsPage.tsx`, `TasksPage.tsx`, `CrisisPage.tsx`
- Main visuals: `CrisisFieldCanvas.tsx`, `CrisisVolumeCube.tsx`, `WorkloadSphereCanvas.tsx`, `workloadMath.ts`
- Frontend API/types: `frontend/src/api`, `frontend/src/types/index.ts`

## Useful Commands

```powershell
.\start.ps1
.\start.ps1 -SkipBackendStart
.\start.ps1 -SkipFrontend
.\start.ps1 -DbOnly
.\start.ps1 -Seed
docker compose ps
docker compose logs -f backend
```

## URLs

- App: http://localhost:5173
- API health: http://localhost:8000/health
- Demo login: `demo@cyberlab.dev` / `password123`
