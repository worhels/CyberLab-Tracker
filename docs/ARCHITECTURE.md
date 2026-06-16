# Architecture

CyberLab Tracker is a full-stack local-first study workload tracker. The backend
owns authentication, task data, dashboard summaries, and crisis ranking. The
frontend owns navigation, task workflows, visual dashboards, and interactive
presentation.

## Runtime View

```text
Browser
  |
  | HTTP / JSON
  v
React + Vite frontend
  |
  | /api/v1/*
  v
FastAPI backend
  |
  | SQLAlchemy ORM
  v
PostgreSQL
```

## Backend

The FastAPI application lives in `backend/app`.

- `app/main.py` creates the FastAPI app, CORS middleware, health endpoint, and
  API router.
- `app/api/v1/endpoints` contains route handlers for auth, subjects, tasks, and
  dashboard data.
- `app/crud` contains persistence operations.
- `app/models` contains SQLAlchemy models and enums.
- `app/schemas` contains Pydantic request and response models.
- `app/core` contains settings and security helpers.
- `alembic/versions` contains database migrations.

The backend uses `DATABASE_URL` from environment settings. In Docker Compose this
points to the `postgres` service.

## Frontend

The React application lives in `frontend/src`.

- `api` wraps backend HTTP calls.
- `pages` contains route-level UI screens.
- `components` contains shared UI, auth, and visualization components.
- `layouts` contains application chrome.
- `context` contains authentication state.
- `styles` contains design tokens and shared CSS.
- `utils` contains formatting and error helpers.

The frontend reads `VITE_API_BASE_URL` from `frontend/.env`.

## Data Model

Core entities:

- `User`: account and authentication owner.
- `Subject`: academic subject owned by a user.
- `Task`: lab, practice, coursework, exam, or other work item attached to a
  subject.

Task status values:

- `not_started`
- `in_progress`
- `submitted`
- `accepted`
- `debt`

`accepted` is the completed state.

## Crisis Mode

Crisis Mode is calculated by the backend dashboard endpoint. It ranks tasks using
a score derived from:

- overdue or near deadline state
- debt status
- priority
- estimated work hours
- task type
- current progress status

The default Crisis Mode response excludes completed tasks. Passing
`include_completed=true` returns the full ranked list.

## Security Boundaries

The application uses a local-first security model:

- authentication is handled by JWT access tokens
- passwords are hashed with bcrypt
- API routes resolve the current user from the bearer token
- subject queries filter directly by `Subject.user_id`
- task queries filter through subject ownership
- CORS is restricted to configured frontend origins
- API docs are disabled unless `DEBUG=true`

See [SECURITY_MODEL.md](SECURITY_MODEL.md) and [THREAT_MODEL.md](THREAT_MODEL.md)
for details.

## Local Development

`scripts/dev.ps1` is the primary local workflow. It prepares environment files,
starts Docker services, applies migrations, seeds demo data, installs frontend
dependencies, and launches Vite.

## Quality Gates

GitHub Actions runs:

- backend dependency install and Python compile check
- frontend dependency install, lint, and production build

Pull requests should also include manual smoke-test notes when UI or data-flow
behavior changes.
