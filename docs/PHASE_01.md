# PHASE 01 — Foundation & Auth

<!-- TOKEN BUDGET: keep this file under 10,000 tokens. Be concise. -->

## Phase Metadata

| Field | Value |
|-------|-------|
| Phase | `01` |
| Title | Foundation & Auth |
| Status | `⏳ pending` |
| Tag | `v0.01.0` |
| Depends on | — (first phase) |

---

## Phase Goal

Deliver a runnable full-stack skeleton with working authentication for both roles. A doctor can register and log in; a patient can log in via temp credentials. JWT access/refresh tokens are issued and validated. The React Router v7 shell renders a role-aware sidebar and a login page styled with the canonical design tokens. All auth endpoints are covered by unit tests and the full Docker stack starts cleanly.

See [SPEC.md §1](./SPEC.md#1-project-overview-and-goals), [§2](./SPEC.md#2-domain-context), [§3 (users/doctor_profiles/patients tables)](./SPEC.md#3-data-model), [§4.1](./SPEC.md#41-auth), [§5.1–5.4](./SPEC.md#51-pages).

---

## Design References

Screenshots provided during `/spec-init` establish the overall visual language used here:

- **All 4 screens** — sidebar (180 px, teal brand, active-nav highlight) and TopBar (breadcrumb + avatar) are visible. These directly inform `Sidebar` and `TopBar` implementation.
- **Login page** — no explicit screenshot; implement using design tokens from [SPEC.md §5.4](./SPEC.md#54-design-system): primary teal `#0D9E7E`, card on gray-50 background, Inter font, `radius-lg` card, `shadow-md`.

---

## Scope

### Data

- [ ] `D1` Create SQLAlchemy async base + Alembic environment (`app/models/base.py`, `app/core/database.py`, `alembic/env.py` wired to async engine) — _Depends on:_ —
- [ ] `D2` ORM models: `User`, `DoctorProfile`, `Patient` (columns verbatim from SPEC §3) — _Depends on:_ `D1`
- [ ] `D3` Alembic initial migration — auto-generate from `D2` models, review, commit migration file — _Depends on:_ `D2`

### Backend

- [ ] `B1` FastAPI app skeleton — `app/main.py` router mounts, CORS config, `/health` endpoint, lifespan DB init — _Depends on:_ `D1`
- [ ] `B2` Core security utilities — `app/core/security.py`: bcrypt hash/verify (rounds ≥ 12), JWT access-token create/decode (15 min TTL), refresh-token create/decode (7 days), `TokenPair` response schema — _Depends on:_ —
- [ ] `B3` Auth FastAPI dependencies — `app/api/deps.py`: `get_current_user`, `require_doctor`, `require_patient` (raises 401/403) — _Depends on:_ `B2`, `D2`
- [ ] `B4` Auth router — `app/api/v1/auth.py`: `POST /register` (doctor only), `POST /login`, `POST /refresh`, `POST /patient-login` (temp creds or email+pass), `PATCH /me/password` — _Depends on:_ `B2`, `B3`, `D2`
- [ ] `B5` Pydantic request/response schemas — `app/schemas/auth.py`: `RegisterRequest`, `LoginRequest`, `TokenPair`, `UserOut`, `DoctorProfileOut` — _Depends on:_ `D2`
- [ ] `B6` App config — `app/core/config.py`: `Settings` (pydantic-settings); reads `DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`, `BCRYPT_ROUNDS` — _Depends on:_ —
- [ ] `B7` Backend unit tests — `tests/test_auth.py`: register, login, refresh, patient-login, wrong-password 401, duplicate-email 409 — _Depends on:_ `B4`, `B5`

### Frontend

- [ ] `F1` React Router v7 shell — `frontend/app/root.tsx` root layout, `frontend/app/routes.ts` route tree; public route `/login`; protected doctor layout `/doctor/*`; protected patient layout `/` (index + nested); auth guard redirects to `/login` if unauthenticated — _Depends on:_ —
- [ ] `F2` Design system CSS tokens — `frontend/app/styles/tokens.css`: all custom properties from SPEC §5.4 (colors, typography, spacing, radius, shadows, layout, component-state tokens); imported in `root.tsx` — _Depends on:_ —
- [ ] `F3` Layout components — `frontend/app/components/layout/Sidebar.tsx` (180 px, role-aware nav items, Doctor/Patient view toggle at bottom), `frontend/app/components/layout/TopBar.tsx` (breadcrumb, bell icon, user avatar); styled with tokens — _Depends on:_ `F2`
- [ ] `F4` Login page — `frontend/app/routes/login.tsx` + `frontend/app/components/auth/LoginForm.tsx`; two input fields (identifier / password), primary teal submit button, calls `POST /api/v1/auth/login` or `/auth/patient-login`, stores tokens, redirects by role — _Depends on:_ `F2`, `F3`
- [ ] `F5` Auth state — `frontend/app/lib/auth.ts`: in-memory auth store (or React context); `setTokens`, `logout`, `currentUser`; Axios/fetch interceptor for `Authorization: Bearer` header + auto-refresh on 401 — _Depends on:_ `F1`

### Infra

- [ ] `I1` Docker Compose & env — verify `docker-compose.yml` has `postgres`, `backend`, `frontend`, `nginx` services; `docker-compose.override.yml` for dev hot-reload; `.env.example` lists all Phase 01 env vars — _Depends on:_ —

---

## Files

### Create / modify
```
# Backend — existing (verify/update only)
app/main.py                                     modify  (rename title to Docassist)
app/core/config.py                              exists  (verify settings names match)
app/core/rate_limit.py                          exists  (no changes needed)
app/db/base.py                                  exists  (no changes needed)
app/db/session.py                               exists  (no changes needed)
app/modules/users/models.py                     modify  (rename UserRole: user→doctor, admin→patient)
app/modules/auth/api.py                         modify  (add patient-login + PATCH /me/password)
app/modules/auth/service.py                     modify  (register sets role=UserRole.doctor; create DoctorProfile)
app/modules/auth/schemas.py                     modify  (add PatientTempLoginRequest, PasswordChangeRequest)
app/api/v1/router.py                            modify  (include new module routers when created)
alembic/versions/0001_users_table.py            modify  (replace user/admin enum values with doctor/patient)
alembic/env.py                                  modify  (add imports for new model modules)
tests/conftest.py                               modify  (UserRole.admin → UserRole.doctor seed)
tests/test_register_api.py                      modify  (update role assertion: user→doctor)

# Backend — new
app/modules/doctors/__init__.py                 create
app/modules/doctors/models.py                   create  (DoctorProfile model)
app/modules/doctors/schemas.py                  create  (DoctorProfileOut)
app/modules/doctors/repository.py               create
app/modules/doctors/service.py                  create
app/modules/doctors/dependencies.py             create
app/modules/patients/__init__.py                create
app/modules/patients/models.py                  create  (Patient model)
app/modules/patients/schemas.py                 create  (PatientOut, PatientTempLoginRequest)
app/modules/patients/repository.py              create
alembic/versions/0002_doctor_profile_patient.py create  (autogenerate after model creation)
tests/test_patient_login.py                     create

# Frontend — existing (verify/update only)
frontend/app/routes.ts                          modify  (add doctor/patient layout wrappers)
frontend/app/root.tsx                           verify  (AppTopBar global — may need breadcrumb update)
frontend/app/styles/app.css                     modify  (add Docassist color tokens in OKLCH)
frontend/app/features/auth/login-form.tsx       modify  (add patient temp-login mode)
frontend/app/pages/auth/login/index.tsx         modify  (role-aware redirect after login)
frontend/app/shared/services/jwt-service/jwt-service.ts  modify  (rename localStorage key to docassist.auth.token)

# Frontend — new
frontend/app/shared/ui/sidebar.tsx              create  (role-aware sidebar 180px)

# Infra
.env.example                                    modify  (update DB name, remove JWT_ prefixes)
```

### Do NOT touch
- `docs/SPEC.md`, `docs/CONTEXT.md`, `docs/STATE.md`, `docs/CHANGELOG.md`
- `alembic/versions/` files from future phases (none exist yet)
- Any frontend routes beyond `/login` and the skeleton layouts

---

## Contracts

> This section is the source of truth for `/context-update`.

### New persistent data (tables / collections / files)

```sql
users(id UUID PK, email TEXT UNIQUE NOT NULL, password_hash TEXT,
      role TEXT CHECK(role IN ('doctor','patient')),
      email_verified BOOL DEFAULT false, created_at TIMESTAMPTZ)

doctor_profiles(id UUID PK, user_id UUID FK users UNIQUE,
                full_name TEXT, specialty TEXT, created_at TIMESTAMPTZ)

patients(id UUID PK, doctor_id UUID FK doctor_profiles,
         full_name TEXT NOT NULL, birth_date DATE, gender TEXT,
         temp_login TEXT UNIQUE, temp_password_hash TEXT,
         email TEXT, email_verified BOOL DEFAULT false,
         onboarding_complete BOOL DEFAULT false,
         archived_at TIMESTAMPTZ, created_at TIMESTAMPTZ)
```

### New API endpoints

| Method | Path | Auth | Response / Payload |
|--------|------|------|--------------------|
| `POST` | `/api/v1/public/auth/register` | — | `TokenPair` (doctor registration; `consent_152fz: true` required) |
| `POST` | `/api/v1/public/auth/login` | — | `TokenPair` |
| `POST` | `/api/v1/public/auth/refresh` | refresh token (body) | `TokenPair` |
| `POST` | `/api/v1/public/auth/patient-login` | — | `TokenPair` (accepts `temp_login`+`password` or `email`+`password`) |
| `PATCH` | `/api/v1/public/auth/me/password` | bearer | `{"ok": true}` |
| `GET` | `/api/v1/health` | — | `{"status":"ok","db":"connected"}` |

### New types / models / shared interfaces

```typescript
type UserRole = 'doctor' | 'patient';

interface UserOut {
  id: string;          // UUID
  email: string;
  role: UserRole;
  is_active: boolean;  // snake_case — matches FastAPI JSON output
  consent_152fz: boolean;
  created_at: string;  // TIMESTAMPTZ as ISO string
}

interface DoctorProfileOut {
  id: string;
  userId: string;
  fullName: string;
  specialty: string | null;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'bearer';
}

// Auth store shape
interface AuthState {
  user: UserOut | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: UserOut, tokens: TokenPair) => void;
  logout: () => void;
}
```

### New env vars

| Key | Example value | Required |
|-----|---------------|----------|
| `DATABASE_URL` | `postgresql+asyncpg://app_user:changeme@db:5432/patient_tracker` | yes |
| `SECRET_KEY` | `change-me-generate-a-secure-random-hex-string` | yes |
| `ALGORITHM` | `HS256` | yes |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | yes |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | yes |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | yes |
| `REDIS_URL` | `redis://redis:6379/0` | yes (Docker stack; not used in Phase 01 logic) |

---

## Gate Checks

> **Before running gate:** confirm all Scope checkboxes are checked (or explicitly deferred in
> Architect Review Notes). Unchecked items appear in the gate report as a warning, not a hard block.

Run `/phase-gate 01` before committing.

`/phase-gate` returns full PASS only when:
- Automated checks are green
- All architect review items below are resolved (checked off)

Use the commands in [docs/STACK.md](./STACK.md#gate-commands) as the source of truth for automated checks.

```bash
# Phase 01 smoke checks
curl -s http://localhost:8000/api/v1/health
# expected: {"status":"ok","db":"connected"}

curl -s -X POST http://localhost:8000/api/v1/public/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@test.com","password":"testPass1!","consent_152fz":true}'
# expected: {"access_token":"<jwt>","refresh_token":"<jwt>","token_type":"bearer"}

curl -s -X POST http://localhost:8000/api/v1/public/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@test.com","password":"testPass1!"}'
# expected: TokenPair JSON

# Frontend: http://localhost:3000/login renders login form without console errors
```

---

## Architect Review Notes

- [x] No architect review issues recorded

---

## Atomic Commit Message

```
feat(phase-01): foundation & auth — JWT, user models, login page, design tokens
```

---

## Post-Phase Checklist

- [ ] All Scope checkboxes checked (or deferred in Architect Review Notes)
- [ ] `docs/PHASE_01_NOTES.md` complete — Implementation Plans filled, key decisions recorded
- [ ] All automated gate checks green
- [ ] All architect review notes resolved
- [ ] `docs/CONTEXT.md` updated — run `/context-update 01`
- [ ] `docs/STATE.md` phase row updated to `✅ done`
- [ ] `docs/CHANGELOG.md` entry added (contracts introduced)
- [ ] Committed atomically on `feat/phase-01` branch
- [ ] Tag created after merge to develop: `git tag -a v0.01.0 -m "Phase 01: Foundation & Auth"`
