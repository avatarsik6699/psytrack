# PHASE 01 — Implementation Notes

<!--
  WHAT to build → docs/PHASE_01.md  (contracts, scope checklist)
  HOW it was built → this file       (plans, decisions, rationale)

  Ownership rules:
  - ### Exploration          — written by agent (/phase-explore). Optional; skip for simple tasks.
  - ### Implementation Plan  — written by agent (/impl-brief). Agent may update only this section.
  - ### Decisions & Notes    — written by human. NEVER overwritten by agent.

  Sync rule: task IDs (B1, F1, I1 …) must match the Scope checklist in PHASE_01.md.
-->

_Phase:_ `01` · _Generated:_ `2026-05-09` · _Explored:_ `2026-05-10` · _Briefed:_ `2026-05-10`

---

## [D1] — SQLAlchemy async base + Alembic environment
**Depends on:** —

### Exploration

_Explored:_ `2026-05-10` · _Verdict:_ `ready`

**Relevant patterns found:**
- `app/db/base.py:1-27` — `Base(AsyncAttrs, DeclarativeBase)`, `UUIDMixin` (UUID PK with `gen_random_uuid()`), `TimestampMixin` (`created_at` + `updated_at`, both TIMESTAMPTZ). All new models inherit from these three mixins in the order `UUIDMixin, TimestampMixin, Base`.
- `app/db/session.py:1-46` — `create_async_engine` with `pool_pre_ping`, `pool_recycle`, `max_overflow`; SQLite branch for tests (no queue-pool options). `get_db()` yields a session that auto-commits on success and rolls back on exception.
- `alembic/env.py:1-54` — Async Alembic using `create_async_engine`; reads `DATABASE_URL` from `os.environ`; `target_metadata = Base.metadata`; imports model modules via `import app.modules.users` to register them with metadata.

**Constraints discovered:**
- `TimestampMixin` adds **both** `created_at` and `updated_at` to every model. SPEC §3 only shows `created_at` for most tables — `updated_at` will be present in the actual DB even if not in SPEC contracts.
- `alembic/env.py` currently only imports `app.modules.users`. Every new module with models **must** be added here (e.g. `import app.modules.doctors`, `import app.modules.patients`) for autogenerate to detect them.
- Tests use `Base.metadata.create_all` directly (no Alembic in test runs). Model registrations via import must be present in `conftest.py` too.

**Spec/contract gaps:**
- `updated_at` will appear in all tables but is not listed in SPEC §3.

**Risk areas:**
- Adding new model imports to `alembic/env.py` is easy to forget; missing imports cause autogenerate to silently skip new tables.

### Implementation Plan

**Done when:** `uv run alembic upgrade head` completes on a clean DB creating `users`, `doctor_profiles`, and `patients` tables; `uv run pytest` passes with all three tables visible via `Base.metadata`.

**Follows pattern:** `alembic/env.py` — add import lines after the existing `import app.modules.users` line.

**Files:** `alembic/env.py` (modify), `tests/conftest.py` (modify after D2)

**Steps:**
1. Verify `app/db/base.py` and `app/db/session.py` — no changes needed; they are complete.
2. After D2 creates the new model modules, add to `alembic/env.py` below line 7:
   ```python
   import app.modules.doctors  # noqa: F401
   import app.modules.patients  # noqa: F401
   ```
3. After D2 creates the new model modules, add the same two imports to `tests/conftest.py` below the existing `import app.modules.users  # noqa: F401` line (there is none explicitly, but add near the other model imports).
4. Run `uv run alembic upgrade head` against a running DB to verify migrations apply cleanly.

### Decisions & Notes

---

## [D2] — ORM models: User, DoctorProfile, Patient
**Depends on:** D1

### Exploration

_Explored:_ `2026-05-10` · _Verdict:_ `ready`

**Relevant patterns found:**
- `app/modules/users/models.py:1-29` — canonical model pattern: `class User(UUIDMixin, TimestampMixin, Base)`. Uses `StrEnum` for the role, `Enum(UserRole, name="user_role")` as column type, `CITEXT()` for email (case-insensitive), `mapped_column` with `Mapped[T]` typing.
- `app/modules/users/__init__.py` — module re-exports everything from sub-files; follow the same pattern for new modules.

**Constraints discovered:**
- `UserRole` currently has values `user`/`admin`. SPEC §3 requires `doctor`/`patient`. Since there is **no production data**, the cleanest fix is: rename `user`→`doctor` and `admin`→`patient` directly in `app/modules/users/models.py` and in `alembic/versions/0001_users_table.py`. All downstream references (`conftest.py`, `auth/service.py`, tests) must be updated at the same time.
- `User` model has extra columns not in SPEC §3: `consent_152fz BOOL` (Russian personal-data law 152-FZ), `consent_at TIMESTAMPTZ`, `is_active BOOL`. These must be **kept** — removing them breaks existing tests and the law requirement.
- `hashed_password` is the column name (not `password_hash` as in SPEC §3). Use `hashed_password` in all new code.
- `DoctorProfile` and `Patient` must be created as new modules following the same `app/modules/{name}/models.py` layout — **not** in `app/models/` as PHASE_01.md listed.
- `email` on `Patient` should also use `CITEXT()` to match `User.email`.

**Spec/contract gaps:**
- SPEC §3 `User` column is named `password_hash`; actual column (and all code) uses `hashed_password` — use `hashed_password` everywhere.
- SPEC §3 doesn't mention `consent_152fz`, `consent_at`, `is_active`, `updated_at` — all will exist in the DB.
- SPEC §3 `doctor_profiles.user_id FK users UNIQUE` — enforce uniqueness with `unique=True` on the column.

**Risk areas:**
- Renaming the `UserRole` enum requires updating `0001_users_table.py`, `auth/service.py`, `users/schemas.py`, `conftest.py`, and all test files simultaneously. A partial rename causes import errors.

### Implementation Plan

**Done when:** `from app.modules.users.models import UserRole; assert UserRole.doctor == "doctor"` passes; `DoctorProfile` and `Patient` tables appear in `Base.metadata.tables`; `uv run pytest` still passes after all rename updates.

**Follows pattern:** `app/modules/users/models.py` — copy structure for new models.

**Files:**
- `app/modules/users/models.py` (modify — rename enum values)
- `app/modules/auth/service.py` (modify — update role reference)
- `tests/conftest.py` (modify — update seed role)
- `tests/test_register_api.py` (modify — update role assertion)
- `app/modules/doctors/` (create — full module)
- `app/modules/patients/` (create — full module)

**Steps:**

1. **Rename UserRole enum** in `app/modules/users/models.py`:
   ```python
   class UserRole(enum.StrEnum):
       doctor = "doctor"
       patient = "patient"
   ```

2. **Update auth service** `app/modules/auth/service.py` line ~35:
   ```python
   role=UserRole.doctor,   # was UserRole.user
   ```

3. **Update conftest seed** `tests/conftest.py`:
   ```python
   role=UserRole.doctor,   # was UserRole.admin
   ```
   Also update the email from `admin@example.com` to `doctor@example.com` (optional but less confusing).

