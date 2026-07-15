# Security policy

## Supported version

| Version | Supported |
| --- | --- |
| Latest `main` | Yes |
| Older commits and feature branches | No |

## Reporting a vulnerability

Do not open a public issue containing exploit details, credentials, personal
data, or unreleased vulnerability information.

Use GitHub's **Security -> Report a vulnerability** form for confidential
reports. Include:

- affected commit or version;
- impacted endpoint/component;
- reproduction steps or a minimal proof of concept;
- expected security impact;
- any suggested mitigation.

Use normal GitHub Issues only for non-sensitive hardening work.

## Response expectations

This is a maintainer-run open-source project, not a commercial security program.
Reports will be acknowledged when maintainer capacity allows. Confirmed issues
will be fixed on a private branch when practical, then disclosed with an
appropriate release note or advisory.

## Scope

In scope:

- authentication and JWT validation;
- password hashing and rate-limit bypass;
- IDOR or cross-user data access;
- export/settings/Mentor ownership failures;
- injection or unsafe execution;
- secret exposure from repository code or workflows;
- dependency or migration paths that compromise user data.

Out of scope:

- denial-of-service testing against a maintainer-hosted instance;
- social engineering;
- attacks requiring access to the user's already-compromised machine;
- issues only in optional third-party Ollama models;
- missing enterprise features already documented as beta limitations.

## Deployment posture

CyberLab Tracker is intended for local use and controlled beta evaluation. It
does not claim that cloning the repository alone creates a production-safe
public service. Review [the security model](docs/SECURITY_MODEL.md) and
[threat model](docs/THREAT_MODEL.md) before any network deployment.
