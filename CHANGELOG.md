# Changelog

All notable changes to CyberLab Tracker are documented here.

## Unreleased

### Added

- Repository CI workflow.
- CodeQL workflow.
- Dependency review workflow.
- Issue templates and pull request template.
- Security policy.
- Threat model.
- Security model documentation.
- API overview documentation.
- Development guide.
- Repository setup guide for GitHub About, topics, labels, issues, and project board.
- MIT license.
- Integration coverage for auth token failures, registration/login, rate limiting,
  and per-user subject/task ownership.
- Password policy, persistent rate-limit deployment boundary, and local secret
  rotation documentation.
- Accessible confirmation dialogs for task and subject deletion, including
  cascade warnings for subjects.
- Task quick filters for due today, this week, overdue, completed, and active
  work, with one-action filter reset.
- Task-level deadline badges for overdue, due-today, and three-day warning states.
- Full subject and task CRUD integration coverage.
- Selected-subject statistics for active, completed, overdue, critical, and
  near-deadline work.

### Changed

- Reworked README for portfolio review.
- Reworked roadmap into a clean phased engineering plan.
- Documented Crisis Mode completed-task filtering.
- Made backend tests use an isolated in-memory database and safe test-only
  configuration when run outside Docker.
- Kept task and subject lists synchronized after confirmed subject deletion.
- Audited roadmap completion markers against the current implementation and
  visible GitHub repository metadata.
- Added an `active_only` task query filter so deadline views exclude accepted
  work.
- Replaced compressed mobile task-table rows with labeled, readable task cards.

### Removed

- Committed local development logs.