4. **Update test assertions** in `tests/test_register_api.py`:
   ```python
   assert user.role == UserRole.doctor   # was UserRole.user
   ```

5. **Create `app/modules/doctors/`** with:
   - `__init__.py` — re-exports `DoctorProfile`, `DoctorProfileOut`, `get_doctor_service`
   - `models.py`:
     ```python
     from uuid import UUID
     from sqlalchemy import ForeignKey, String
     from sqlalchemy.orm import Mapped, mapped_column
     from app.db.base import Base, TimestampMixin, UUIDMixin

     class DoctorProfile(UUIDMixin, TimestampMixin, Base):
         __tablename__ = "doctor_profiles"
         user_id: Mapped[UUID] = mapped_column(
             ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
         )
         full_name: Mapped[str] = mapped_column(String(200), nullable=False)
         specialty: Mapped[str | None] = mapped_column(String(100), nullable=True)
     ```
   - `schemas.py`, `repository.py`, `service.py`, `dependencies.py` — stubs matching users module structure (can be minimal for Phase 01; just enough to support `register` creating a profile).

6. **Create `app/modules/patients/`** with:
   - `models.py`:
     ```python
     from datetime import date, datetime
     from uuid import UUID
     from sqlalchemy import Boolean, ForeignKey, String
     from sqlalchemy.dialects.postgresql import CITEXT
     from sqlalchemy.orm import Mapped, mapped_column
     from app.db.base import Base, TimestampMixin, UUIDMixin

     class Patient(UUIDMixin, TimestampMixin, Base):
         __tablename__ = "patients"
         doctor_id: Mapped[UUID] = mapped_column(
             ForeignKey("doctor_profiles.id", ondelete="CASCADE"), nullable=False, index=True
         )
         full_name: Mapped[str] = mapped_column(String(200), nullable=False)
         birth_date: Mapped[date | None] = mapped_column(nullable=True)
         gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
         temp_login: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
         temp_password_hash: Mapped[str | None] = mapped_column(String(100), nullable=True)
         email: Mapped[str | None] = mapped_column(CITEXT(), unique=True, nullable=True)
         email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
         onboarding_complete: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
         archived_at: Mapped[datetime | None] = mapped_column(nullable=True)
     ```
   - `schemas.py`, `repository.py`, `service.py`, `dependencies.py`, `__init__.py` — stubs.

### Decisions & Notes

---

## [D3] — Alembic initial migration
**Depends on:** D2

### Exploration

_Explored:_ `2026-05-10` · _Verdict:_ `ready`

**Relevant patterns found:**
- `alembic/versions/0001_users_table.py` — existing migration for `users` table. Since no production data exists, **modify this file** to replace `user`/`admin` enum values with `doctor`/`patient` rather than creating a separate alter-enum migration. Create a new `0002_doctor_profile_patient.py` for the two new tables.
- `alembic/env.py:6-7` — only imports `app.modules.users`. Must add imports for the two new model modules before running autogenerate.

**Constraints discovered:**
- PostgreSQL requires an explicit `ALTER TYPE … ADD VALUE` to extend an existing enum, or `DROP TYPE + CREATE TYPE` to replace it. Since no prod data exists, the simplest path is to edit `0001_users_table.py` to create the enum with the final `doctor`/`patient` values from the start.
- Tests use `Base.metadata.create_all` so new model modules must be imported in `tests/conftest.py` as well.

**Spec/contract gaps:**
- —

**Risk areas:**
- Autogenerate may produce a no-op migration for `users` if the enum values match; verify with `alembic upgrade head` on a clean DB.

### Implementation Plan

**Done when:** `uv run alembic upgrade head` on a clean DB creates `users` (with `user_role` enum values `doctor`/`patient`), `doctor_profiles`, and `patients` tables without errors.

**Follows pattern:** `alembic/versions/0001_users_table.py`

**Files:**
- `alembic/versions/0001_users_table.py` (modify — enum values)
- `alembic/env.py` (modify — add module imports, done in D1 step)
- `alembic/versions/0002_doctor_profile_patient.py` (create — autogenerate)

**Steps:**

1. **Edit `0001_users_table.py`**: find the `op.create_table` call or the enum creation and change `'user', 'admin'` → `'doctor', 'patient'`. Also update any `server_default` that references `'user'` to `'doctor'`.

2. **Add module imports to `alembic/env.py`** (D1 step 2 above).

3. **Autogenerate migration for new tables**:
   ```bash
   uv run alembic revision --autogenerate -m "add doctor_profiles and patients tables"
   ```

4. **Review** the generated `0002_….py`: confirm `doctor_profiles` and `patients` tables are present with the correct FK constraints and that no spurious `ALTER` on `users` appears.

5. **Test**:
   ```bash
   uv run alembic downgrade base && uv run alembic upgrade head
   ```

### Decisions & Notes

---

## [B1] — FastAPI app skeleton (main.py, router mounts, /health)
**Depends on:** D1

### Exploration

_Explored:_ `2026-05-10` · _Verdict:_ `ready`

**Relevant patterns found:**
- `app/main.py:1-45` — **fully implemented**: lifespan (`init_db`/`close_db`), CORS from `settings.CORS_ORIGINS`, `slowapi` rate-limit handler, `api_v1_router` mounted. Only cosmetic change needed: update `title` from `"Template App"` to `"Docassist"`.
- `app/modules/health/api.py:1-13` — `/health` endpoint already exists at `/api/v1/health` (with `API_V1_PREFIX`). Responds `{"status":"ok","db":"connected"}`. PHASE_01.md smoke test uses `/health` at root — adjust smoke test to `/api/v1/health`.
- `app/core/constants.py` — holds `API_V1_PREFIX`; check value before using it in tests.

**Constraints discovered:**
- Health endpoint is `/api/v1/health`, not `/health` as in PHASE_01.md contracts table. Smoke test command must be updated.
- `app.state.limiter = limiter` must remain — slowapi requires it.
- Redis (`REDIS_URL`) is wired in `Settings` but not actually used in Phase 01 code. It's fine to leave it in config.

**Spec/contract gaps:**
- PHASE_01.md lists `/health` (root); actual path is `/api/v1/health` via `API_V1_PREFIX`. Update the contract row and smoke test.

**Risk areas:**
- —

### Implementation Plan

**Done when:** `GET /api/v1/health` returns `{"status":"ok","db":"connected"}` with 200; `app.title == "Docassist"` in the OpenAPI schema at `/docs`.

**Follows pattern:** `app/main.py` — minimal modification only.

**Files:** `app/main.py` (modify)

**Steps:**
1. In `app/main.py`, update `FastAPI(...)` constructor:
   ```python
   app = FastAPI(
       title="Docassist",
       version="0.1.0",
       description="Psychiatric inter-visit monitoring",
       lifespan=lifespan,
   )
   ```
