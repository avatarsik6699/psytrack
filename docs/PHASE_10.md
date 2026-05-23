# PHASE 10 — Production Readiness & VPS Deployment

<!-- TOKEN BUDGET: keep this file under 10,000 tokens. Be concise. -->

## Phase Metadata

| Field | Value |
|-------|-------|
| Phase | `10` |
| Title | Production Readiness & VPS Deployment |
| Status | `✅ done` |
| Tag | `v0.10.0` |
| Depends on | PHASE_09 gate passing |

---

## Phase Goal

Phase 10 turns the completed MVP into a deployable production candidate for a VPS under
`psycker.ru`. The phase removes the behaviours that make the current stack unsafe to expose
publicly: automatic demo data, public doctor registration, public OpenAPI/docs, stale frontend API
base URL, incomplete HTTPS renewal, and duplicate scheduler risk. Broader security, operations, and
legal work remain deferred to phases 11 and 12.

---

## Scope

### Backend
- [x] `B1` Public registration shutdown — `POST /api/v1/public/auth/register` returns a deterministic disabled response and creates no user; tests prove no account is persisted — _Depends on:_ —
- [x] `B2` Doctor provisioning command — add a non-HTTP operational script/command for creating the first doctor account manually without reopening public registration — _Depends on:_ `B1`
- [x] `B3` Auth rate limiting — apply rate limits to doctor login, patient login, refresh, and disabled register endpoints — _Depends on:_ `B1`
- [x] `B4` Production OpenAPI/docs shutdown — disable `/docs`, `/redoc`, and `/openapi.json` when `APP_ENV=production`, while preserving development OpenAPI for API type generation — _Depends on:_ —

### Data
- [x] `D1` Reference-only startup seeding — backend startup runs migrations plus `medications_reference`, `scales`, and `side_effects` only; `demo_data` is never auto-seeded, while manual `make seed-demo` and `make seed-all` remain available — _Depends on:_ —

### Frontend
- [x] `F1` Production demo-helper guard — `/login` demo credential helper and fill action render in development only and never appear in production builds — _Depends on:_ —
- [x] `F2` Build-time API base URL — Docker production frontend build receives `VITE_API_BASE_URL`; browser API calls target `https://psycker.ru/api/v1/...` exactly once, with no duplicated `/api/v1` and no `localhost:8000` production fallback — _Depends on:_ —

### Infra
- [x] `I1` Production setup script — create `scripts/setup-prod.sh` for domain/env generation, `[DOMAIN]` replacement, dev override removal, strong `POSTGRES_PASSWORD`/`SECRET_KEY`/`INTERNAL_KEY`, and rendered compose validation — _Depends on:_ —
- [x] `I2` Production nginx/certbot — canonicalize `www.psycker.ru` to `psycker.ru`, keep ACME challenge handling, and ensure certbot renewal reloads nginx after successful renewal — _Depends on:_ `I1`
- [x] `I3` Scheduler single-instance safety — make Phase 10 production deployment explicitly one backend container/worker and add a guard or documented startup constraint preventing duplicate APScheduler execution — _Depends on:_ —
- [x] `I4` Deployment docs — update `docs/STACK.md` and/or `README.md` with one canonical VPS command sequence and production smoke checklist — _Depends on:_ `I1`, `I2`, `I3`

### Frontend Tests
- [x] `FT1` `frontend/tests/e2e/phase-10-smoke.spec.ts` — production-readiness smoke covering blocked register, login without production demo helper, health check, and blocked docs where practical — _Depends on:_ `B1`, `B4`, `F1`
- [x] `FT2` Unit tests for production env/API URL and dev-only login helper behaviour — _Depends on:_ `F1`, `F2`

### Infra / Backend Tests
- [x] `T1` Backend tests for disabled register, auth rate limits, production docs shutdown, development docs availability, and reference-only startup seeding — _Depends on:_ `B1`, `B3`, `B4`, `D1`
- [x] `T2` Infra validation checks for rendered production Compose config: no `[DOMAIN]`, `changeme`, `localhost:8000`, or template database names after setup — _Depends on:_ `I1`, `F2`

---

## Files

### Create / modify
~~~
# Documentation / workflow
docs/SPEC.md
docs/PHASE_10.md
docs/PHASE_10_NOTES.md
docs/STACK.md
README.md

# Backend / auth / app config
app/main.py
app/core/config.py
app/core/rate_limit.py
app/modules/auth/api.py
app/modules/auth/service.py
entrypoint.sh
scripts/seed.py
scripts/setup-prod.sh
scripts/create-doctor.py
Makefile
tests/

