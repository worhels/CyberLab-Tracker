# Security Policy

## Project Scope

CyberLab Tracker is a local-first personal productivity tracker.

It is not designed as a public SaaS, enterprise platform, or multi-tenant
production system.

The current security focus is:

- safe authentication flow
- JWT validation
- password hashing
- CORS hardening
- rate limiting for auth endpoints
- IDOR prevention
- local secret management
- predictable Docker development setup

## Supported Versions

| Branch | Status |
| --- | --- |
| `main` | Supported |
| `develop` | Development |
| `feature/*` | Not supported |
| `fix/*` | Not supported |
| `chore/*` | Not supported |

## Reporting A Vulnerability

This is a portfolio and local-first project.

Do not report security issues through public issues if the report contains
exploit details, secrets, or sensitive data.

For normal code hardening tasks, use GitHub Issues with the `area: security`
label.

## Known Security Boundaries

This project currently does not include:

- email verification
- password reset by email
- two-factor authentication
- role-based access control
- public multi-user production deployment
- payment processing
- external OAuth providers

These features are intentionally out of scope for the current project phase.

## Security Checklist

Current security hardening priorities:

- keep JWT validation explicit
- require JWT claims
- keep login/register rate limiting enabled
- mitigate login timing attacks
- enforce per-user ownership checks
- avoid unsafe Docker defaults
- disable API docs outside local debug mode
- document accepted security trade-offs
