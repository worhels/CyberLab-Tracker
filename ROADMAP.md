# CyberLab Tracker — Roadmap

**CyberLab Tracker** — личный study/task tracker для контроля предметов, задач, дедлайнов и кризисных периодов.

Проект не строится как enterprise-система. Цель — рабочее, безопасное, визуально приятное приложение для личного использования и портфолио.

## Цель проекта

Сделать локальный трекер, который помогает:

* видеть текущую нагрузку по предметам;
* контролировать дедлайны;
* быстро находить просроченные и критичные задачи;
* отслеживать прогресс по учебным предметам;
* визуализировать состояние нагрузки через Crisis Mode;
* безопасно хранить данные локально.

## Текущий стек

### Backend

* FastAPI
* PostgreSQL
* SQLAlchemy
* Alembic
* Pydantic
* JWT authentication
* Docker Compose

### Frontend

* React
* TypeScript
* Vite
* Axios
* React Router
* R3F / Three.js for 3D visualization
* Dark Soft Neumorphism UI

---

# Current Status

## Done

* [x] FastAPI backend
* [x] PostgreSQL database
* [x] SQLAlchemy models
* [x] Alembic migrations
* [x] React + TypeScript frontend
* [x] Docker Compose setup
* [x] Authentication base flow
* [x] Dashboard page
* [x] Subjects page
* [x] Tasks page
* [x] Settings page
* [x] Crisis Mode page
* [x] Dark Soft Neumorphism redesign
* [x] Sidebar redesign
* [x] Dashboard stat cards
* [x] Dashboard progress blocks
* [x] Priority Queue
* [x] Subject Progress section
* [x] Crisis Volume Cube 3D visualization
* [x] Basic CRUD for subjects and tasks

---

# Phase 0 — Security Hardening

Security hardening blocks new feature development.
Before adding new functionality, the project must have a clean and predictable security baseline.

## Authentication and JWT

* [ ] Replace `python-jose` with `PyJWT`
* [ ] Use a fixed JWT algorithm, for example `HS256`
* [ ] Do not trust token-provided algorithm values
* [ ] Add required JWT claims:

  * `sub`
  * `exp`
  * `iat`
  * `type`
* [ ] Validate required claims during token decode
* [ ] Use `type="access"` for access tokens
* [ ] Reject tokens with missing or invalid `type`
* [ ] Make token expiration configurable through environment variables
* [ ] Return the same auth error for wrong email and wrong password

## Login timing attack mitigation

* [ ] Add dummy password hash verification when user does not exist
* [ ] Keep login response timing similar for:

  * non-existing user
  * wrong password
  * valid user with wrong credentials
* [ ] Avoid messages like `user not found`
* [ ] Use a generic error message:

  * `Incorrect email or password`

## Password hashing

* [ ] Explicitly configure bcrypt rounds
* [ ] Use `bcrypt__rounds=12`
* [ ] Keep password hashing logic centralized
* [ ] Avoid duplicated password verification code

## Rate limiting

* [ ] Add rate limiting to `/auth/login`
* [ ] Add rate limiting to `/auth/register`
* [ ] Suggested limits:

  * `/auth/login`: `5/minute`
  * `/auth/register`: `3/minute`
* [ ] Verify rate limiting works with `APIRouter`
* [ ] Ensure limited endpoints explicitly accept `request: Request`
* [ ] Add basic manual checks for repeated failed login attempts

## CORS hardening

* [ ] Remove wildcard CORS methods
* [ ] Remove wildcard CORS headers
* [ ] Use explicit frontend origins only
* [ ] Suggested local origins:

  * `http://localhost:5173`
  * `http://127.0.0.1:5173`
* [ ] Suggested allowed methods:

  * `GET`
  * `POST`
  * `PUT`
  * `PATCH`
  * `DELETE`
  * `OPTIONS`
* [ ] Suggested allowed headers:

  * `Authorization`
  * `Content-Type`

## Docker Compose hardening

* [ ] Remove default value for `JWT_SECRET_KEY`
* [ ] Remove default value for `POSTGRES_PASSWORD`
* [ ] Use required environment variables with `:?`
* [ ] Add safe `.env.example`
* [ ] Do not commit real `.env`
* [ ] Make sure `.env` is listed in `.gitignore`
* [ ] Remove exposed PostgreSQL port from host machine
* [ ] Keep PostgreSQL available only inside Docker network