2. After D2 adds new modules, add their imports to `api/v1/router.py` when their routers exist (Phase 02+). No router changes needed for Phase 01.
3. Verify `/api/v1/health` works: `curl http://localhost:8000/api/v1/health`.

### Decisions & Notes

---

## [B2] — Core security utilities (bcrypt + JWT)
**Depends on:** —

### Exploration

_Explored:_ `2026-05-10` · _Verdict:_ `ready`

**Relevant patterns found:**
- `app/modules/auth/utils.py:1-73` — **fully implemented**: `hash_password` (bcrypt rounds=12, hardcoded), `verify_password`, `_create_token`, `create_access_token`, `create_refresh_token`, `decode_token`, `ensure_token_type`. Uses `python-jose` (`from jose import jwt`).
- `app/modules/auth/constants.py` — holds `JWT_CLAIM_SUBJECT`, `JWT_CLAIM_ROLE`, `JWT_CLAIM_EXPIRY`, `JWT_CLAIM_TOKEN_TYPE`, `TOKEN_TYPE_ACCESS`, `TOKEN_TYPE_REFRESH`.

**Constraints discovered:**
- Uses `python-jose`, not `PyJWT`. Both are in pyproject.toml (`python-jose[cryptography]`).
- Settings key is `settings.SECRET_KEY` (not `JWT_SECRET_KEY`), `settings.ALGORITHM` (not `JWT_ALGORITHM`).
- bcrypt rounds are hardcoded at 12, no `BCRYPT_ROUNDS` env var. Adding one is optional but not required since the SPEC only says "≥ 12".
- Token JTI (`jti = uuid4().hex`) is set per token — useful for future revocation.

**Spec/contract gaps:**
- PHASE_01.md env vars table lists `JWT_SECRET_KEY`/`JWT_ALGORITHM`/`BCRYPT_ROUNDS` — actual setting names are `SECRET_KEY`/`ALGORITHM`/no BCRYPT_ROUNDS. Update the env vars contract table.

**Risk areas:**
- —

### Implementation Plan

**Done when:** `app/modules/auth/utils.py` exists and all existing auth tests pass — this task is already complete.

**Follows pattern:** `app/modules/auth/utils.py` — no changes needed.

**Files:** none

**Steps:**
1. No action required. `hash_password`, `verify_password`, `create_access_token`, `create_refresh_token`, `decode_token`, `ensure_token_type` are all implemented and tested.
2. Verify: `uv run pytest tests/test_auth_api.py` (or equivalent) passes.

### Decisions & Notes

---

## [B3] — Auth FastAPI dependencies (get_current_user, require_doctor, require_patient)
**Depends on:** B2, D2

### Exploration

_Explored:_ `2026-05-10` · _Verdict:_ `ready`

**Relevant patterns found:**
- `app/modules/auth/dependencies.py:1-58` — **fully implemented**: `get_current_user` (Bearer scheme, decode + lookup), `require_role(*roles)` factory that returns an async `Depends` function.
- `require_doctor` and `require_patient` are **not named symbols** — they are produced by `require_role(UserRole.doctor)` and `require_role(UserRole.patient)`. This is the existing pattern; either create module-level aliases or use the factory inline.

**Constraints discovered:**
- The `require_role` factory uses `Depends(get_current_user)` internally — the factory pattern works correctly with FastAPI's dependency cache.
- `bearer_scheme = HTTPBearer(auto_error=False)` — returns `None` if no header is present; `get_current_user` then raises `NotAuthenticated`.

**Spec/contract gaps:**
- PHASE_01.md planned `require_doctor`/`require_patient` as standalone functions in `app/api/deps.py`. Actual pattern is `require_role()` factory in `app/modules/auth/dependencies.py`. No separate `deps.py` needed; use existing module.

**Risk areas:**
- After renaming `UserRole.user`→`doctor` and `UserRole.admin`→`patient`, all callers of `require_role(UserRole.user)` must be updated.

### Implementation Plan

**Done when:** `require_role(UserRole.doctor)` used as a FastAPI dependency on a test endpoint returns 403 when called with a patient token; `get_current_user` raises 401 when no token is provided.

**Follows pattern:** `app/modules/auth/dependencies.py:48-58`

**Files:** `app/modules/auth/dependencies.py` (modify — add aliases)

**Steps:**
1. After D2 renames the enum, verify all existing `require_role(UserRole.xxx)` call sites still compile.
2. Add named aliases at the bottom of `app/modules/auth/dependencies.py` for ergonomic use in routers:
   ```python
   require_doctor = require_role(UserRole.doctor)
   require_patient = require_role(UserRole.patient)
   ```
3. Export from `app/modules/auth/__init__.py`:
   ```python
   from app.modules.auth.dependencies import (
       get_current_user,
       get_auth_service,
       require_doctor,
       require_patient,
       require_role,
   )
   ```

### Decisions & Notes

---

## [B4] — Auth router endpoints
**Depends on:** B2, B3, D2

### Exploration

_Explored:_ `2026-05-10` · _Verdict:_ `ready`

**Relevant patterns found:**
- `app/modules/auth/api.py:1-57` — **mostly done**: `POST /public/auth/login`, `POST /public/auth/register`, `POST /public/auth/refresh`, `GET /public/auth/me`, `DELETE /public/auth/me`, `POST /public/auth/logout`. Router prefix is `/public/auth`.
- `app/modules/auth/service.py:22-44` — `register()` hardcodes `role=UserRole.user` → must change to `UserRole.doctor` after enum rename.

**Constraints discovered:**
- Endpoint prefix is `/api/v1/public/auth/…`, not `/api/v1/auth/…` as in PHASE_01.md. Update contracts table and smoke tests.
- `POST /register` accepts `consent_152fz: Literal[True]` (required) in `RegisterRequest`. This is **intentional** (Russian 152-FZ compliance). Keep it in doctor registration.
- Missing endpoints that need to be added:
  1. `POST /public/auth/patient-login` — accepts `temp_login`/`temp_password` or `email`/`password`, returns `TokenPair` with `role=patient`.
  2. `PATCH /public/auth/me/password` — change own password (bearer, any role).
- `service.py` `register()` must be updated: role → `UserRole.doctor`, and `DoctorProfile` must be created in the same transaction.

**Spec/contract gaps:**
- PHASE_01.md path `/api/v1/auth/…` → actual is `/api/v1/public/auth/…`.
- Doctor `register` returns plain `TokenPair`, not `TokenPair + UserOut`. The `UserOut` in PHASE_01.md response was a spec addition — decide whether to include it or keep the existing `TokenPair`-only response.

**Risk areas:**
- `patient-login` with temp credentials needs a separate lookup (by `temp_login` column on `patients` table, not `users.email`). This is new logic that does not exist in `UserService`.

### Implementation Plan

**Done when:** `POST /api/v1/public/auth/patient-login` with `{"temp_login":"tmp_abc","password":"pass"}` returns 200 `TokenPair` with a patient-role JWT; `PATCH /api/v1/public/auth/me/password` with valid current + new password returns `{"ok":true}`; existing register/login tests still pass.

