# Branching And Release Workflow

This repository uses a small-team workflow that keeps the project readable on
GitHub while staying lightweight.

## Permanent Branches

### `main`

Stable branch. Code on `main` should be release-ready and represent the best
current version of the project.

Rules:

- merge through pull requests
- keep CI passing
- do not commit generated files or local logs
- use clear merge history

### `develop`

Integration branch for completed work before it reaches `main`.

Rules:

- feature and fix branches target `develop`
- keep CI passing
- periodically merge `develop` into `main` when the project is ready for a stable
  update

## Working Branches

Use one branch per task:

- `feature/<scope>` for product features
- `fix/<scope>` for bug fixes
- `chore/<scope>` for tooling, documentation, and cleanup

Examples:

```text
feature/task-filter-bar
fix/crisis-completed-filter
chore/repository-hygiene
```

## Pull Request Flow

1. Branch from `develop` for normal work.
2. Make a focused change.
3. Run relevant checks.
4. Open a PR into `develop`.
5. Merge `develop` into `main` for stable release points.

For urgent fixes, branch from `main` and open the PR directly into `main`.

## Commit Guidelines

Good:

```text
filter completed crisis tasks
add project CI workflow
document local startup flow
```

Avoid:

```text
update
fix
final
stuff
```

## Repository Hygiene

Do not commit:

- `.env` files
- local logs
- `node_modules`
- frontend `dist`
- Python caches
- editor state
- generated screenshots unless they are intentional documentation assets
