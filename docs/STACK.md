# Stack Guide

> **Source of truth for this project's concrete technologies, tools, and conventions.**
>
> The SDD pipeline (phases, gates, skills, contracts) is stack-agnostic. This file is the only
> place where the workflow learns what to actually run. The `phase-gate` playbook reads
> [`Gate Commands`](#gate-commands) below verbatim — keep that table accurate.
>
> **Stack status:** CONFIGURED

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI 0.115+ / Python 3.13 / SQLAlchemy 2.0 async / asyncpg / Alembic |
| Frontend | React Router v7 / TypeScript / pnpm |
| Database | PostgreSQL (asyncpg in production, aiosqlite in tests) |
| Cache | — |
| Infra | Docker Compose / Nginx |
| Package managers | uv (backend), pnpm (frontend) |
| CI | — |

---

## Prerequisites

```bash
# python --version  # >= 3.13
# node --version    # >= 22
# uv --version
# pnpm --version    # >= 10
# docker --version  # Docker Desktop required on WSL2
```

---

## Initial setup

```bash
uv sync --dev
cd frontend && pnpm install
docker compose up --build
# Migrations + seeding run automatically inside the backend container on startup (entrypoint.sh).
# No manual step needed.
```

> **Docker is mandatory.** Never start services (uvicorn, pnpm dev, PostgreSQL) directly on the host.
> Running local processes alongside Docker leads to port conflicts, desync between code versions,
> and stale OpenAPI schemas. All dev work goes through `docker compose up`.

---

## Gate Commands

This section is the human-readable command source for the [`phase-gate`](playbooks/phase-gate.md)
workflow. Fill every row that applies to this project. Mark `n/a` for rows that do not apply
(e.g. no frontend → frontend rows are `n/a`). The phase-gate playbook will report `SKIPPED — n/a in
STACK.md` for those.

| Gate check | Command | Preconditions / notes |
|------------|---------|-----------------------|
| Infrastructure / bootstrap | `uv sync --dev` | Requires uv installed |
| Migrations | `uv run alembic upgrade head` | Requires DB to be running (docker compose up) |
| Reference data seed | n/a | Seeding runs automatically via `entrypoint.sh` inside the Docker backend container. |
| Backend / unit tests | `uv run pytest` | Uses aiosqlite in-memory; no Docker needed |
| **Schema sync** | `cd frontend && pnpm generate:api` | Backend must be running on :8000; regenerates `schema.ts` from live OpenAPI spec — **run after every API change** |
| Frontend prep | `cd frontend && pnpm install && pnpm build` | Requires Node >= 22 and pnpm |
| Frontend type-check | `cd frontend && pnpm typecheck` | Runs tsc --noEmit; will surface stale `schema.ts` mismatches |
| Frontend unit tests | `cd frontend && pnpm test` | Vitest |
| E2E lint / determinism | `cd frontend && pnpm test:e2e:lint` | Checks for anti-flake patterns |
| E2E | `cd frontend && pnpm test:e2e` | Playwright runs locally on the host against the running Docker app stack; Chromium project only. Do not run Playwright inside Docker. |
| Smoke | `docker compose up` | Full stack on :8000 / :3000; verify manually. Do NOT use `make dev`. |

---

## Testing

### Backend

```bash
uv run pytest                  # all tests (aiosqlite in-memory)
uv run pytest tests/test_foo.py  # single file
```

### Frontend

```bash
cd frontend && pnpm test              # Vitest unit tests
cd frontend && pnpm typecheck         # TypeScript type check
cd frontend && pnpm test:e2e          # Playwright e2e; host-run Chromium only (full stack required)
```

---

## Project structure

```
.
├── app/                    # FastAPI application (routers, models, services)
├── alembic/                # Database migrations
├── frontend/               # React Router v7 frontend (pnpm)
├── tests/                  # Backend pytest tests
├── scripts/                # Helper scripts (seed.py — DB seed runner)
├── app/seeders/            # Seeder classes (BaseSeeder + per-table seeders)
├── nginx/                  # Nginx config
├── docs/                   # SPEC, CONTEXT, STATE, CHANGELOG, PHASE_XX, STACK (this file), playbooks
├── .claude/skills/         # Claude Code skill wrappers (10 SDD skills)
├── plugins/sdd-workflow/   # Codex plugin (skills, commands, MCP, hooks)
└── AGENTS.md / CLAUDE.md   # AI agent rules
```

---

## Common operations

```bash
# Start the full stack
docker compose up --build

# Backend dev server only
make dev   # uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Apply migrations
make migrate   # uv run alembic upgrade head

# Apply migrations + seed reference data in one step (use on fresh envs)
make migrate-seed

# Seed reference data only (idempotent — safe to run multiple times)
make seed

# Run a single seeder by name
uv run python scripts/seed.py --seeder medications_reference

# Preview what seeding would do without writing to the DB
uv run python scripts/seed.py --dry-run

# List all registered seeders
uv run python scripts/seed.py --list

# Generate a new migration
uv run alembic revision --autogenerate -m "description"

# Regenerate frontend types from live OpenAPI spec (run after every API change)
cd frontend && pnpm generate:api

# Lint / format
make lint   # uv run ruff check . && uv run ruff format --check .

# Install all dependencies
make install   # uv sync --dev
```

---

## Frontend Type Conventions

`frontend/app/shared/types/schema.ts` is **auto-generated** from the backend's OpenAPI spec via `pnpm generate:api`. It is the single source of truth for all API shapes on the frontend.

| Rule | Detail |
|------|--------|
| Always import from `schema.ts` | Use `components['schemas']['TypeName']`; never hand-write API interface duplicates |
| Regenerate after every API change | New endpoint, modified field, renamed schema → `pnpm generate:api` immediately |
| Use dedicated input schemas | `PatientCreate`, `DiagnosisUpdate`, `PatientMedicationCreate`, etc. — not `Partial<*Out>` |
| Do not hand-edit `schema.ts` | It is a generated artefact; edits will be overwritten on the next `generate:api` run |

The `generate:api` script lives at `frontend/scripts/generate-api.js` and calls `openapi-typescript` against `http://localhost:8000/openapi.json`.

---

## Datetime Conventions

All timestamp handling in the backend must follow these rules without exception. Violations cause `asyncpg.exceptions.DataError` at runtime (see `KNOWN_GOTCHAS.md`).

| Rule | Correct | Wrong |
|------|---------|-------|
| Current time | `datetime.now(UTC)` | `datetime.now()` |
| UTC constant import | `from datetime import UTC, datetime` | `from datetime import datetime` then `timezone.utc` inline |
| ORM column type | `mapped_column(DateTime(timezone=True), ...)` | `mapped_column(nullable=True)` (type omitted) |
| Alembic migration column | `sa.DateTime(timezone=True)` | `sa.DateTime()` |
| Comparing DB-read datetimes | Always check `if dt.tzinfo is None: dt = dt.replace(tzinfo=UTC)` before arithmetic | Assume the returned datetime is always aware |

**Why it matters — the asyncpg trap:** SQLAlchemy infers the ORM column type and passes it as a type hint to asyncpg's binary protocol. If a `Mapped[datetime]` column omits `DateTime(timezone=True)`, asyncpg receives OID 1114 (`TIMESTAMP`) and encodes the Python value via `aware_dt − naive_epoch` → `TypeError`. This crashes the entire app even when the actual PostgreSQL column is `TIMESTAMPTZ`. The model annotation must match the DB column.

**aiosqlite (test DB):** SQLite returns naive datetimes from `DateTime(timezone=True)` columns. Always normalise before arithmetic:
```python
if last_completion.tzinfo is None:
    last_completion = last_completion.replace(tzinfo=UTC)
```