**Follows pattern:** `app/modules/auth/api.py` (add endpoints), `app/modules/auth/service.py` (add methods)

**Files:**
- `app/modules/auth/api.py` (modify — add 2 endpoints)
- `app/modules/auth/service.py` (modify — register creates DoctorProfile; add patient_login + change_password)
- `app/modules/auth/schemas.py` (modify — done in B5)
- `app/modules/patients/repository.py` (create — `get_by_temp_login`)

**Steps:**

1. **Update `register()` in `service.py`** to also create a `DoctorProfile` row:
   ```python
   async def register(self, email: str, password: str, full_name: str) -> TokenPair:
       # ... existing duplicate-check logic ...
       user = await self._user_service.add(User(
           email=email,
           hashed_password=hash_password(password),
           role=UserRole.doctor,
           consent_152fz=True,
           consent_at=datetime.now(),
           is_active=True,
       ))
       await self._doctor_repo.add(DoctorProfile(
           user_id=user.id,
           full_name=full_name,
       ))
       # ... build and return TokenPair ...
   ```
   Update `RegisterRequest` (B5) to include `full_name: str`.

2. **Add `patient_login()` to `AuthService`**:
   ```python
   async def patient_login(self, temp_login: str, password: str) -> TokenPair:
       patient = await self._patient_repo.get_by_temp_login(temp_login)
       if patient is None or not verify_password(password, patient.temp_password_hash or ""):
           raise InvalidCredentials()
       # Look up the associated user row (patient's user account)
       user = await self._user_service.get_by_id(patient.user_id)  # Patient needs user_id FK
       claims = {JWT_CLAIM_SUBJECT: str(user.id), JWT_CLAIM_ROLE: user.role.value}
       return TokenPair(access_token=create_access_token(claims),
                        refresh_token=create_refresh_token(claims))
   ```
   _Note:_ `Patient` model needs a `user_id FK users` column for this to work. Add `user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)` to the `Patient` model in D2 (alongside `doctor_id`). This is the patient's own login identity.

3. **Add `change_password()` to `AuthService`**:
   ```python
   async def change_password(self, user: User, current: str, new: str) -> None:
       if not verify_password(current, user.hashed_password):
           raise InvalidCredentials()
       await self._user_service.update_password(user, hash_password(new))
   ```

4. **Add endpoints to `auth/api.py`**:
   ```python
   @router.post("/patient-login", response_model=TokenPair)
   async def patient_login(
       body: PatientTempLoginRequest,
       service: AuthService = Depends(get_auth_service),
   ) -> TokenPair:
       return await service.patient_login(body.temp_login, body.password)

   @router.patch("/me/password", status_code=200)
   async def change_password(
       body: PasswordChangeRequest,
       current_user: User = Depends(get_current_user),
       service: AuthService = Depends(get_auth_service),
   ) -> dict[str, bool]:
       await service.change_password(current_user, body.current_password, body.new_password)
       return {"ok": True}
   ```

5. **Add `get_by_temp_login` to `PatientRepository`** in `app/modules/patients/repository.py`:
   ```python
   async def get_by_temp_login(self, temp_login: str) -> Patient | None:
       result = await self._session.scalar(
           select(Patient).where(Patient.temp_login == temp_login)
       )
       return result
   ```

### Decisions & Notes

---

## [B5] — Pydantic request/response schemas (auth.py)
**Depends on:** D2

### Exploration

_Explored:_ `2026-05-10` · _Verdict:_ `ready`

**Relevant patterns found:**
- `app/modules/auth/schemas.py:1-28` — `LoginRequest`, `RefreshRequest`, `TokenPair`, `RegisterRequest` (with `consent_152fz: Literal[True]`), `AccountDeletionResponse`. Pydantic v2 `BaseModel`.
- `app/modules/users/schemas.py:1-22` — `UserOut` with `from_attributes=True`, `id: UUID`, `email`, `role`, `is_active`, `consent_152fz`, `created_at`. `UserCreate` with `email`/`password`.

**Constraints discovered:**
- `UserOut` is in `app/modules/users/schemas.py`, not in auth schemas. `DoctorProfileOut` and `PatientLoginRequest` must be created in `app/modules/doctors/schemas.py` and `app/modules/patients/schemas.py` (or in auth schemas as request types).
- `UserOut` currently exposes `consent_152fz` and `is_active` to the API — intentional, keep as-is.
- New schema needed: `PatientTempLoginRequest` with fields `temp_login: str` and `password: str`.
- New schema needed: `DoctorProfileOut` with `id: UUID`, `user_id: UUID`, `full_name: str`, `specialty: str | None`.
- New schema needed: `PasswordChangeRequest` with `current_password: str`, `new_password: str` (min 8 chars).

**Spec/contract gaps:**
- PHASE_01.md `UserOut` type omits `is_active` and `consent_152fz` — actual schema includes them. Update TypeScript type definition accordingly.

**Risk areas:**
- —

### Implementation Plan

**Done when:** `from app.modules.auth.schemas import PatientTempLoginRequest, PasswordChangeRequest` imports without error; `from app.modules.doctors.schemas import DoctorProfileOut` imports without error; existing schema tests pass.

**Follows pattern:** `app/modules/auth/schemas.py` (add to), `app/modules/users/schemas.py` (reference for `from_attributes`)

**Files:**
- `app/modules/auth/schemas.py` (modify — add 2 schemas + update RegisterRequest)
- `app/modules/doctors/schemas.py` (create)

**Steps:**

1. **Update `RegisterRequest`** in `app/modules/auth/schemas.py` to include `full_name`:
   ```python
   class RegisterRequest(BaseModel):
       email: EmailStr
       password: str = Field(min_length=8, max_length=128)
       full_name: str = Field(min_length=1, max_length=200)
       consent_152fz: Literal[True]
   ```

2. **Add new schemas** to `app/modules/auth/schemas.py`:
   ```python
   class PatientTempLoginRequest(BaseModel):
       temp_login: str
       password: str

   class PasswordChangeRequest(BaseModel):
       current_password: str
       new_password: str = Field(min_length=8, max_length=128)
   ```

3. **Create `app/modules/doctors/schemas.py`**:
   ```python
   from datetime import datetime
   from uuid import UUID
   from pydantic import BaseModel, ConfigDict

   class DoctorProfileOut(BaseModel):
       model_config = ConfigDict(from_attributes=True)
       id: UUID
       user_id: UUID
       full_name: str
       specialty: str | None
       created_at: datetime
   ```

4. **Update `app/modules/auth/api.py`** register endpoint to pass `body.full_name` to `service.register()`.

### Decisions & Notes

---

## [B6] — App config (pydantic-settings, Settings class)
**Depends on:** —

### Exploration

_Explored:_ `2026-05-10` · _Verdict:_ `ready`

**Relevant patterns found:**
- `app/core/config.py:1-41` — **fully implemented**: `Settings(BaseSettings)` with `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`, `CORS_ORIGINS` (with JSON/comma parse validator), `APP_ENV`, `LOG_LEVEL`, `API_BASE_URL`. Reads from `.env` file.

