# CHANGELOG — Spec & Architecture History

> Records changes to `docs/SPEC.md` and `docs/CONTEXT.md`. This is **NOT** a git commit log.
> Purpose: capture *why* the contract changed and which phases were affected.
> Format: newest entry at top.

---

## 2026-05-16 — Phase 01 complete

**Type**: phase-completion
**Author**: AI (context-update)
**Triggered by**: PHASE_01 gate passed and committed

### Changes
- SQLAlchemy async base, Alembic environment, and initial migrations (0001_users_table, 0002_doctor_profile_patient)
- ORM models: `User`, `DoctorProfile`, `Patient`
- FastAPI auth router: register, login, refresh, patient-login, change-password, health endpoints
- Core security utilities: bcrypt hashing (≥12 rounds), JWT access/refresh tokens
- Auth FastAPI dependencies: `get_current_user`, `require_doctor`, `require_patient`
- Pydantic request/response schemas for auth flows
- App config via pydantic-settings (`Settings`)
- Backend unit tests: register, login, refresh, patient-login, error cases
- React Router v7 shell with role-aware layouts (doctor/patient)
- Design system CSS tokens (SPEC §5.4: teal palette, Inter font, spacing, radius, shadows)
- `Sidebar` (180 px, role-aware nav) and `TopBar` layout components
- `LoginForm` with temp-credentials and email/password modes
- Auth state store with token management and Axios interceptor for auto-refresh
- Docker Compose stack verified; `.env.example` updated for Phase 01 env vars

### Affected Phases
- None (additive change)

### Contract Updates
- DB tables added: `users`, `doctor_profiles`, `patients`; Alembic head: `0002_doctor_profile_patient`
- Endpoints added: POST /register, POST /login, POST /refresh, POST /patient-login, PATCH /me/password, GET /health
- TypeScript types added: `UserRole`, `UserOut`, `DoctorProfileOut`, `TokenPair`, `AuthState`
- Env vars added: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`, `CORS_ORIGINS`, `REDIS_URL`

### Notes
Role enum uses `'doctor'` / `'patient'` (renamed from `user` / `admin`). Patient temp-login accepts either `temp_login+password` or `email+password`. REDIS_URL is required by the Docker stack but unused in Phase 01 application logic.

---

## v1.0 — 2026-05-09 — Initial Setup

**Type**: initial-setup
**Author**: v.godlevskiy
**Triggered by**: Project initialization with SDD workflow

### Changes
- `SPEC.md` created: project goals, roles, data model, API/contract, phase plan
- `CONTEXT.md` v1.0 created: initial stack snapshot
- `STACK.md` populated with build/test/run commands

### Affected Phases
- None (initial state)

### Contract Updates
- `CONTEXT.md` initialized at `v1.0`

---

<!--
ENTRY TEMPLATE — copy this block when adding a new entry:

## [CONTEXT_VERSION] — [YYYY-MM-DD] — [Short Title]

**Type**: spec-change | arch-decision | breaking-change | phase-completion | addendum
**Author**: [name / AI skill]
**Triggered by**: [What caused this? User request, bug discovery, new requirement, etc.]

### Changes
- [bullet: what specifically changed in SPEC.md or the architecture]

### Affected Phases
- PHASE_XX — [why it is affected]

### Contract Updates
- `CONTEXT.md` bumped from `vX.Y` to `vX.Z`
- [list schema / endpoint / type changes]

### Notes
[Trade-offs, decisions, context not captured elsewhere]

-->
