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
| `GET` | `/dashboard/crisis` | Read ranked active crisis tasks |

`/dashboard/crisis` query parameters:

- `limit`: result limit from 1 to 100
- `include_completed`: include `accepted` tasks when `true`

By default, Crisis Mode excludes completed tasks.

## API Docs

Interactive API docs are available only when `DEBUG=true`:

- `/docs`
- `/redoc`
- `/openapi.json`
