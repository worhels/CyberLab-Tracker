# API Overview

Base path:

```text
/api/v1
```

Authentication uses bearer tokens:

```text
Authorization: Bearer <access_token>
```

## Auth

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Create a user |
| `POST` | `/auth/login` | Exchange credentials for an access token |
| `GET` | `/auth/me` | Read the current authenticated user |

## Subjects

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/subjects` | List current user's subjects |
| `POST` | `/subjects` | Create a subject |
| `GET` | `/subjects/{subject_id}` | Read a subject |
| `PUT` | `/subjects/{subject_id}` | Update a subject |
| `DELETE` | `/subjects/{subject_id}` | Delete a subject |

## Tasks

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/tasks` | List current user's tasks |
| `POST` | `/tasks` | Create a task |
| `GET` | `/tasks/{task_id}` | Read a task |
| `PUT` | `/tasks/{task_id}` | Update a task |
| `PATCH` | `/tasks/{task_id}/status` | Update only task status |
| `DELETE` | `/tasks/{task_id}` | Delete a task |

Task list filters:

- `status`
- `active_only` (exclude accepted tasks)
- `subject_id`
- `priority`
- `type`
- `deadline_before`
- `deadline_after`
- `search`

## Dashboard

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/dashboard/summary` | Read dashboard counters and progress |
| `GET` | `/dashboard/crisis` | Read Crisis Mode metrics and ranked active tasks |

`/dashboard/crisis` query parameters:

- `limit`: result limit from 1 to 100
- `include_completed`: include `accepted` tasks when `true`

By default, Crisis Mode excludes completed tasks.

Response shape:

```json
{
  "total_tasks": 5,
  "accepted_tasks": 3,
  "active_tasks": 2,
  "completion_ratio": 0.6,
  "pressure_score": 0.3375,
  "cohesion_score": 0.6,
  "instability_score": 0.2666,
  "severity_counts": {
    "critical": 0,
    "high": 0,
    "medium": 2,
    "low": 0
  },
  "tasks": []
}
```

`tasks` contains the active list for Crisis Mode. The metrics are calculated from
all tasks so the visual state can represent total completion progress.

## API Docs

Interactive API docs are available only when `DEBUG=true`:

- `/docs`
- `/redoc`
- `/openapi.json`
