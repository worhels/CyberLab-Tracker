# CyberLab Tracker

Backend MVP for tracking study subjects, tasks, deadlines, statuses, and crisis priority.

## Stack

- FastAPI
- PostgreSQL
- SQLAlchemy
- Alembic
- JWT auth with `python-jose`
- Password hashing with `passlib[bcrypt]`

## Local Backend Run

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

Swagger:

- http://localhost:8000/docs
- http://localhost:8000/health

## Docker Run

```bash
copy .env.example .env
docker compose up --build
docker compose exec backend alembic upgrade head
```

Docker services:

- `backend`
- `postgres`

## API v1

Auth:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

Subjects:

- `GET /api/v1/subjects`
- `POST /api/v1/subjects`
- `GET /api/v1/subjects/{subject_id}`
- `PUT /api/v1/subjects/{subject_id}`
- `DELETE /api/v1/subjects/{subject_id}`

Tasks:

- `GET /api/v1/tasks`
- `POST /api/v1/tasks`
- `GET /api/v1/tasks/{task_id}`
- `PUT /api/v1/tasks/{task_id}`
- `DELETE /api/v1/tasks/{task_id}`
- `PATCH /api/v1/tasks/{task_id}/status`

Dashboard:

- `GET /api/v1/dashboard/summary`
- `GET /api/v1/dashboard/crisis`
