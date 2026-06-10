# CyberLab Tracker

Minimal study workload tracker for labs, coursework, debts, deadlines, and academic progress.

## Stack

- FastAPI
- PostgreSQL
- React
- TypeScript
- Three.js
- Tailwind CSS

## Run Locally

The project starts in two parts:

- backend + PostgreSQL through Docker Compose
- frontend through Vite

### 1. Create backend environment file

From the project root:

```powershell
Copy-Item .env.example .env
```

Open `.env` and set real local values for:

```env
POSTGRES_PASSWORD=your-local-db-password
JWT_SECRET_KEY=your-long-random-local-secret
```

Keep the same `POSTGRES_PASSWORD` for the same Docker database volume. PostgreSQL only uses this value when the volume is created for the first time.

### 2. Start backend and database

```powershell
docker compose up --build -d
```

Apply database migrations:

```powershell
docker compose exec backend alembic upgrade head
```

Optional: seed the demo account and demo study data:

```powershell
docker compose exec backend python -m scripts.seed_demo
```

Check the API:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

### 3. Start frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open the app:

- App: [http://localhost:5173](http://localhost:5173)
- Login: [http://localhost:5173/login](http://localhost:5173/login)
- Register: [http://localhost:5173/register](http://localhost:5173/register)

## Demo Account

Run the seed command first:

```powershell
docker compose exec backend python -m scripts.seed_demo
```

Then sign in with:

- Email: `demo@cyberlab.dev`
- Password: `password123`

## API Docs

API docs are only enabled when `DEBUG=true`.

In `.env`:

```env
DEBUG=true
```

Restart the backend:

```powershell
docker compose restart backend
```

Then open:

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- OpenAPI JSON: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

## Troubleshooting

### `POSTGRES_PASSWORD is required`

`docker compose up --build` fails if `.env` does not exist or `POSTGRES_PASSWORD` is empty.

Fix:

```powershell
Copy-Item .env.example .env
```

Then edit `.env` and set `POSTGRES_PASSWORD` and `JWT_SECRET_KEY`.

### Password authentication failed for user `cyberlab`

This usually means the existing Docker volume was created with a different `POSTGRES_PASSWORD`.

Options:

- Use the same password that was used when the volume was first created.
- Or reset the local database volume. This deletes local database data:

```powershell
docker compose down -v
docker compose up --build -d
docker compose exec backend alembic upgrade head
docker compose exec backend python -m scripts.seed_demo
```

### `/docs` returns 404

This is expected when `DEBUG=false`. Set `DEBUG=true` in `.env` and restart the backend.

## Stop

Stop frontend with `Ctrl+C` in the Vite terminal.

Stop backend and database:

```powershell
docker compose down
```