**Constraints discovered:**
- Config key names differ from PHASE_01.md contracts: `SECRET_KEY` (not `JWT_SECRET_KEY`), `ALGORITHM` (not `JWT_ALGORITHM`). No `BCRYPT_ROUNDS`. `REFRESH_TOKEN_EXPIRE_DAYS` defaults to 14 (not 7).
- `REDIS_URL` is present but not used in Phase 01. Leave as-is.

**Spec/contract gaps:**
- PHASE_01.md env vars table must be corrected to match actual Settings field names.

**Risk areas:**
- —

### Implementation Plan

**Done when:** `.env.example` lists `SECRET_KEY`, `ALGORITHM`, `DATABASE_URL` with `patient_tracker` DB name; `DOMAIN=localhost` is set; template values are replaced.

**Follows pattern:** `.env.example` (update values)

**Files:** `.env.example` (modify)

**Steps:**
1. Update `.env.example`:
   ```dotenv
   DATABASE_URL=postgresql+asyncpg://app_user:changeme@db:5432/patient_tracker
   POSTGRES_USER=app_user
   POSTGRES_PASSWORD=changeme
   POSTGRES_DB=patient_tracker

   REDIS_URL=redis://redis:6379/0

   SECRET_KEY=CHANGE_ME_generate_a_secure_random_hex_string
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=15
   REFRESH_TOKEN_EXPIRE_DAYS=7

   CORS_ORIGINS=["http://localhost:3000","http://localhost:80"]
   APP_ENV=development
   LOG_LEVEL=INFO

   DOMAIN=localhost
   API_BASE_URL=http://localhost:8000/api/v1
   API_BASE_INTERNAL_URL=http://backend:8000/api/v1
   ```
2. No changes to `app/core/config.py` — it is already correct.

### Decisions & Notes

---

## [B7] — Backend unit tests for auth
**Depends on:** B4, B5

### Exploration

_Explored:_ `2026-05-10` · _Verdict:_ `ready`

**Relevant patterns found:**
- `tests/conftest.py:1-92` — session-scoped `test_engine` with aiosqlite, CITEXT/JSONB monkeypatching, `db_session` fixture (creates admin seed user, rolls back after each test), `client` fixture (`AsyncClient` + `ASGITransport` + `dependency_overrides[get_db]`).
- `tests/test_register_api.py:1-75` — tests for `/api/v1/public/auth/register` covering: `consent_152fz=False` → 422, valid register → 201 + tokens, duplicate email → 409.
- `tests/test_auth_api.py` — exists; likely tests login/refresh.

**Constraints discovered:**
- `conftest.py` seeds a `UserRole.admin` user. After renaming enum → `UserRole.patient`, the seed must change to `UserRole.doctor` or `UserRole.patient` as appropriate.
- Test DB is aiosqlite in-memory (from `DATABASE_URL` env). Tests must not depend on PostgreSQL-specific types — CITEXT and JSONB monkeypatches are already in conftest.
- `consent_152fz=True` is required in doctor registration tests — keep this requirement.
- `test_register_api.py` already tests the register endpoint; new tests needed for: `patient-login`, `PATCH /me/password`, and role-guard (`require_doctor` blocks patient, `require_patient` blocks doctor).

**Spec/contract gaps:**
- —

**Risk areas:**
- Enum rename (`user`→`doctor`, `admin`→`patient`) touches conftest seed + multiple test files — must update all at once or tests will fail with `AttributeError`.

### Implementation Plan

**Done when:** `uv run pytest` exits 0; `test_patient_login_with_temp_credentials` passes; a test asserts that a patient token is rejected with 403 on a doctor-only endpoint.

**Follows pattern:** `tests/test_register_api.py` (for new patient tests)

**Files:**
- `tests/conftest.py` (modify — rename seed role)
- `tests/test_register_api.py` (modify — update role assertion, add `full_name`)
- `tests/test_patient_login.py` (create)

**Steps:**

1. **Update `conftest.py`**: change seed user role `UserRole.admin` → `UserRole.doctor`; email can stay `admin@example.com` or change to `doctor@example.com`.

2. **Update `test_register_api.py`**:
   - Add `full_name` to all register request bodies.
   - Update `assert user.role == UserRole.user` → `UserRole.doctor`.

3. **Create `tests/test_patient_login.py`**:
   ```python
   async def test_patient_login_with_temp_credentials(client, db_session):
       # Seed: create a User (patient role) + Patient row with temp_login
       user = User(email=None, hashed_password=hash_password("pass123"),
                   role=UserRole.patient, consent_152fz=True, is_active=True)
       db_session.add(user)
       await db_session.flush()
       patient = Patient(user_id=user.id, doctor_id=...,  # use seeded doctor's profile id
                         full_name="Test Patient",
                         temp_login="tmp_test", temp_password_hash=hash_password("pass123"))
       db_session.add(patient)
       await db_session.flush()

       response = await client.post(
           "/api/v1/public/auth/patient-login",
           json={"temp_login": "tmp_test", "password": "pass123"},
       )
       assert response.status_code == 200
       data = response.json()
       assert data["access_token"]
       assert data["token_type"] == "bearer"

   async def test_patient_login_wrong_password(client, db_session):
       # Similar setup, wrong password → 401

   async def test_role_guard_rejects_patient_on_doctor_endpoint(client, db_session):
       # Login as patient, hit a doctor-only endpoint → 403
   ```

4. **Run full suite**: `uv run pytest -v`.

### Decisions & Notes

---

## [F1] — React Router v7 shell + route tree + auth guard
**Depends on:** —

### Exploration

_Explored:_ `2026-05-10` · _Verdict:_ `ready`

**Relevant patterns found:**
- `frontend/app/routes.ts:1-8` — `index`, `login`, `register`, `dashboard` routes already defined using `index()` and `route()` helpers from `@react-router/dev/routes`.
- `frontend/app/root.tsx:1-65` — `App()` wraps in `AppProvider`, renders `AppTopBar`, `Outlet`. `ErrorBoundary` also defined. i18n (`useTranslation`) is active.
- `frontend/app/features/auth/use-auth-guard.ts` — auth guard hook exists; should be used in protected layouts rather than duplicating logic.

**Constraints discovered:**
- No `doctor/*` or patient nested layout groups yet. React Router v7 file-based routing with `route()` helper — layout routes use `layout()` from `@react-router/dev/routes`.
- i18next is active (`react-i18next`, `i18next-browser-languagedetector`) — all new UI strings should use `t()`. At minimum, login page labels need translation keys.
- `AppTopBar` is already rendered in `root.tsx` globally. The per-role Sidebar should be rendered inside protected layout routes, not in root.

**Spec/contract gaps:**
- PHASE_01.md planned `frontend/app/routes.ts` modifications and `frontend/app/lib/auth.ts` for auth state. Actual auth state lives in `shared/api/auth.ts` + `shared/services/jwt-service/` — no separate `lib/auth.ts` needed.

