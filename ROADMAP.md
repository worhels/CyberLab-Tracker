# Roadmap

CyberLab Tracker is a local-first academic workload tracker. The roadmap keeps
security, data contracts, and release quality gates ahead of feature expansion.

## Current Status

Last updated: July 15, 2026.

Status markers reflect the implementation and automated checks in this branch.
Repository metadata, screenshots, and releases remain incomplete until they are
actually published on GitHub.

### Beta-readiness baseline

- [x] FastAPI, PostgreSQL, SQLAlchemy, Alembic, React, and TypeScript stack
- [x] Authentication, Dashboard, Subjects, Tasks, Calendar, Settings, and Crisis Mode
- [x] Subject and task create, read, update, and delete workflows
- [x] Responsive light/dark UI with mobile navigation and reduced-motion support
- [x] Backend regression suite and frontend unit/component tests
- [x] Strict Pyright and TypeScript checks in CI
- [x] PostgreSQL migration upgrade/parity/downgrade/upgrade job
- [x] Dependency audit, dependency review, CodeQL, and release workflow definitions
- [x] Architecture, API, development, security, threat-model, and beta-release docs

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
- [ ] Replace the in-process rate limiter before multi-instance public deployment

### API Contracts And Data Isolation

- [x] Normalize accepted task datetimes to timezone-aware UTC
- [x] Reject timezone-naive task datetimes
- [x] Reject explicit `null` for required patch fields while preserving documented clears
- [x] Keep subject, task, dashboard, export, and mentor queries user-scoped
- [x] Cover cross-user subject and task access with regression tests
- [x] Include active overdue workload in Crisis debt calculations
- [ ] Standardize the response envelope for all API errors

### Runtime Security

- [x] Use explicit CORS origins, methods, and headers
- [x] Disable OpenAPI UI and schema endpoints unless `DEBUG=true`
- [x] Require database and JWT secrets through deployment configuration
- [x] Keep PostgreSQL off the host port by default
- [x] Document secret rotation and the public-beta deployment boundary
- [ ] Add session revocation and account recovery before a broader hosted beta

## Phase 1: UI Completion

- [x] Complete subject and task CRUD, including edit and destructive confirmation flows
- [x] Extract reusable form dialogs and subject/task field groups
- [x] Keep subject and task views synchronized after mutations
- [x] Add loading, empty, error, filter, and responsive task states
- [x] Preserve theme tokens across light, dark, and system themes
- [x] Add reduced-motion behavior that avoids mounting the Crisis WebGL canvas
- [x] Add mobile-safe Crisis layouts and lower-cost visual quality tiers
- [x] Refactor the largest Subjects and Crisis page responsibilities into components/hooks
- [ ] Continue splitting remaining large WebGL renderer modules
- [ ] Consolidate remaining repeated UI primitives and unused styles

## Phase 2: Daily-use Features

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

## Phase 3: Quality Gates And Packaging

### Automated Quality

- [x] Add backend regression coverage for auth, contracts, ownership, and Crisis debt
- [x] Add frontend unit/component coverage for calendar grouping, filters, formatting,
  deadline badges, and nullable form serialization
- [x] Enable strict TypeScript across application and test configurations
- [x] Run strict Pyright, Ruff, pytest, frontend tests, lint, typecheck, and build in CI
- [x] Audit Python and npm dependencies and update vulnerable packages
- [x] Validate the full Alembic chain against PostgreSQL 16 in CI

### Repository And Release Preparation

- [x] Refresh README, architecture, API, development, security, and threat-model docs
- [x] Add a public-beta release checklist and MIT license assessment
- [x] Add Dependabot configuration and stricter dependency review
- [x] Define a tag-triggered prerelease workflow with frontend artifacts, checksums,
  backend container publishing, and migration validation
- [ ] Publish product screenshots
- [ ] Publish GitHub About description and topics
- [ ] Create the first tagged GitHub prerelease and verify its artifacts
- [ ] Create a GitHub Project board and prioritized engineering backlog

## Post-beta Backlog

- Persistent distributed rate limiting and trusted-proxy handling
- Account recovery, email verification, session revocation, and optional 2FA
- End-to-end browser tests and visual regression coverage
- Import from JSON/CSV and archived completed work
- Bulk operations, task templates, command palette, and keyboard shortcuts
- Advanced workload charts and accessibility audits
- Calendar provider integrations after the local Calendar workflow is stable

## Deliberately Out Of Scope For The Current Beta

- Enterprise multi-tenancy
- Payment processing
- Admin panel and role-based access control
- WebSocket real-time collaboration
- Native mobile applications
- External calendar synchronization

## Definition Of Done

A roadmap item is done only when:

- behavior is implemented and manually reviewable;
- relevant automated checks pass;
- loading, empty, error, responsive, and motion states are considered where applicable;
- data ownership and nullable API semantics remain explicit;
- sensitive data is not committed;
- documentation matches the shipped behavior; and
- external GitHub or release work is marked complete only after publication.
