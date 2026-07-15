# Security model

## Scope and release posture

CyberLab Tracker protects personal study data in a local-first or controlled
self-hosted environment. The application has a strong portfolio/beta baseline,
but the repository alone is not a production hosting platform.

Safe targets:

- local development;
- a private network;
- a controlled beta behind TLS and a trusted reverse proxy.

Before unrestricted public access, add persistent distributed rate limiting,
centralized monitoring, backups and restore tests, managed secrets, privacy and
retention policies, and deployment-level security headers.

## Authentication flow

1. Registration validates email and password boundaries.
2. The backend hashes the password directly with bcrypt.
3. Login performs a real or dummy bcrypt verification and returns one access
   token.
4. The browser sends `Authorization: Bearer <token>`.
5. The backend validates the signature, fixed algorithm, required claims, token
   type, subject format, and active user before executing owned queries.

## Password hashing

- bcrypt cost is configured with validated `BCRYPT_ROUNDS`;
- passwords are never logged or stored in plain text;
- registration rejects values beyond 72 UTF-8 bytes because bcrypt ignores
  additional bytes;
- the dummy hash keeps missing-user login work comparable to wrong-password
  work;
- existing standard `$2b$` bcrypt hashes remain compatible.

The user-facing password policy is 8 characters minimum and 72 UTF-8 bytes
maximum. Long unique passphrases are preferred over composition rules.

The project does not yet provide email verification, password recovery,
password change, breached-password checks, or session revocation.

## JWT lifecycle

Access tokens contain required `sub`, `exp`, `iat`, and `type="access"`
claims.

Security invariants:

- algorithm is fixed to `HS256` in code and cannot be selected from input or
  environment;
- `JWT_SECRET_KEY` is at least 32 characters;
- expiration is a positive configured duration;
- decode supplies an explicit algorithm allow-list;
- missing/wrong claims, malformed subjects, inactive users, and expired tokens
  all fail authentication.

Rotating the secret intentionally invalidates every issued access token.

The current frontend stores the bearer token in `localStorage`. This is
acceptable for the stated local-first scope but makes XSS equivalent to token
theft. A public deployment should use a reviewed Content Security Policy and
consider short-lived in-memory access tokens with a secure, `HttpOnly`,
`SameSite` refresh/session cookie.

## Authorization and IDOR

Subjects are filtered directly by `Subject.user_id`. Tasks are filtered
through their subject owner. Dashboard, export, settings, and Mentor context
apply the same authenticated-user boundary.

Foreign IDs return `404`, preventing the API from confirming whether another
user's object exists. UI checks are convenience only and never authorization.

## API input contracts

- offset-aware timestamps are normalized to UTC;
- explicit `null` is accepted only for nullable fields;
- required update fields reject `null`;
- request size and schema validation happen before persistence;
- CORS uses explicit origins, methods, and headers;
- API docs are disabled unless `DEBUG=true`.

## Rate limiting

Login and registration use an in-memory limiter and generic credential errors.
The limiter is process-local, resets on restart, trusts the directly observed
client address, and is not sufficient across multiple workers.

A public deployment must use a shared limiter such as Redis and a narrowly
configured trusted-proxy chain. Do not trust arbitrary forwarded IP headers.

## CyberMentor and SSE

Mentor input is untrusted. The model has no SQL or filesystem access and
receives only bounded, ownership-filtered JSON context. Optional task and subject
IDs are resolved before the Ollama request. Completed exchanges are persisted;
interrupted streams are not.

Remaining model risks include prompt injection inside user-authored task text,
resource exhaustion from long streams, sensitive text sent to a remotely
configured Ollama-compatible endpoint, and unsafe reliance on model output.
Deployments should keep Ollama local/trusted, enforce upstream timeouts and body
limits, and never execute model output automatically.

## Export and privacy

JSON and CSV exports contain the caller's study data and timestamps. Responses
must not be cached by shared infrastructure. Users are responsible for exported
files after download. A public beta needs an explicit privacy notice, deletion
policy, retention policy, and backup handling procedure.

## Secrets and rotation

Real `.env` files are ignored. Docker Compose requires database and JWT
secrets. Generate values locally and do not paste them into issues or logs.

JWT rotation:

1. generate a long random value;
2. update the deployment secret;
3. recreate the API;
4. require users to sign in again.

Database password rotation must update the PostgreSQL role first, then the
secret store and dependent services. Resetting the Docker volume is acceptable
only when development data can be discarded.

## Public beta checklist

- [ ] TLS and trusted reverse proxy
- [ ] production CSP and security headers
- [ ] persistent rate limiter
- [ ] centralized logs, metrics, and alerts without sensitive bodies
- [ ] managed secret rotation
- [ ] encrypted backups and restore drill
- [ ] privacy, retention, and deletion policy
- [ ] dependency and container scanning
- [ ] private vulnerability reporting contact
- [ ] review of third-party assets and Ollama model licenses
