# Changelog

All notable changes to CyberLab Tracker are documented here.

## Unreleased

### Added

- A shared, backward-compatible API error envelope for HTTP and Mentor SSE
  errors, with stable machine codes and structured validation details.
- Local Playwright E2E coverage for authentication, registration, subject/task
  creation, Calendar visibility, and Settings, backed by an isolated SQLite
  test server and CI gate.
- A fail-closed rootless/networkless Mentor verifier design covering protocol,
  platform attestation, sandbox limits, cleanup, and acceptance tests.
- A CyberMentor Build mode for the reviewed `bcrypt-timing-web-v1` artifact.
- Strict artifact specification validation, trusted template rendering, atomic
  per-user storage, SHA-256 manifests, ownership checks, quotas, and authenticated
  attachment-only ZIP downloads.
- Backend artifact security/functional regressions, frontend Mentor unit tests,
  and an opt-in real Ollama acceptance test that executes the reviewed bcrypt
  prototype with `demo-password`.

### Changed

- Frontend error parsing now understands the shared API envelope while keeping
  field-level validation messages and legacy `detail` support.
- Replaced `qwen2.5-coder:7b` with the empirically selected
  `qwen3-coder:30b` default for both chat and artifact planning.
- Disabled model thinking in chat payloads, made context length configurable,
  and honored an explicitly selected Mentor language instead of always
  auto-detecting it.
- Updated CyberMentor architecture, API, security, threat-model, roadmap, and
  setup documentation.

### Security

- The model still has no SQL, repository, shell, or arbitrary filesystem access.
  Artifact HTML/JavaScript is never rendered on the CyberLab origin, and the
  product does not execute model output.
- The bcrypt prototype limits input to 72 UTF-8 bytes, restricts rounds to
  10–13, redacts invalid password input, and returns no password or digest.

## 0.1.0-beta.1 — July 15, 2026

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
- Made the Tasks workload visual lazy-loaded and replaced WebGL with an
  accessible static summary on mobile, low-tier, and reduced-motion clients.
- Updated vulnerable Python and npm dependencies and removed the obsolete
  Passlib dependency.
- Refreshed README, roadmap, architecture, API, development, security, threat
  model, contribution, and release documentation for the beta-readiness baseline.
- Strengthened dependency review so moderate-or-higher findings fail the gate.
- Prepared release frontend bundles for a same-origin `/api/v1` reverse proxy
  and included the MIT notice in both frontend and backend distributions.

### Fixed

- Required update fields can no longer be accidentally persisted as `null`.
- Task deadlines no longer depend on server-local timezone interpretation.
- Completed historical Calendar items remain visible without being reported as overdue.
- Mobile Crisis layouts no longer require the full desktop rendering workload.
- Mobile and reduced-motion task views no longer load the Three.js workload canvas.

### Removed

- The unused Crisis visual reference asset with unclear provenance.
- Passlib and its incompatible bcrypt compatibility layer.
