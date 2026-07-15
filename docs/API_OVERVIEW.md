# API overview

Base path: `/api/v1`.

Authenticated requests use:

```http
Authorization: Bearer <access-token>
```

Interactive OpenAPI, Swagger, and ReDoc are available only when `DEBUG=true`.

## Shared contract rules

### Update and nullable fields

Subject and task update routes preserve their existing `PUT` URLs but use
partial-update semantics:

- omitted property: keep the stored value;
- nullable property set to `null`: clear the stored value;
- required property set to `null`: reject with `422 Unprocessable Entity`.

Required update fields include task `title`, `subject_id`, `type`,
`priority`, and `status`, plus subject `name` and `color`.

Nullable task fields include `description`, `deadline`, `github_url`,
`moodle_url`, `report_file`, `estimated_hours`, `submitted_at`, and
`accepted_at`. Nullable subject fields include `teacher`, `semester`, and
`description`.

Example: clear a deadline while leaving every other field unchanged.

```http
PUT /api/v1/tasks/42
Content-Type: application/json

{"deadline": null}
```

### Timestamps

Datetime request values must be ISO 8601 values with `Z` or an explicit UTC
offset. The API normalizes accepted values to UTC.

```json
{"deadline": "2026-07-15T18:30:00+03:00"}
```

A naive value such as `2026-07-15T18:30:00` is rejected with `422`.
Date-only task-list filters are interpreted as UTC day boundaries. The frontend
calendar groups returned instants in the user's local timezone.

### Errors

FastAPI validation failures use `422` with structured field details.
Application errors use:

```json
{"detail": "Task not found"}
```

| Status | Meaning |
| --- | --- |
| `400` | Invalid request state |
| `401` | Missing, expired, malformed, or otherwise invalid bearer token |
| `404` | Resource does not exist or is not owned by the caller |
| `409` | Unique subject name or email conflict |
| `422` | Request validation failure |
| `429` | Authentication rate limit exceeded |
| `503` | Ollama is unavailable |

Foreign resource IDs intentionally use the same `404` response as missing IDs.

## Auth

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Exchange form credentials for an access token |
| `GET` | `/auth/me` | Return the authenticated user |

Registration passwords must be 8 characters or more and at most 72 UTF-8 bytes,
matching bcrypt's effective input boundary.

Login uses `application/x-www-form-urlencoded` with email in `username`:

```text
username=user@example.com&password=correct-horse-battery-staple
```

Token response:

```json
{"access_token": "<jwt>", "token_type": "bearer"}
```

## Subjects

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/subjects` | List owned subjects |
| `POST` | `/subjects` | Create a subject |
| `GET` | `/subjects/{subject_id}` | Read an owned subject |
| `PUT` | `/subjects/{subject_id}` | Partially update an owned subject |
| `DELETE` | `/subjects/{subject_id}` | Delete a subject and its tasks |

Subject names are unique per user, not globally.

## Tasks

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/tasks` | List owned tasks |
| `POST` | `/tasks` | Create a task under an owned subject |
| `GET` | `/tasks/{task_id}` | Read an owned task |
| `PUT` | `/tasks/{task_id}` | Partially update an owned task |
| `PATCH` | `/tasks/{task_id}/status` | Update only status |
| `DELETE` | `/tasks/{task_id}` | Delete a task |

List filters:

| Query | Type | Behavior |
| --- | --- | --- |
| `status` | task status | Exact status |
| `active_only` | boolean | Exclude accepted work |
| `subject_id` | integer | Owned subject |
| `priority` | priority enum | Exact priority |
| `type` | task type enum | Exact type |
| `deadline_before` | date | Inclusive end of UTC day |
| `deadline_after` | date | Inclusive start of UTC day |
| `search` | string | Title/description match |

Task statuses: `not_started`, `in_progress`, `submitted`, `accepted`,
and `debt`.

## Dashboard

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/dashboard/summary` | Counters, progress, overdue, nearest deadline |
| `GET` | `/dashboard/crisis` | Crisis metrics and ranked tasks |

`/dashboard/crisis` accepts `limit=1..100` and
`include_completed=true|false`. By default it ranks active and debt work and
excludes accepted tasks.

```json
{
  "total_tasks": 5,
  "accepted_tasks": 1,
  "active_tasks": 4,
  "completion_ratio": 0.2,
  "pressure_score": 0.5625,
  "cohesion_score": 0.2,
  "instability_score": 0.5231,
  "severity_counts": {
    "critical": 1,
    "high": 1,
    "medium": 2,
    "low": 0
  },
  "tasks": []
}
```

## Settings

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/settings/me` | Read or lazily create user settings |
| `PATCH` | `/settings/me` | Update provided settings fields |

Settings include language, theme, accent, dashboard density, Crisis visual
visibility, reduced motion, and deadline reminders.

## Export

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/export/json` | Download owned workspace JSON |
| `GET` | `/export/csv` | Download owned workspace UTF-8 CSV |

Both exports include only the authenticated user's subjects and tasks. The CSV
uses a `record_type` column and UTF-8 BOM for spreadsheet compatibility.

## Mentor

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/mentor/chat` | Return a complete Ollama response |
| `POST` | `/mentor/chat/stream` | Stream SSE token events and a final done event |

Requests accept mode `lab|code|report|deadline|chat`, language
`auto|ru|uk|en`, and optional `subject_id` or `task_id`. Optional IDs are
resolved through the current user's ownership before any model request.

Completed user/assistant exchanges are persisted. Interrupted streams are not.
