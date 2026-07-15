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
Local-first study workload control center with FastAPI, React, PostgreSQL, Crisis Mode, Calendar, and optional local AI.
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
calendar
vitest
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

## Beta Backlog Candidates

The setup script intentionally does not create issues automatically. Create only
focused, still-actionable backlog items, for example:

- `[Security] Add distributed rate limiting for multi-instance deployments`
- `[Security] Add session revocation and account recovery`
- `[Operations] Add backup/restore drills and monitoring runbooks`
- `[Frontend] Add end-to-end and visual-regression coverage`
- `[Performance] Profile Crisis Mode on representative low-end devices`
- `[Docs] Publish deployment and privacy-policy guidance`
