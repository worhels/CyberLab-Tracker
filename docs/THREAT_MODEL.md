# Threat Model

## Assets

| Asset | Risk |
| --- | --- |
| User account | Unauthorized access |
| JWT access token | Token theft or replay |
| Task data | IDOR or unauthorized reads |
| Subject data | IDOR or unauthorized modification |
| Database credentials | Secret leakage |
| Local `.env` files | Accidental commit |
| API docs | Information disclosure |

## Actors

| Actor | Description |
| --- | --- |
| Legitimate local user | Uses the app locally |
| Unauthenticated attacker | Tries auth abuse |
| Authenticated malicious user | Tries to access another user's data |
| Repository reviewer | Reads public code and docs |
| Accidental developer mistake | Commits secrets or weak defaults |

## Main Threats

### 1. Broken Authentication

Risk:

- weak JWT validation
- missing claims
- trusting token-provided algorithm
- predictable secrets

Mitigation:

- fixed JWT algorithm
- required claims: `sub`, `exp`, `iat`, `type`
- long random `JWT_SECRET_KEY`
- no default production secrets

### 2. IDOR

Risk:

A user requests another user's task or subject by changing an ID.

Mitigation:

Every entity query must filter through the authenticated user's ownership.

Correct task pattern:

```python
task = db.scalar(
    select(Task).join(Subject).where(
        Task.id == task_id,
        Subject.user_id == current_user.id,
    )
)
```

Incorrect pattern:

```python
task = db.scalar(select(Task).where(Task.id == task_id))
```

### 3. Brute-force Login

Risk:

Repeated login attempts against `/auth/login`.

Mitigation:

- rate limit login endpoint
- use a generic auth error
- verify a dummy hash for missing users

### 4. CORS Misconfiguration

Risk:

Overly broad browser access.

Mitigation:

- explicit frontend origins
- explicit methods
- explicit headers
- no wildcard CORS policy

### 5. Secret Leakage

Risk:

Real `.env` values committed to Git.

Mitigation:

- `.env` in `.gitignore`
- safe `.env.example`
- required Docker variables
- no hardcoded JWT or DB passwords

## Accepted Trade-offs

- Local in-memory rate limiting resets when the backend process restarts.
- There is no email verification or password reset flow.
- There is no multi-role authorization model.
- The app is optimized for local review and personal use, not public hosting.