**Risk areas:**
- Adding `layout()` wrappers to `routes.ts` for doctor/patient separation must not break the existing `login` and `register` public routes.

### Implementation Plan

**Done when:** Navigating to `/` while logged in as a patient renders `<Sidebar>` + page content; navigating to `/doctor` while logged in as a doctor renders the doctor sidebar; unauthenticated access to either redirects to `/login`; `pnpm typecheck` passes.

**Follows pattern:** `frontend/app/routes.ts` — extend with `layout()` calls.

**Files:**
- `frontend/app/routes.ts` (modify)
- `frontend/app/layouts/patient-layout.tsx` (create)
- `frontend/app/layouts/doctor-layout.tsx` (create)

**Steps:**

1. **Update `frontend/app/routes.ts`**:
   ```typescript
   import { index, layout, route } from '@react-router/dev/routes';

   export default [
     route('login', './routes/login.tsx'),
     route('register', './routes/register.tsx'),
     // Patient-protected routes
     layout('./layouts/patient-layout.tsx', [
       index('./routes/_index.tsx'),
       route('history', './routes/history.tsx'),
       route('profile', './routes/profile.tsx'),
     ]),
     // Doctor-protected routes
     layout('./layouts/doctor-layout.tsx', [
       route('doctor', './routes/doctor/_index.tsx'),
       route('doctor/patients/:id', './routes/doctor/patient-detail.tsx'),
       route('doctor/schedule', './routes/doctor/schedule.tsx'),
       route('doctor/settings', './routes/doctor/settings.tsx'),
     ]),
   ];
   ```
   _(Doctor and patient route files beyond `_index.tsx` are stubs created in later phases. For Phase 01, create empty placeholder route files so the layout compiles.)_

2. **Create `frontend/app/layouts/patient-layout.tsx`**:
   ```tsx
   import { Outlet, redirect } from 'react-router';
   import { useAuthGuard } from '@features/auth/use-auth-guard';
   import { Sidebar } from '@shared/ui/sidebar';

   export default function PatientLayout() {
     useAuthGuard({ requiredRole: 'patient', redirectTo: '/login' });
     return (
       <div className="flex min-h-screen">
         <Sidebar role="patient" />
         <main className="flex-1 ml-[180px]">
           <Outlet />
         </main>
       </div>
     );
   }
   ```

3. **Create `frontend/app/layouts/doctor-layout.tsx`** — same structure with `role="doctor"`.

4. Create stub route files for each listed route so the build doesn't fail:
   - `frontend/app/routes/history.tsx` — `export default function HistoryRoute() { return null; }`
   - `frontend/app/routes/profile.tsx` — similar stub
   - `frontend/app/routes/doctor/_index.tsx` — stub
   _(These are filled out in later phases.)_

### Decisions & Notes

---

## [F2] — Design system CSS tokens
**Depends on:** —

### Exploration

_Explored:_ `2026-05-10` · _Verdict:_ `ready`

**Relevant patterns found:**
- `frontend/app/styles/app.css:1-183` — Tailwind v4 (`@import "tailwindcss"`), shadcn theme variables in OKLCH colorspace, `@theme inline` block mapping CSS vars to Tailwind utilities, Geist Variable font (`@fontsource-variable/geist`). All color vars use OKLCH format.
- `frontend/app/styles/app.css:79-121` — `@theme inline` maps custom properties to Tailwind colors. New Docassist tokens must follow the same OKLCH convention and be added here.

**Constraints discovered:**
- Font is **Geist Variable** (`--font-sans: 'Geist Variable'`), **not Inter**. SPEC §5.4 lists Inter — update to Geist Variable.
- Colors use **OKLCH** values, not hex. SPEC §5.4 lists hex tokens — they must be converted to OKLCH before adding to `app.css`. Approximate conversions: `#0D9E7E` ≈ `oklch(0.62 0.14 165)`, `#5B5BD6` ≈ `oklch(0.52 0.18 264)`.
- A separate `tokens.css` file (as in PHASE_01.md) is not needed. All tokens go into `app.css` as additional CSS custom properties within the existing `:root` block and `@theme inline` block.
- shadcn components consume `--primary`, `--accent`, etc. Overriding these vars will retheme the entire component library automatically.

**Spec/contract gaps:**
- SPEC §5.4 uses hex + `tokens.css` approach. Actual implementation must use OKLCH + `app.css` to match existing project conventions.
- SPEC §5.4 font: `Inter` → correct to `'Geist Variable'` in SPEC or impl notes.

**Risk areas:**
- OKLCH conversions must be verified visually — automated hex→OKLCH tools may produce slightly different perceived colors.

### Implementation Plan

