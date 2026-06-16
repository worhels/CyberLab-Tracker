# Contributing

## Development Flow

1. Start from an up-to-date `develop` branch for normal feature work.
2. Create a focused branch:

   ```powershell
   git switch develop
   git pull
   git switch -c feature/short-description
   ```

3. Keep commits scoped and readable.
4. Run the relevant checks before opening a pull request.
5. Open a pull request into `develop`, unless the change is an urgent production fix.

## Branch Names

- `feature/<scope>` for product features
- `fix/<scope>` for bug fixes
- `chore/<scope>` for tooling, docs, and repository maintenance

Use short lowercase names with hyphens, for example `feature/task-filters`.

## Commit Style

Use imperative, specific commit messages:

```text
filter completed crisis tasks
add project CI workflow
document branch strategy
```

Avoid vague messages such as `updates`, `fix`, or `misc`.

## Checks

Backend:

```powershell
cd backend
python -m pip install -r requirements-dev.txt
ruff check .
pytest
python -m compileall app scripts alembic
```

Frontend:

```powershell
cd frontend
npm ci
npm run typecheck
npm run lint
npm run build
```

Local app smoke test:

```powershell
.\scripts\dev.ps1
```

## Pull Requests

Every pull request should include:

- what changed
- why it changed
- how it was validated
- screenshots or recordings when UI behavior changes

Do not commit local logs, generated build output, personal `.env` files, or editor
state.

## Security Work

Use `SECURITY.md`, `docs/SECURITY_MODEL.md`, and `docs/THREAT_MODEL.md` when
changing authentication, authorization, CORS, Docker secrets, or ownership
checks. Security-related pull requests should explain the risk being reduced and
the validation used.
