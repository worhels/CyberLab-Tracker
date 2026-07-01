# Roadmap

CyberLab Tracker is a local-first academic workload tracker. The project is not
an enterprise platform; it is a practical full-stack application with a clear
security hardening path and portfolio-grade repository presentation.

## Current Status

Last updated: July 2, 2026.

Status markers below were audited against the current implementation, automated
tests, and visible GitHub repository metadata.

### Done

- FastAPI backend
- PostgreSQL database
- SQLAlchemy models
- Alembic migrations
- React and TypeScript frontend
- Docker Compose setup
- Authentication base flow
- Dashboard, Subjects, Tasks, Settings, and Crisis Mode pages
- Soft UI redesign with Zerkalo, dark, light, and system theme support
- Light-theme normalization across shell, cards, forms, badges, tables, and task views
- Route-aware pressure-field visual backgrounds
- Automatic viewport/CPU quality tiers for the authentication visual
- Collapsible desktop sidebar and responsive mobile navigation
- Page transitions and route fallback
- Crisis Volume 3D visualization
- Workload sphere and subject hotspot visualization
- Unified subject/task creation surface
- Basic CRUD for subjects and tasks
- Task status updates
- Accessible confirmation dialogs for task and subject deletion
- Task search, priority/type filters, list modes, and pagination
- Dashboard priority queue, subject progress, and recent activity widgets
- User settings model, migration, CRUD layer, API endpoint, and frontend context
- Persisted language, theme, accent color, dashboard density, Crisis Cube,
  reduced motion, and deadline-reminder preferences
- Russian, Ukrainian, and English labels for the settings/app-shell flow
- JWT required claims
- Generic authentication errors
- Auth endpoint rate limiting
- Auth integration coverage for registration, login, token rejection, and rate limits
- Dummy password verification for missing users
- Explicit CORS configuration
- API docs disabled outside debug mode
- Completed-task filtering in Crisis Mode
- Crisis metrics unit coverage
- User settings unit coverage
- Automated subject and task ownership coverage
- Repository CI, docs, issue templates, and security docs

## Phase 0: Security Hardening

Security hardening blocks major feature expansion. The project should keep a
predictable security baseline before adding larger workflows.

### Authentication And JWT

- [x] Use PyJWT
- [x] Use a fixed JWT algorithm
- [x] Add required JWT claims: `sub`, `exp`, `iat`, `type`
- [x] Validate required claims during token decode
- [x] Use `type="access"` for access tokens
- [x] Reject tokens with missing or invalid `type`
- [x] Make token expiration configurable through environment variables
- [x] Return the same auth error for wrong email and wrong password
- [x] Add integration coverage for expired tokens
- [x] Add integration coverage for malformed tokens

### Password Hashing

- [x] Centralize password hashing logic
- [x] Configure bcrypt rounds
- [x] Use dummy hash verification for missing users
- [x] Document password policy expectations

### Rate Limiting

- [x] Add rate limiting to `/auth/login`
- [x] Add rate limiting to `/auth/register`
- [x] Add tests for rate limit behavior
- [x] Consider persistent rate limiting if the app gets deployed beyond local use

### CORS And API Docs

- [x] Use explicit frontend origins
- [x] Use explicit methods
- [x] Use explicit headers
- [x] Disable `/docs`, `/redoc`, and `/openapi.json` unless `DEBUG=true`

### IDOR Audit

- [x] Subject endpoints filter by current user
- [x] Task endpoints filter by current user through subject ownership
- [x] Dashboard queries filter by current user
- [x] Add automated ownership tests for subject access
- [x] Add automated ownership tests for task access

### Docker And Secrets

- [x] Require `POSTGRES_PASSWORD`
- [x] Require `JWT_SECRET_KEY`
- [x] Keep `.env` ignored
- [x] Provide safe `.env.example`
- [x] Keep PostgreSQL off the host port by default
- [x] Document secret rotation for local development

## Phase 1: UI Completion