Example:

```yaml
JWT_SECRET_KEY: ${JWT_SECRET_KEY:?JWT_SECRET_KEY is required}
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
```

## API docs hardening

* [ ] Disable `/docs` when `DEBUG=False`
* [ ] Disable `/redoc` when `DEBUG=False`
* [ ] Disable `/openapi.json` when `DEBUG=False`
* [ ] Keep API docs available in local development only

## IDOR audit

Every endpoint that accepts an entity ID must filter by the current authenticated user.

### Subjects

* [ ] `GET /subjects/{id}`
* [ ] `PATCH /subjects/{id}`
* [ ] `PUT /subjects/{id}`
* [ ] `DELETE /subjects/{id}`

### Tasks

* [ ] `GET /tasks/{id}`
* [ ] `PATCH /tasks/{id}`
* [ ] `PUT /tasks/{id}`
* [ ] `DELETE /tasks/{id}`

### Dashboard and statistics

* [ ] Check endpoints that accept `subject_id`
* [ ] Check endpoints that accept `task_id`
* [ ] Check all filtering logic uses `current_user.id`

Correct pattern:

```python
task = db.query(Task).filter(
    Task.id == task_id,
    Task.user_id == current_user.id,
).first()
```

Incorrect pattern:

```python
task = db.query(Task).filter(Task.id == task_id).first()
```

## Input validation

* [ ] Add length validation for subject names
* [ ] Add length validation for task titles
* [ ] Add length validation for task descriptions
* [ ] Validate priority values
* [ ] Validate status values
* [ ] Validate due date format
* [ ] Prevent empty required fields
* [ ] Return consistent validation errors

## Security documentation

* [ ] Create `SECURITY.md`
* [ ] Document current threat model
* [ ] Document known security decisions
* [ ] Document what is intentionally out of scope
* [ ] Document completed security fixes

---

# Phase 1 — UI Completion

The goal of this phase is to finish the current visual system and make all pages feel consistent.

## Global UI system

* [ ] Unify spacing between pages
* [ ] Unify card radius
* [ ] Unify shadows
* [ ] Unify form styling
* [ ] Unify button styling
* [ ] Unify hover states
* [ ] Unify active states
* [ ] Unify disabled states
* [ ] Unify loading states
* [ ] Unify empty states
* [ ] Unify error states

## Sidebar

* [x] Floating pill sidebar
* [x] Squircle icons
* [ ] Active route state polish
* [ ] Collapsed state polish, if needed
* [ ] Mobile behavior check, if needed

## Dashboard

* [x] StatCard redesign
* [x] Progress section
* [x] Priority Queue
* [x] Subject Progress
* [ ] Empty state when there are no tasks
* [ ] Empty state when there are no subjects
* [ ] Error state when API request fails
* [ ] Loading skeletons
* [ ] Better visual hierarchy for critical tasks

## Crisis Mode

* [x] Crisis Volume Cube
* [x] 3D particle-based visual state
* [x] Core/mid/edge particle layers
* [x] Slow rotation
* [x] Mouse parallax
* [x] Bloom effect for core particles
* [ ] Add fallback for low-performance devices
* [ ] Add empty state if there is no task data
* [ ] Add short explanation of what the cube represents
* [ ] Optimize animation if performance drops

## Tasks page

* [ ] Redesign task list in soft-card style
* [ ] Add consistent task item layout
* [ ] Add visual priority indicator
* [ ] Add visual deadline indicator
* [ ] Add overdue state
* [ ] Add due today state
* [ ] Add completed task state
* [ ] Add loading state
* [ ] Add empty state
* [ ] Add API error state
* [ ] Improve task form styling
* [ ] Improve edit task modal/form styling

## Subjects page

* [ ] Redesign subjects as large soft cards
* [ ] Add subject progress preview
* [ ] Add task count per subject
* [ ] Add debt/overdue count per subject
* [ ] Add empty state
* [ ] Add loading state
* [ ] Add error state
* [ ] Improve create subject form
* [ ] Improve edit subject form

## Settings page

