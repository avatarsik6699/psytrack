# PHASE 10 — Implementation Notes

<!--
  WHAT to build → docs/PHASE_10.md  (contracts, scope checklist)
  HOW it was built → this file       (plans, decisions, rationale)

  Ownership rules:
  - ### Exploration          — written by agent (/phase-explore). Optional; skip for simple tasks.
  - ### Implementation Plan  — written by agent (/impl-brief). Agent may update only this section.
  - ### Decisions & Notes    — written by human. NEVER overwritten by agent.
-->

_Phase:_ `10` · _Generated:_ `2026-05-23`

---

## [B1] — Public registration shutdown
**Depends on:** —

### Exploration

### Implementation Plan
Disable `POST /api/v1/public/auth/register` in `app/modules/auth/api.py` with a deterministic
403 response model. Keep request validation, create no user/profile, regenerate OpenAPI types, and
cover the no-persist behaviour in backend tests.

### Decisions & Notes

## [B2] — Doctor provisioning command
**Depends on:** B1

### Exploration

### Implementation Plan
Add `scripts/create-doctor.py` as the non-HTTP doctor provisioning path using SQLAlchemy async
sessions, password hashing, `UserRole.doctor`, consent timestamps, and a matching `DoctorProfile`.
Expose it through `make create-doctor` and use it in e2e setup where public registration was
previously used.

### Decisions & Notes

## [B3] — Auth rate limiting
**Depends on:** B1

### Exploration

### Implementation Plan
Use the existing SlowAPI limiter in `app/core/rate_limit.py`, add `AUTH_RATE_LIMIT` settings, and
decorate doctor login, patient login, refresh, and disabled register routes. Reset limiter state in
tests and verify 429 behaviour for repeated auth attempts.

### Decisions & Notes

## [B4] — Production OpenAPI/docs shutdown
**Depends on:** —

### Exploration

### Implementation Plan
Wrap app construction in `create_app()` and set `docs_url`, `redoc_url`, and `openapi_url` to
`None` when `APP_ENV=production`. Keep development URLs enabled so `pnpm generate:api` still works.

### Decisions & Notes

## [D1] — Reference-only startup seeding
**Depends on:** —

### Exploration

### Implementation Plan
Make `scripts/seed.py` default to reference seeders only: `medications_reference`, `scales`, and
`side_effects`. Preserve manual demo/all paths via `--seeder demo_data`, `--all`, `make seed-demo`,
and `make seed-all`.

### Decisions & Notes

## [F1] — Production demo-helper guard
**Depends on:** —

### Exploration

### Implementation Plan
Verify and test the existing `/login` demo credential helper stays behind `runtime.isDev`, so the
helper and fill action are absent from production builds.

### Decisions & Notes

## [F2] — Build-time API base URL
**Depends on:** —

### Exploration

### Implementation Plan
Pass `VITE_API_BASE_URL` as a Docker build arg and runtime env, require it for production builds,
and normalize accidental `/api/v1` suffixes in `frontend/app/shared/config/env.ts` so API paths are
joined exactly once.

### Decisions & Notes

## [I1] — Production setup script
**Depends on:** —

### Exploration

### Implementation Plan
Create `scripts/setup-prod.sh` to render `.env`, replace `[DOMAIN]` in nginx, remove
`docker-compose.override.yml`, generate strong `POSTGRES_PASSWORD`/`SECRET_KEY`/`INTERNAL_KEY`, and
validate rendered production compose output for template leftovers.

### Decisions & Notes

## [I2] — Production nginx/certbot
**Depends on:** I1

### Exploration

### Implementation Plan
Update production nginx to redirect `www.[DOMAIN]` to `[DOMAIN]`, keep ACME challenge handling, and
add `scripts/renew-certs.sh` plus production docs for cert renewal followed by nginx reload.

### Decisions & Notes

## [I3] — Scheduler single-instance safety
**Depends on:** —

### Exploration

### Implementation Plan
Add `SCHEDULER_ENABLED` config so APScheduler startup is explicit, and pin production compose to one
backend replica with scheduler enabled to avoid duplicate scheduled task execution.

### Decisions & Notes

## [I4] — Deployment docs
**Depends on:** I1, I2, I3

### Exploration

### Implementation Plan
Document the canonical `psycker.ru` VPS setup, certificate issuance/renewal, first doctor
provisioning, and production smoke checklist in `README.md` and `docs/STACK.md`.

### Decisions & Notes

## [FT1] — E2E production-readiness smoke
**Depends on:** B1, B4, F1

### Exploration

### Implementation Plan
Add `frontend/tests/e2e/phase-10-smoke.spec.ts` covering disabled register and health in the dev
stack, with production-only checks for demo helper absence and docs shutdown guarded by env flags.

### Decisions & Notes

## [FT2] — Unit tests for env/API URL and login helper behaviour
**Depends on:** F1, F2

### Exploration

### Implementation Plan
Add Vitest coverage for production `VITE_API_BASE_URL` requirements, `/api/v1` base normalization,
and the dev-only login helper guard.

### Decisions & Notes

## [T1] — Backend production-readiness tests
**Depends on:** B1, B3, B4, D1

### Exploration

### Implementation Plan
Add backend tests for disabled registration, auth rate limiting, production docs shutdown,
development docs availability, doctor provisioning, reference-only seeding, and scheduler
single-instance production config.

### Decisions & Notes

## [T2] — Infra validation checks
**Depends on:** I1, F2

### Exploration

### Implementation Plan
Add infra validation assertions covering `setup-prod.sh`, required production env generation,
compose validation, production frontend API build args, and removal of raw `localhost:8000` from
compose configuration.

### Decisions & Notes