- [x] Unify spacing, card radius, shadows, buttons, forms, and hover states
- [x] Add loading states across all main pages
- [x] Add empty states across all main data pages
- [x] Add error states across all main data pages
- [x] Improve Tasks page card/table layout
- [x] Improve Subjects page cards and creation flow
- [x] Add subject progress preview on Dashboard
- [x] Improve Settings page form structure
- [x] Add dashboard compact/comfortable density setting
- [x] Add user-controlled visual fallback for Crisis Mode
- [x] Add reduced-motion preference plumbing
- [x] Normalize light theme so dark-scene styles do not leak into light UI
- [x] Add confirmation for destructive actions
- [x] Add automatic viewport/CPU quality selection to the authentication visual
- [ ] Extend automatic performance-aware quality selection to workload and
  Crisis visual effects

## Phase 2: Daily-use Features

### Quick Filters

- [x] Search by task title/description
- [x] Filter by priority
- [x] Filter by task type
- [x] Switch between all/tasks/subjects list modes
- [x] Paginate task results
- [ ] Due today
- [ ] This week
- [ ] Overdue
- [ ] Completed
- [ ] Active
- [ ] Reset filters

### Deadline Signals

- [x] Dashboard overdue count
- [x] Dashboard nearest deadline
- [x] Crisis scoring accounts for overdue, today, tomorrow, and 3-day pressure
- [x] Subject workload severity states account for overdue and near-deadline tasks
- [ ] Deadline in 3 days badge
- [ ] Due today badge
- [ ] Overdue badge
- [ ] Task-level deadline severity styles

### Subject Statistics

- [x] Dashboard subject progress preview
- [x] Accepted/total ratio for top subjects
- [x] Total task count per subject in the workload detail card
- [x] Active task count per subject in the workload hotspot preview
- [ ] Completed tasks per subject in dedicated subject detail view
- [ ] Overdue tasks per subject
- [ ] Accepted/completed ratio in full subject statistics

### Export

- [ ] JSON export endpoint
- [ ] CSV export endpoint
- [ ] Frontend export button
- [ ] Include subjects, tasks, and timestamps

### Calendar View

- [ ] List-based calendar view
- [ ] Group tasks by date
- [ ] Highlight today
- [ ] Highlight overdue tasks
- [ ] Separate tasks without deadlines

## Phase 3: Portfolio Packaging

- [x] README overview and project positioning
- [x] README update for settings, themes, workload visuals, and current UI state
- [x] Architecture docs
- [x] Branching docs
- [x] Contributing guide
- [x] Security policy
- [x] Threat model
- [x] Security model
- [x] API overview
- [x] Development guide
- [x] Changelog
- [x] License
- [x] CI workflow
- [x] CodeQL workflow
- [x] Dependency review workflow
- [ ] Screenshots
- [ ] GitHub About description
- [ ] GitHub topics
- [ ] GitHub Project board
- [ ] Engineering backlog issues

## Phase 4: Tests And Maintainability

- [x] JWT required-claim unit tests
- [x] JWT wrong-token-type rejection test
- [x] JWT missing-claim rejection test
- [x] Crisis metrics unit test
- [x] User settings default/update tests
- [x] Auth integration tests
- [ ] Task CRUD integration tests
- [ ] Subject CRUD integration tests
- [x] Task ownership denial tests
- [x] Subject ownership denial tests
- [ ] Standardize API error responses
- [ ] Split large frontend components
- [x] Add shared PageHeader and EmptyState primitives
- [x] Add reusable Badge and StatCard primitives
- [ ] Consolidate remaining reusable UI primitives
- [ ] Review dead code and unused styles

## Backlog

- Command palette
- Custom themes
- Layout density settings
- Task templates
- Bulk operations
- Multi-select tasks
- Advanced dashboard charts
- Keyboard shortcuts
- Local import from JSON/CSV
- Archive old completed tasks

## Deliberately Out Of Scope

- Public multi-tenant production deployment
- Email verification
- Password reset by email
- Two-factor authentication
- External OAuth providers
- Payment processing
- Admin panel
- Role-based access control
- WebSocket real-time sync
- Google Calendar integration
- Mobile application

## Definition Of Done

A task is done only when:

- the behavior works manually
- relevant automated checks pass
- loading, empty, and error states are considered
- sensitive data is not committed
- documentation is updated when behavior changes
- the change remains scoped to the project phase