**Done when:** `--docassist-primary` CSS variable resolves to the teal hue; the login page button renders in teal (#0D9E7E ≈); `pnpm build` exits 0.

**Follows pattern:** `frontend/app/styles/app.css:8-77` — add to existing `:root` and `@theme inline` blocks.

**Files:** `frontend/app/styles/app.css` (modify)

**Steps:**

1. **Add Docassist custom properties** to the `:root` block in `app.css` (after the existing shadcn vars):
   ```css
   /* Docassist brand tokens */
   --docassist-primary:        oklch(0.62 0.14 165);   /* #0D9E7E teal */
   --docassist-primary-hover:  oklch(0.68 0.13 165);   /* #27B594 */
   --docassist-primary-light:  oklch(0.75 0.10 168);   /* #4EC9AB */
   --docassist-primary-subtle: oklch(0.96 0.03 165);   /* #E6F7F3 */
   --docassist-accent:         oklch(0.52 0.18 264);   /* #5B5BD6 purple */
   --docassist-accent-hover:   oklch(0.62 0.15 264);   /* #7C7CE8 */
   --docassist-accent-subtle:  oklch(0.96 0.04 264);   /* #EDEDFB */
   --docassist-sidebar-width:  180px;
   ```

2. **Override shadcn semantic vars** so all shadcn components pick up the teal brand colour:
   ```css
   --primary:            var(--docassist-primary);
   --primary-foreground: oklch(1 0 0);
   --ring:               var(--docassist-primary);
   ```

3. **Expose in `@theme inline`** for Tailwind utility use:
   ```css
   --color-docassist-primary:        var(--docassist-primary);
   --color-docassist-accent:         var(--docassist-accent);
   --color-docassist-primary-subtle: var(--docassist-primary-subtle);
   --color-docassist-accent-subtle:  var(--docassist-accent-subtle);
   ```

4. Run `pnpm build` to confirm no CSS parse errors.

### Decisions & Notes

---

## [F3] — Sidebar + TopBar layout components
**Depends on:** F2

### Exploration

_Explored:_ `2026-05-10` · _Verdict:_ `ready`

**Relevant patterns found:**
- `frontend/app/shared/ui/app-top-bar.tsx` — `AppTopBar` already exists and is rendered globally in `root.tsx`. It likely needs updating to show breadcrumb + role avatar per the Docassist design. Read this file before implementing.
- `frontend/app/components/ui/button.tsx`, `card.tsx`, `input.tsx`, `label.tsx` — shadcn components, use via `cn()` utility for class merging.
- `frontend/app/lib/utils.ts` — `cn()` utility (clsx + tailwind-merge). Use in all new components.
- FSD pattern: shared reusable UI primitives go in `frontend/app/shared/ui/`. The Sidebar is a layout primitive → `frontend/app/shared/ui/sidebar.tsx`.

**Constraints discovered:**
- `AppTopBar` is global (in root.tsx). The Sidebar should be part of the **protected layout routes**, not root. The layout for doctor routes should render `<Sidebar role="doctor" />` + `<Outlet />`, patient routes render `<Sidebar role="patient" />` + `<Outlet />`.
- No CSS-Modules — all styles via Tailwind utility classes.
- Icon library: `lucide-react` is installed (v1.11.0). Use lucide icons for nav items.

**Spec/contract gaps:**
- PHASE_01.md placed Sidebar/TopBar in `frontend/app/components/layout/` — correct location is `frontend/app/shared/ui/` per FSD pattern.

**Risk areas:**
- —

### Implementation Plan

**Done when:** `<Sidebar role="patient" />` renders a 180 px left nav with Home, History, Profile links and a "Doctor View" toggle at the bottom; `<Sidebar role="doctor" />` renders Patients, Schedule, Settings, My Account; `pnpm typecheck` passes.

**Follows pattern:** `frontend/app/shared/ui/app-top-bar.tsx` — for structure and import patterns.

**Files:**
- `frontend/app/shared/ui/sidebar.tsx` (create)
- `frontend/app/shared/ui/app-top-bar.tsx` (update — breadcrumb + avatar per Docassist design, optional for Phase 01 scope)

**Steps:**

1. **Create `frontend/app/shared/ui/sidebar.tsx`**:
   ```tsx
   import { NavLink } from 'react-router';
   import { Home, Clock, User, Users, Calendar, Settings } from 'lucide-react';
   import { cn } from '@/lib/utils';

   interface SidebarProps {
     role: 'doctor' | 'patient';
   }

   const patientNav = [
     { to: '/',        icon: Home,     label: 'Home' },
     { to: '/history', icon: Clock,    label: 'History' },
     { to: '/profile', icon: User,     label: 'Profile' },
   ];

   const doctorNav = [
     { to: '/doctor',           icon: Users,    label: 'Patients' },
     { to: '/doctor/schedule',  icon: Calendar, label: 'Schedule' },
     { to: '/doctor/settings',  icon: Settings, label: 'Settings' },
     { to: '/doctor/account',   icon: User,     label: 'My Account' },
   ];

   export function Sidebar({ role }: SidebarProps) {
     const nav = role === 'patient' ? patientNav : doctorNav;
     const switchTo = role === 'patient' ? '/doctor' : '/';
     const switchLabel = role === 'patient' ? 'Doctor View' : 'Patient View';

     return (
       <aside
         className="fixed inset-y-0 left-0 flex flex-col justify-between
                    bg-white border-r border-border w-[var(--docassist-sidebar-width)] py-4"
       >
         {/* Logo */}
         <div>
           <div className="px-4 mb-6">
             <span className="font-semibold text-docassist-primary text-sm">Docassist</span>
             <p className="text-[10px] text-muted-foreground">Psychiatry Monitor</p>
           </div>
           {/* Nav items */}
           <nav className="flex flex-col gap-1 px-2">
             {nav.map(({ to, icon: Icon, label }) => (
               <NavLink
                 key={to}
                 to={to}
                 end
                 className={({ isActive }) =>
                   cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-docassist-primary-subtle text-docassist-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted')
                 }
               >
                 <Icon size={16} />
                 {label}
               </NavLink>
             ))}
           </nav>
         </div>
         {/* Bottom actions */}
         <div className="px-2 flex flex-col gap-1">
           <NavLink to={switchTo}
             className="flex items-center gap-2 px-3 py-2 text-xs text-docassist-primary
                        border border-docassist-primary rounded-md hover:bg-docassist-primary-subtle">
             {switchLabel}
           </NavLink>
           <button className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
             Sign out
           </button>
         </div>
       </aside>
     );
   }
   ```

2. Wire the logout button to `useLogoutMutation` from `shared/api/auth.ts` and navigate to `/login` on settle.

3. _(Optional for Phase 01)_ Update `AppTopBar` to show breadcrumb from route metadata and user avatar.

### Decisions & Notes

---

## [F4] — Login page + LoginForm component
**Depends on:** F2, F3

### Exploration

_Explored:_ `2026-05-10` · _Verdict:_ `ready`

**Relevant patterns found:**
- `frontend/app/routes/login.tsx:1-9` — route file imports from `@pages/auth/login`. Already wired.
- `frontend/app/pages/auth/login/index.tsx` — `LoginPage` component exists.
- `frontend/app/features/auth/login-form.tsx` — `LoginForm` feature component exists. Uses `useLoginMutation` from `shared/api/auth.ts`.
- `frontend/app/shared/api/auth.ts:36-48` — `useLoginMutation` posts to `/public/auth/login` with `{ email, password }`.

**Constraints discovered:**
- Existing login form uses `email` field only (doctor login). Patient login requires `temp_login` OR `email` + `password`. Need a **mode toggle** (or separate route `/patient-login`) to support both flows.
- `useMe()` query returns `UserOut` which has `role: 'doctor' | 'patient'` after enum rename. The auth guard in `use-auth-guard.ts` should redirect based on `role`.
- `consent_152fz` is on the **register** form, not login. Login form doesn't need it.
- Existing components use Tailwind utility classes + shadcn primitives. Keep this pattern; do NOT add raw CSS or inline styles.

**Spec/contract gaps:**
- PHASE_01.md planned `frontend/app/components/auth/LoginForm.tsx` — actual location is `frontend/app/features/auth/login-form.tsx` per FSD. Do not create a duplicate.

**Risk areas:**
- Two login modes (doctor email+pass, patient temp_login+pass) in one form increases state complexity. If `/patient-login` is a separate endpoint, consider a separate `PatientLoginForm` or a conditional field in the existing form.

### Implementation Plan

**Done when:** Doctor can log in with email + password and is redirected to `/doctor`; patient can log in with `temp_login` + password and is redirected to `/`; wrong credentials show an error message; `pnpm typecheck` passes.

**Follows pattern:** `frontend/app/features/auth/login-form.tsx` (modify in-place)

**Files:**
- `frontend/app/features/auth/login-form.tsx` (modify — add mode toggle + patient temp-login)
- `frontend/app/pages/auth/login/index.tsx` (modify if needed — role redirect logic)
- `frontend/app/shared/api/auth.ts` (modify — add `usePatientLoginMutation`)

**Steps:**

1. **Add `usePatientLoginMutation`** to `frontend/app/shared/api/auth.ts`:
   ```typescript
   export function usePatientLoginMutation() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: (payload: { temp_login: string; password: string }) =>
         api.post<TokenPair>('/public/auth/patient-login', { body: payload }),
       onSuccess: tokens => {
         jwtService.set(queryClient, tokens);
         queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
       },
     });
   }
   ```

2. **Update `login-form.tsx`** to add a mode toggle:
   ```tsx
   const [mode, setMode] = useState<'doctor' | 'patient'>('doctor');
   const loginMutation = useLoginMutation();
   const patientLoginMutation = usePatientLoginMutation();

   // Doctor mode: email + password fields
   // Patient mode: temp_login + password fields
   // Toggle link: "Patient? Use your temporary login →"
   ```

3. **Role-aware redirect** after successful login: use `useMe()` to get the role, then:
   ```typescript
   onSuccess: async () => {
     const user = await refetchMe();
     navigate(user.data?.role === 'doctor' ? '/doctor' : '/');
   }
   ```

4. **Restyle** the login card using Docassist tokens: teal submit button (`bg-docassist-primary text-white`), card with `shadow-md rounded-lg bg-card`, Geist font (already active globally).

5. Update `frontend/app/routes/login.tsx` meta title: `'Login — Docassist'`.

### Decisions & Notes

---

## [F5] — Auth state (store + API interceptor)
**Depends on:** F1

### Exploration

_Explored:_ `2026-05-10` · _Verdict:_ `ready`

**Relevant patterns found:**
- `frontend/app/shared/services/jwt-service/jwt-service.ts:1-39` — **fully implemented**: `read()`, `persist()`, `set(queryClient, token)`, `hydrate(queryClient)`, `readAccessToken(queryClient)`. Tokens stored in localStorage under versioned key `template_app.auth.token`.
- `frontend/app/shared/api/client.ts:69` — `jwtService.readAccessToken(queryClient)` injected as `Authorization: Bearer` header on every request automatically.
- `frontend/app/shared/api/auth.ts:14-106` — **fully implemented**: `useAuthToken`, `useMe`, `useLoginMutation`, `useRegisterMutation`, `useRefreshMutation`, `useLogoutMutation`, `useSessionSummary`.

**Constraints discovered:**
- localStorage key is `template_app.auth.token` — update to `docassist.auth.token` (minor, not blocking for Phase 01 but worth noting).
- No automatic token refresh on 401 in the current client — `api.ts` does not intercept 401 responses. Auto-refresh is deferred; `useRefreshMutation` exists but must be called explicitly.
- `TokenPair` type is derived from OpenAPI schema (`components['schemas']['TokenPair']`). A `generate:api` script exists — this must be re-run after adding new endpoints to keep types in sync.

**Spec/contract gaps:**
- PHASE_01.md planned `frontend/app/lib/auth.ts` and `frontend/app/lib/api.ts` — these already exist as `shared/services/jwt-service/` and `shared/api/client.ts`. No new files needed.

**Risk areas:**
- TypeScript types for API schemas (`shared/types/schema.ts`) are generated from the OpenAPI spec. If backend changes are not reflected in schema.ts, the frontend will use stale types. Run `pnpm generate:api` after backend changes.

### Implementation Plan

**Done when:** Tokens persist to localStorage under `docassist.auth.token` after login; page refresh restores the session; `pnpm typecheck` passes; `pnpm generate:api` regenerates `schema.ts` with the new `PatientTempLoginRequest` and `PasswordChangeRequest` types.

**Follows pattern:** `frontend/app/shared/services/jwt-service/jwt-service.ts` — minimal edit.

**Files:**
- `frontend/app/shared/services/jwt-service/jwt-service.ts` (modify — rename storage key)

**Steps:**

1. Update the storage key constant:
   ```typescript
   const AUTH_TOKEN_STORAGE: SafeLsTypes.Key<TokenPair> = {
     key: 'docassist.auth.token',   // was 'template_app.auth.token'
     version: 2,                    // bump version to clear stale v1 tokens
     guard: isTokenPair,
   };
   ```

2. After B4 is implemented and the backend is running, run:
   ```bash
   cd frontend && pnpm generate:api
   ```
   This regenerates `app/shared/types/schema.ts` from the live OpenAPI spec, adding `PatientTempLoginRequest`, `PasswordChangeRequest`, and the updated `UserOut` / `RegisterRequest` shapes.

3. Fix any TypeScript errors introduced by the regenerated schema (e.g. `RegisterRequest` now requires `full_name`).

### Decisions & Notes

---

## [I1] — Docker Compose + .env.example verification
**Depends on:** —

### Exploration

_Explored:_ `2026-05-10` · _Verdict:_ `ready`

**Relevant patterns found:**
- `docker-compose.yml:1-75` — **fully implemented**: `db` (postgres:18-alpine), `redis` (redis:8-alpine), `backend`, `frontend`, `nginx`. All have healthchecks. `backend` depends on both `db` and `redis` being healthy.
- `.env.example:1-20` — lists all required env vars. Uses `template_app` as the database name — update to `patient_tracker` (or `docassist`). Uses `SECRET_KEY` (not `JWT_SECRET_KEY`).
- `docker-compose.override.yml` — exists; used for dev hot-reload mounts.

**Constraints discovered:**
- `backend` healthcheck hits `/api/v1/health`, confirming the health endpoint path.
- Redis service is present even though Phase 01 doesn't use it. Leave as-is; it's part of the declared stack.
- `DOMAIN` env var in `.env.example` is `[DOMAIN]` placeholder — must be set to `localhost` for development.

**Spec/contract gaps:**
- `.env.example` still has template project values: `template_app` DB name, `Template App` app description. Update to Docassist-specific values.
- PHASE_01.md env vars table lists `JWT_SECRET_KEY`/`JWT_ALGORITHM` — update to `SECRET_KEY`/`ALGORITHM` per actual Settings.

**Risk areas:**
- —

### Implementation Plan

**Done when:** `docker compose up --build` starts all 5 services and `curl http://localhost/api/v1/health` returns `{"status":"ok","db":"connected"}`; `.env.example` shows `patient_tracker` as DB name with `SECRET_KEY` / `ALGORITHM`.

**Follows pattern:** `.env.example` and `docker-compose.yml` — mostly verification + small updates.

**Files:** `.env.example` (modify — handled in B6 step 1), `docker-compose.yml` (verify only)

**Steps:**

1. `.env.example` updates are covered by **B6 step 1** — no additional changes needed here.

2. **Verify `docker-compose.yml`**:
   - Confirm `POSTGRES_DB` defaults to `patient_tracker` (or update the `:-` fallback from `template_app`).
   - Confirm nginx exposes port 80 and proxies to both backend (`:8000`) and frontend (`:3000`).
   - No structural changes required if the file is already correct.

3. **Update docker-compose.yml default** if needed:
   ```yaml
   POSTGRES_DB: ${POSTGRES_DB:-patient_tracker}
   ```
   and in the backend healthcheck URL, verify `/api/v1/health` is the path used.

4. **Smoke test** the full stack:
   ```bash
   docker compose up --build -d
   curl http://localhost/api/v1/health
   # expected: {"status":"ok","db":"connected"}
   ```

### Decisions & Notes
