# Roadmap

CyberLab Tracker is a local-first academic workload tracker. It is intended to
run locally; public internet deployment and hosted-service work are out of
scope. The roadmap keeps security, data contracts, and quality gates ahead of
feature expansion.

## Current Status

Last updated: July 27, 2026.

Status markers reflect the implementation and automated checks in this branch.

### Local-use baseline

- [x] FastAPI, PostgreSQL, SQLAlchemy, Alembic, React, and TypeScript stack
- [x] Authentication, Dashboard, Subjects, Tasks, Calendar, Settings, and Crisis Mode
- [x] Subject and task create, read, update, and delete workflows
- [x] Responsive light/dark UI with mobile navigation and reduced-motion support
- [x] Backend regression suite and frontend unit/component tests
- [x] Strict Pyright and TypeScript checks in CI
- [x] PostgreSQL migration upgrade/parity/downgrade/upgrade job
- [x] Dependency audit, dependency review, and CodeQL
- [x] Architecture, API, development, security, and threat-model docs
- [x] Local Qwen3-Coder Mentor with a reviewed, checksummed bcrypt artifact workflow

## Phase 0: Security And Contract Hardening

### Authentication And Passwords

- [x] Use PyJWT with a fixed `HS256` algorithm and required access-token claims
- [x] Reject missing claims, invalid token types, expired tokens, and malformed tokens
- [x] Require a non-placeholder JWT secret with a minimum safe length
- [x] Make access-token expiration configurable
- [x] Use direct bcrypt hashing with configurable work factor
- [x] Enforce bcrypt's 72-byte password boundary at registration and verification
- [x] Use dummy password verification and generic authentication errors
- [x] Rate-limit registration and login with regression coverage

### API Contracts And Data Isolation

- [x] Normalize accepted task datetimes to timezone-aware UTC
- [x] Reject timezone-naive task datetimes
- [x] Reject explicit `null` for required patch fields while preserving documented clears
- [x] Keep subject, task, dashboard, export, and mentor queries user-scoped
- [x] Cover cross-user subject and task access with regression tests
- [x] Include active overdue workload in Crisis debt calculations
- [x] Standardize the response envelope for all API errors

### Runtime Security

- [x] Use explicit CORS origins, methods, and headers
- [x] Disable OpenAPI UI and schema endpoints unless `DEBUG=true`
- [x] Require database and JWT secrets through deployment configuration
- [x] Keep PostgreSQL off the host port by default
- [x] Document secret rotation and the local-only deployment boundary

## Phase 1: UI Completion

- [x] Complete subject and task CRUD, including edit and destructive confirmation flows
- [x] Extract reusable form dialogs and subject/task field groups
- [x] Keep subject and task views synchronized after mutations
- [x] Add loading, empty, error, filter, and responsive task states
- [x] Preserve theme tokens across light, dark, and system themes
- [x] Add reduced-motion behavior that avoids mounting the Crisis WebGL canvas
- [x] Add mobile-safe Crisis layouts and lower-cost visual quality tiers
- [x] Refactor the largest Subjects and Crisis page responsibilities into components/hooks
- [x] Split WebGL performance/variant configuration from the renderer modules
- [x] Remove obsolete UI selectors without changing the current visual design

## Phase 2: Daily-use Features

### CyberMentor Reliability And Reviewed Artifacts

- [x] Replace the undersized default model with tested `qwen3-coder:30b`
- [x] Disable implicit thinking for predictable chat latency and pass the selected UI language
- [x] Keep chat ownership-scoped and separate from task execution
- [x] Add Build mode for the reviewed `bcrypt-timing-web-v1` template
- [x] Validate a closed model specification and prevent model-selected paths or commands
- [x] Store immutable per-user artifacts with atomic writes, hashes, quotas, and authenticated ZIP download
- [x] Add mocked regression coverage plus an opt-in real Ollama acceptance test
- [x] Implement a fail-closed, non-root, networkless verifier for the reviewed bcrypt template

### Task Workflow

- [x] Search, priority, type, status, deadline, and list-mode filters
- [x] Pagination and one-action filter reset
- [x] Deadline severity badges for overdue, due-today, and near-deadline work
- [x] Dashboard and workload subject statistics
- [x] Authenticated JSON and CSV workspace export

### Calendar

- [x] Add a list-based Calendar route and navigation entry
- [x] Group tasks by local calendar date
- [x] Separate past deadlines, today, upcoming work, and tasks without deadlines
- [x] Keep completed historical tasks visible without counting them as overdue
- [x] Add localized responsive Calendar cards

## Phase 3: Quality Gates

### Automated Quality

- [x] Add backend regression coverage for auth, contracts, ownership, and Crisis debt
- [x] Add frontend unit/component coverage for calendar grouping, filters, formatting,
  deadline badges, and nullable form serialization
- [x] Enable strict TypeScript across application and test configurations
- [x] Run strict Pyright, Ruff, pytest, frontend tests, lint, typecheck, and build in CI
- [x] Add local browser E2E coverage for authentication and core workspace workflows
- [x] Audit Python and npm dependencies and update vulnerable packages
- [x] Validate the full Alembic chain against PostgreSQL 16 in CI

## Local Development Backlog

- [x] Visual regression coverage for authentication and light/dark workspace states
- Import from JSON/CSV and archived completed work
- Bulk operations, task templates, command palette, and keyboard shortcuts
- Advanced workload charts and accessibility audits
- Additional reviewed Mentor templates after sandbox and abuse-control work

## Deliberately Out Of Scope For The Local Version

- Enterprise multi-tenancy
- Payment processing
- Admin panel and role-based access control
- WebSocket real-time collaboration
- Native mobile applications
- External calendar synchronization
- Arbitrary AI repository editing, shell access, or execution inside the API container

## Definition Of Done

A roadmap item is done only when:

- behavior is implemented and manually reviewable;
- relevant automated checks pass;
- loading, empty, error, responsive, and motion states are considered where applicable;
- data ownership and nullable API semantics remain explicit;
- sensitive data is not committed;
- documentation matches the shipped behavior.
