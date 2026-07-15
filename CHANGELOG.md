# Changelog

All notable changes to CyberLab Tracker are documented here.

## Unreleased — July 15, 2026

### Added

- A responsive list-based Calendar page that groups past deadlines, today,
  upcoming work, and tasks without deadlines.
- Complete subject and task edit workflows backed by reusable form dialogs and
  field components.
- Backend regression coverage for JWT configuration, bcrypt boundaries,
  timezone-aware task contracts, nullable patch fields, ownership, and Crisis debt.
- Frontend unit/component coverage for calendar grouping, task filters, date
  formatting, deadline badges, and nullable form serialization.
- A PostgreSQL 16 migration CI job that upgrades to head, checks model parity,
  downgrades to base, and upgrades again.
- Strict Pyright, TypeScript typecheck, Python/npm dependency audits, frontend
  tests, and production build gates in CI.
- Dependabot configuration and a tag-triggered prerelease workflow for frontend
  artifacts, checksums, a backend container image, and migration validation.
- A public-beta checklist covering deployment prerequisites and MIT license limits.
- English Dashboard, task CRUD, and Calendar screenshots for the repository product tour.
- GitHub About metadata, topics, security-update automation, and private vulnerability reporting.

### Changed

- Replaced Passlib integration with direct bcrypt usage, configurable rounds,
  and explicit enforcement of bcrypt's 72-byte input boundary.
- Hardened JWT configuration to a fixed algorithm and rejected short or known
  placeholder secrets.
- Normalized task datetimes to timezone-aware UTC and rejected timezone-naive input.
- Tightened partial-update schemas so required fields reject explicit `null`
  while optional fields retain documented clear semantics.
- Included active overdue workload in Crisis debt calculations.
- Refactored Subjects, task/subject forms, and Crisis presentation into smaller
  components and hooks without changing public API routes.
- Made Crisis visuals responsive to reduced-motion settings and lower-capability
  mobile devices; reduced motion now avoids mounting the WebGL canvas.
- Updated vulnerable Python and npm dependencies and removed the obsolete
  Passlib dependency.
- Refreshed README, roadmap, architecture, API, development, security, threat
  model, contribution, and release documentation for the beta-readiness baseline.
- Strengthened dependency review so moderate-or-higher findings fail the gate.

### Fixed

- Required update fields can no longer be accidentally persisted as `null`.
- Task deadlines no longer depend on server-local timezone interpretation.
- Completed historical Calendar items remain visible without being reported as overdue.
- Mobile Crisis layouts no longer require the full desktop rendering workload.

### Removed

- The unused Crisis visual reference asset with unclear provenance.
- Passlib and its incompatible bcrypt compatibility layer.

### Pending Publication

- No tagged prerelease or GitHub release artifact has been published yet.