# Frontend / env / auth UI
Dockerfile.frontend
docker-compose.yml
docker-compose.prod.yml
frontend/app/shared/config/env.ts
frontend/app/features/auth/login-form.tsx
frontend/tests/

# Nginx / TLS
nginx/nginx.conf
~~~

### Do NOT touch
- Clinical feature contracts unrelated to deployment readiness
- Existing patient/doctor domain models unless required by auth provisioning
- `frontend/app/shared/types/schema.ts` by hand; regenerate only if backend OpenAPI changes require it

---

## Contracts

> This section is the source of truth for `/context-update`. Fill it in **before** handing to AI.

### New persistent data (tables / collections / files)

None

### New API endpoints / RPC methods / events

No new HTTP API endpoints. Existing endpoint contract changes:

| Method | Path | Auth | Response / Payload |
|--------|------|------|--------------------|
| `POST` | `/api/v1/public/auth/register` | none | Disabled response; creates no account |

New non-HTTP operational command:

| Command | Purpose |
|---------|---------|
| `scripts/create-doctor.py` or equivalent Make target | Create a doctor account manually from the VPS/operator shell |

### New types / models / shared interfaces

None

### New env vars

| Key | Example value | Required |
|-----|---------------|----------|
| `INTERNAL_KEY` | generated 32-byte hex string | yes in production |

Existing production env values to enforce:

| Key | Production value |
|-----|------------------|
| `APP_ENV` | `production` |
| `DOMAIN` | `psycker.ru` |
| `API_BASE_URL` | `https://psycker.ru` |
| `API_BASE_INTERNAL_URL` | `http://backend:8000` |
| `CORS_ORIGINS` | `["https://psycker.ru","https://www.psycker.ru"]` |

---

## Gate Checks

> **Before running gate:** confirm all Scope checkboxes are checked (or explicitly deferred in
> Architect Review Notes). Unchecked items appear in the gate report as a warning, not a hard block.

Run `/phase-gate 10` before committing.

`/phase-gate` returns full PASS only when:
- Automated checks are green
- All architect review items below are resolved (checked off)

Use the commands in [docs/STACK.md](./STACK.md#gate-commands) as the source of truth for:
- infrastructure / bootstrap
- migrations (if applicable)
- backend / unit tests
- frontend prep, type-check, unit tests (if a frontend exists)
- e2e (if an e2e suite exists)
- the default smoke check

**Frontend test coverage check (hard requirement):** before the gate can pass, confirm one of the following:
- `FT1` checkbox is checked — `frontend/tests/e2e/phase-10-smoke.spec.ts` exists and all its tests are green in `pnpm test:e2e`; OR
- `FT1` is explicitly deferred in Architect Review Notes with a written justification.

Phase-specific smoke checklist:

```bash
# after production setup on VPS
curl -I https://psycker.ru
curl -I https://www.psycker.ru
curl -s https://psycker.ru/api/v1/health
curl -I https://psycker.ru/docs
curl -I https://psycker.ru/openapi.json
# expected: canonical HTTPS works, www redirects to psycker.ru, health is ok, docs/openapi are blocked
```

---

## Architect Review Notes

Use this section after manual verification. Add one checkbox item per issue the architect wants
fixed before the phase can close. Leave the item unchecked while it is still open. Check it off
only after the fix is implemented and re-verified.
If manual verification found nothing, keep the default checked line below.

- [x] No architect review issues recorded

---

## Atomic Commit Message

```
feat(phase-10): production readiness for psycker.ru deploy
```

---

## Post-Phase Checklist

- [x] All Scope checkboxes checked (or deferred in Architect Review Notes)
- [x] `FT1` checked — `frontend/tests/e2e/phase-10-smoke.spec.ts` exists, or deferral documented in Architect Review Notes
- [x] `docs/PHASE_10_NOTES.md` complete — Implementation Plans filled, key decisions recorded
- [ ] All automated gate checks green
- [x] All architect review notes resolved
- [x] `docs/CONTEXT.md` updated — run `/context-update 10`
- [x] `docs/STATE.md` phase row updated to `✅ done`
- [x] `docs/CHANGELOG.md` entry added (if contracts changed)
- [ ] Committed atomically on `feat/phase-10` branch
- [ ] Tag created after merge to develop: `git tag -a v0.10.0 -m "Phase 10: Production Readiness & VPS Deployment"`