* [ ] Redesign forms in the same soft-card style
* [ ] Add clear section separation
* [ ] Add validation states
* [ ] Add saved state
* [ ] Add error state
* [ ] Add consistent buttons
* [ ] Add danger zone if destructive actions are added later

## Forms and feedback

* [ ] Add form-level validation
* [ ] Add field-level validation
* [ ] Add clear API error messages
* [ ] Add success feedback after create/update/delete
* [ ] Add confirmation for destructive actions
* [ ] Avoid silent failures

---

# Phase 2 — Daily-use Features

This phase contains small features that improve daily usefulness.
Features should be implemented one by one, not all at once.

## Priority 1 — Quick Filters

* [ ] Add `Due today` filter
* [ ] Add `This week` filter
* [ ] Add `Overdue` filter
* [ ] Add `Completed` filter
* [ ] Add `Active` filter
* [ ] Add filter reset button
* [ ] Keep filter state simple and predictable

Reason:

Quick filters give the biggest practical value for the least complexity.

## Priority 2 — Smart Deadline Alerts

* [ ] Add `deadline in 3 days` badge
* [ ] Add `due today` badge
* [ ] Add `overdue` badge
* [ ] Add visual severity levels
* [ ] Use badges only inside the app
* [ ] Do not add email notifications
* [ ] Do not add push notifications

Reason:

The project should warn about critical tasks without adding unnecessary infrastructure.

## Priority 3 — Subject Statistics

* [ ] Add total tasks per subject
* [ ] Add completed tasks per subject
* [ ] Add active tasks per subject
* [ ] Add overdue tasks per subject
* [ ] Add accepted/completed ratio
* [ ] Add debt indicator
* [ ] Show statistics on subject cards
* [ ] Reuse statistics on dashboard where possible

Reason:

Subject-level statistics make the app more useful for study planning.

## Priority 4 — Export

* [ ] Add export to JSON
* [ ] Add export to CSV
* [ ] Add backend export endpoint
* [ ] Add frontend export button
* [ ] Include subjects
* [ ] Include tasks
* [ ] Include timestamps
* [ ] Keep export simple
* [ ] No cloud sync
* [ ] No scheduled backups

Reason:

Export is useful as a local backup and looks good in a portfolio project.

## Priority 5 — Calendar View

* [ ] Add list-based calendar view
* [ ] Group tasks by date
* [ ] Highlight today
* [ ] Highlight overdue tasks
* [ ] Show tasks without deadlines separately
* [ ] Do not build a complex monthly grid at first
* [ ] Reuse existing task cards if possible

Reason:

Calendar view is useful, but it can grow in complexity.
The first version should be simple and list-based.

---

# Phase 3 — Portfolio Packaging

This phase exists because the repository is public.
The goal is to make the project understandable for another developer or interviewer.

## README

* [ ] Add clear project description
* [ ] Add feature list
* [ ] Add tech stack
* [ ] Add local setup instructions
* [ ] Add environment variable instructions
* [ ] Add screenshots
* [ ] Add demo credentials if seed data supports them
* [ ] Add project status section
* [ ] Add roadmap link
* [ ] Add security note

## Screenshots

Required screenshots:

* [ ] Login page
* [ ] Dashboard
* [ ] Tasks page
* [ ] Subjects page
* [ ] Crisis Mode
* [ ] Settings page

Optional screenshots:

* [ ] Before/after UI redesign
* [ ] Empty states
* [ ] Overdue task state
* [ ] Crisis Volume Cube close-up

## Architecture diagram

* [ ] Add architecture diagram
* [ ] Show React frontend
* [ ] Show FastAPI backend
* [ ] Show PostgreSQL database
* [ ] Show Docker Compose network
* [ ] Show JWT auth flow
* [ ] Save diagram as image in repository
* [ ] Link diagram from README

Suggested tools:

* Excalidraw
* draw.io
* Mermaid

## SECURITY.md

* [ ] Add project threat model
* [ ] Explain single-user local-first scope
* [ ] Explain JWT security decisions
* [ ] Explain password hashing
* [ ] Explain CORS policy
* [ ] Explain Docker secrets
* [ ] Explain IDOR protection
* [ ] Explain what is intentionally excluded

## Integration tests

Target: small number of meaningful tests, not artificial coverage.

