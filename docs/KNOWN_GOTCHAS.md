# Known Gotchas

> Project memory file. Capture recurring pitfalls that repeatedly waste time during coding,
> testing, or deploys.

## How To Use

- Add only issues that are likely to happen again.
- Prefer concrete symptoms, root cause, and the shortest reliable fix.
- Remove entries that are no longer relevant.

## Gotcha Log

### Docker-owned files break host operations (`EACCES` / `EPERM` / read-only)

- **Symptoms**: file operations fail with `EACCES`, `EPERM`, "Permission denied", or "Read-only file system". Most common paths: container-generated build/cache directories on the host (`.nuxt/`, `.output/`, `node_modules/.cache/`, `__pycache__/`).
- **Root cause**: a Docker container wrote to a bind-mounted host directory as root.
- **Fix (host)**:
  ```bash
  sudo chown -R $USER:$USER <path>   # reclaim ownership, keep files
  sudo rm -rf <path>                 # OR discard the generated artefact
  ```
- **Agent protocol**: agents MUST NOT run `sudo`, `chmod -R 777`, or loop the failing operation. Instead, stop and post this exact handoff to the user (substituting real `<path>` and `<cmd>`):

  > ⛔ **Permission denied.** I cannot modify `<path>` while running `<cmd>`.
  >
  > This usually happens when a Docker container wrote files to a bind-mounted host directory as root. Please run one of the following on the host:
  >
  > ```bash
  > sudo chown -R $USER:$USER <path>
  > sudo rm -rf <path>
  > ```
  >
  > When the fix is applied, reply with the single word **`continue`** and I will retry the failed operation from the same step.

  On receiving `continue` (case-insensitive), retry the failed operation once. If it fails a second time with the same error, stop again and ask the user to confirm the fix was actually applied — do not loop a third time.

- **Prevention**: run Docker with a matching host UID/GID or use named volumes for cache directories that containers own.

---

### WSL2 — Docker Desktop required for `docker compose`

- **Symptoms**: `docker compose up` hangs or fails with "Cannot connect to the Docker daemon at unix:///var/run/docker.sock".
- **Root cause**: Docker Engine is not running inside WSL2; it must be provided by Docker Desktop on the Windows host with the WSL2 integration enabled.
- **Fix**: start Docker Desktop on Windows and ensure the WSL2 backend integration is enabled for this distro (Docker Desktop → Settings → Resources → WSL Integration).
- **Prevention**: keep Docker Desktop running before opening a terminal session in WSL2.

### Empty `medications_reference` — medication typeahead returns nothing

- **Symptoms**: `GET /api/v1/ref/medications` returns `[]`; the medication assignment form shows no results regardless of what the user types.
- **Root cause**: the `medications_reference` table was created by the migration but never seeded. This can happen when running the backend outside Docker (via `make dev`) without running the seed step first, or when the Docker image was built before `scripts/` was added to the `COPY` instruction.
- **Fix**:
  ```bash
  make seed           # seed all reference tables
  # or, if you want just medications:
  uv run python scripts/seed.py --seeder medications_reference
  ```
- **Prevention**: in Docker (`docker compose up`), seeding runs automatically via `entrypoint.sh` — no manual step. When running without Docker, use `make migrate-seed` instead of `make migrate`. See `STACK.md § Initial setup`.

---

### Stale `schema.ts` — type errors after an API change

- **Symptoms**: `pnpm typecheck` (or the IDE) reports errors like "Property X does not exist on type Y", or a field that exists in the backend is `undefined` on the frontend. No obvious code change caused it.
- **Root cause**: a backend schema was added, renamed, or modified but `pnpm generate:api` was not run to regenerate `frontend/app/shared/types/schema.ts`.
- **Fix**:
  ```bash
  # Ensure the backend is running, then:
  cd frontend && pnpm generate:api
  ```
  Then recheck with `pnpm typecheck`.
- **Prevention**: `pnpm generate:api` is a named gate check in `STACK.md` — run it before every type-check step. See `AGENTS.md § Frontend Type Conventions` for the full rule set.

### asyncpg `DataError`: "can't subtract offset-naive and offset-aware datetimes"

- **Symptoms**: `docker compose up` crashes on startup (usually during seeding) with:
  ```
  sqlalchemy.exc.DBAPIError: ... asyncpg.exceptions.DataError: invalid input for query argument $N:
  datetime.datetime(...) (can't subtract offset-naive and offset-aware datetimes)
  ```
- **Root cause**: two independent causes that often appear together:
  1. A `Mapped[datetime]` column in an ORM model is declared **without** `DateTime(timezone=True)`. SQLAlchemy tells asyncpg to use OID 1114 (`TIMESTAMP`) for that parameter. asyncpg's encoder then computes `aware_dt − naive_epoch`, which raises `TypeError` when the Python value is timezone-aware. The actual DB column may already be `TIMESTAMPTZ` — the bug is the **missing type annotation in the model**.
  2. `datetime.now()` (no timezone argument) produces a naive datetime. Inserting it into a `TIMESTAMPTZ` column fails because asyncpg rejects naive datetimes for `TIMESTAMPTZ`.
- **Fix**:
  1. Add `DateTime(timezone=True)` to every `mapped_column` that stores a timestamp:
     ```python
     # Wrong
     consent_at: Mapped[datetime | None] = mapped_column(nullable=True)
     # Right
     consent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
     ```
  2. Replace every `datetime.now()` with `datetime.now(UTC)` (import `UTC` from `datetime`).
- **Prevention**: see `docs/STACK.md § Datetime Conventions` — all rules are enforced there.

---

<!--
### [Title — short, punchy, searchable]

- **Symptoms**: [what fails, what error message]
- **Root cause**: [why it happens]
- **Fix**: [shortest reliable fix]
- **Prevention**: [optional — how to avoid hitting it again]
- **Links**: [optional — docs / issue / PR]
-->
