# GitHub Repository Setup

This file documents the repository settings that cannot be fully represented by
tracked source files.

If GitHub CLI is installed and authenticated, run:

```powershell
.\scripts\github_setup.ps1
```

## About

Description:

```text
Full-stack local-first academic workload tracker with FastAPI, PostgreSQL, React, Docker, CI, and security hardening roadmap.
```

Website:

Leave empty until a real deployment, demo, or GitHub Pages documentation site is
available.

Topics:

```text
fastapi
react
typescript
postgresql
docker
sqlalchemy
alembic
jwt-authentication
security-hardening
devsecops
github-actions
portfolio-project
threejs
react-three-fiber
```

## Labels

Create these labels:

```text
type: feature
type: bug
type: chore
type: docs
type: refactor
type: test
area: backend
area: frontend
area: security
area: ci
area: docs
area: ui
area: database
priority: high
priority: medium
priority: low
status: blocked
status: ready
status: in-progress
```

## Project Board

Project name:

```text
CyberLab Tracker Engineering Board
```

Views:

- Board: Backlog, Ready, In Progress, Review, Done, Blocked
- Security Hardening: filter by `area: security`
- UI Polish: filter by `area: frontend` and `area: ui`
- Roadmap: timeline or roadmap view

## Initial Issues

Security:

- `[Security] Harden JWT validation`
- `[Security] Add login/register rate limiting`
- `[Security] Add dummy password verification for missing users`
- `[Security] Audit IDOR protection for subjects and tasks`
- `[Security] Remove unsafe Docker defaults`
- `[Security] Add SECURITY.md and threat model`

Backend:

- `[Backend] Add auth integration tests`
- `[Backend] Add task ownership tests`
- `[Backend] Standardize API error responses`
- `[Backend] Add export endpoint for JSON/CSV`

Frontend:

- `[Frontend] Add loading, empty, and error states`
- `[Frontend] Redesign Tasks page cards`
- `[Frontend] Redesign Subjects page cards`
- `[Frontend] Add quick filters for tasks`
- `[Frontend] Add deadline severity badges`

Docs:

- `[Docs] Add screenshots to README`
- `[Docs] Add architecture diagram`
- `[Docs] Expand local development guide`
- `[Docs] Add API overview`
- `[Docs] Add changelog`