* [ ] Test user registration
* [ ] Test user login
* [ ] Test task creation
* [ ] Test task access by owner
* [ ] Test task access denial for another user
* [ ] Test subject CRUD basic flow

Recommended minimum:

* [ ] Auth integration test
* [ ] Task CRUD integration test
* [ ] IDOR protection test

## Demo seed data

* [ ] Keep demo seed script
* [ ] Add demo subjects
* [ ] Add demo tasks
* [ ] Add overdue task
* [ ] Add due today task
* [ ] Add completed task
* [ ] Add crisis-level task distribution
* [ ] Document how to run seed script

---

# Phase 4 — Cleanup and Maintainability

This phase is for keeping the codebase clean after the main functionality works.

## Backend cleanup

* [ ] Remove duplicated CRUD logic
* [ ] Keep auth logic centralized
* [ ] Keep settings centralized
* [ ] Keep database session handling consistent
* [ ] Keep response schemas consistent
* [ ] Remove unused imports
* [ ] Remove dead code
* [ ] Review naming consistency

## Frontend cleanup

* [ ] Split large components
* [ ] Move reusable UI parts into shared components
* [ ] Move API calls into API layer
* [ ] Keep page components focused
* [ ] Remove unused styles
* [ ] Remove unused state
* [ ] Review TypeScript types
* [ ] Avoid duplicated card layouts

## Error handling

* [ ] Standardize backend error responses
* [ ] Standardize frontend error display
* [ ] Handle expired token
* [ ] Handle failed network request
* [ ] Handle empty backend data
* [ ] Handle form validation errors

## Developer experience

* [ ] Add simple backend run instructions
* [ ] Add simple frontend run instructions
* [ ] Add Docker Compose run instructions
* [ ] Add database migration instructions
* [ ] Add seed script instructions
* [ ] Add troubleshooting section

---

# Backlog — Optional Polish

These features are not part of the core roadmap.
They should not be started until Security, UI Completion, Daily-use Features and Portfolio Packaging are done.

* [ ] Command palette
* [ ] Custom themes
* [ ] Layout density settings
* [ ] Drag and drop subject reorder
* [ ] Drag and drop task reorder
* [ ] Task templates
* [ ] Bulk operations
* [ ] Multi-select tasks
* [ ] Undo/redo
* [ ] Advanced dashboard charts
* [ ] Keyboard shortcuts
* [ ] Local import from JSON/CSV
* [ ] Archive old completed tasks

---

# Deliberately Out of Scope

These features are intentionally excluded because they do not match the current project scope.

## Not planned

* CI/CD pipeline
* GitHub Actions deployment workflow
* 80% test coverage requirement
* WebSocket real-time sync
* Google Calendar integration
* Email verification
* Password reset through email
* Two-factor authentication
* Load testing for 100+ concurrent users
* Redis caching
* Production deployment
* Multi-tenant architecture
* Admin panel
* Role-based access control
* Public user registration for real users
* Payment system
* Mobile application

## Reasoning

CyberLab Tracker is currently a personal local-first project.

The project does not need:

* infrastructure for non-existing traffic;
* production-grade email flow;
* real-time multi-device synchronization;
* large-scale caching;
* enterprise authorization;
* complex deployment automation.

The priority is to keep the project:

* useful;
* understandable;
* secure enough for its scope;
* easy to run locally;
* strong enough for portfolio review.

---

# Recommended Work Order

The current recommended order:

1. Finish Security Hardening.
2. Complete UI consistency.
3. Add quick filters.
4. Add smart deadline alerts.
5. Add subject statistics.
6. Add export.
7. Add simple calendar view.
8. Prepare portfolio documentation.
9. Add small integration tests.
10. Clean up backend and frontend structure.

---

# Definition of Done

A phase is considered done only when:

* the feature works manually;
* there are no obvious console errors;
* there are no obvious backend errors;
* UI state is handled for loading, empty and error cases;
* code is not duplicated unnecessarily;
* sensitive data is not committed;
* README or relevant documentation is updated if behavior changed.

---

# Project Philosophy

CyberLab Tracker should remain a focused personal productivity tool.

The project should avoid fake enterprise complexity.
Every feature must either:

* improve daily usage;
* improve security;
* improve maintainability;
* improve portfolio value.

If a feature does not satisfy one of these conditions, it belongs in the backlog or should be excluded.
