# CHANGELOG — Spec & Architecture History

> Records changes to `docs/SPEC.md` and `docs/CONTEXT.md`. This is **NOT** a git commit log.
> Purpose: capture *why* the contract changed and which phases were affected.
> Format: newest entry at top.

---

## 2026-05-18 — Phase 05 complete

**Type**: phase-completion
**Author**: AI (context-update)
**Triggered by**: PHASE_05 gate passed and committed

### Changes
- UKU side-effect catalogue seeded into `se_dictionary` (bilingual `name_ru`/`name_en`, `body_system` grouping)
- Patient SE reporting: GET/POST/PATCH/DELETE `/patient/side-effects` with soft-delete and immutable event trail
- New event types written to `event_log`: `se_reported_start`, `se_severity_updated`, `se_resolved`, `se_correction`, `monitoring_rule_changed`
- Doctor SE monitoring rules: POST/DELETE `/doctor/patients/{id}/se-rules`
- Doctor SE chart: GET `/doctor/patients/{id}/charts/side-effects` — severity time-series
- Frontend: `SideEffectsList`, `SideEffectForm` (patient), `SEMonitoringModal`, `SEChart` (Recharts, doctor patient-detail page)
- Backend module `app/modules/side_effects/` with models, schemas, repository, service, dependencies, exceptions, API

### Affected Phases
- None (additive change)

### Contract Updates
- DB tables added: `se_dictionary`, `patient_side_effects`, `se_monitoring_rules`; Alembic head: `0006_side_effects`
- Endpoints added: GET /ref/se-dictionary, GET/POST/PATCH/DELETE /patient/side-effects[/{id}], POST/DELETE /doctor/patients/{id}/se-rules[/{rid}], GET /doctor/patients/{id}/charts/side-effects
- TypeScript types added: `SeDictionaryOut`, `PatientSideEffectOut`, `SeMonitoringRuleOut`, `SeSeverityDataPoint`
- No new env vars

### Notes
Patient SE DELETE is soft-delete only — the original `se_reported_start` event is preserved in `event_log` for clinical audit trail. `date_precision` field supports five granularities (`exact`, `lt_24h`, `month`, `year`, `range`) to accommodate retrospective self-reporting. SE monitoring rules are doctor-assigned per patient and link to specific `se_dictionary` entries for structured follow-up tracking.

---

## 2026-05-17 — Phase 04 complete

**Type**: phase-completion
**Author**: AI (context-update)
**Triggered by**: PHASE_04 gate passed and committed

### Changes
- Patient-facing medication endpoints: list own medications, log dose (taken/missed), add new medication, edit dose/dates, stop medication (soft-delete via `ended_at`)
- Doctor chart endpoint: GET /doctor/patients/{id}/charts/medications returning dose series per INN
- `emit()` helper added to `app/modules/events/repository.py` — used by all patient medication mutations
- New Pydantic schema: `EventLogOut` in `app/modules/events/schemas.py`
- New medication schemas: `MedicationLogIn`, `MedicationChartPoint`, `MedicationChartSeries`, `MedicationChartOut`
- New event types written to `event_log`: `dose_taken`, `dose_missed`, `drug_started`, `dose_changed`, `drug_stopped`
- Frontend: `MedicationChart` Recharts component (one line per INN, x=date, y=dose_mg) in doctor patient detail; patient home page extended with medication list and log actions
- Test suite: `tests/test_medication_tracking.py` covering all new patient and chart endpoints

### Affected Phases
- None (additive change)

### Contract Updates
- Endpoints added: GET/POST/PATCH/DELETE /api/v1/patient/medications[/{id}], PATCH /api/v1/patient/medications/{id}/log, GET /api/v1/doctor/patients/{id}/charts/medications
- TypeScript types added: `MedicationLogIn`, `EventLogOut`, `MedicationChartPoint`, `MedicationChartSeries`, `MedicationChartOut`
- No new DB tables (patient_medications from Phase 02, event_log from Phase 03); Alembic head unchanged: `0005_event_log`
- No new env vars

### Notes
All patient medication writes are ownership-gated — PATCH/DELETE return 403 if the medication belongs to another patient. `ended_at = now()` is used for soft-delete rather than hard deletion to preserve audit history. The `emit()` helper encapsulates all `event_log` inserts so mutations stay consistent.

---

## 2026-05-17 — Phase 03 complete

**Type**: phase-completion
**Author**: AI (context-update)
**Triggered by**: PHASE_03 gate passed and committed

### Changes
- ORM models: `Scale`, `ClinicalRule`, `PatientScale`, `TestCompletion`, `EventLog`
- Alembic migrations `0004_scales_patient_scales` and `0005_event_log`
- Seeder `app/seeders/scales.py`: PHQ-9 (9 Qs), GAD-7 (7 Qs), YMRS (11 items) with `clinical_rules` rows
- Reference endpoints: GET /ref/scales, GET /ref/scales/{id}/questions
- Doctor endpoints: GET/POST /doctor/patients/{id}/scales, DELETE /doctor/patients/{id}/scales/{sid} (409 guard when completions exist)
- Patient endpoints: POST /patient/tests/{patient_scale_id}/submit (score derivation + event_log emission), GET /patient/history (paginated), GET /patient/scales, GET /patient/scales/{patient_scale_id}
- `event_log` table: append-only; `test_completed` event emitted on each submission
- Frontend: `AssignTestModal` component in doctor patient detail; `/assessment/:patientScaleId` multi-step wizard; `/history` route populated; patient home page replaced with assigned-assessments list; `frontend/app/shared/api/scales.ts` API client

### Affected Phases
- None (additive change)

### Contract Updates
- DB tables added: `scales`, `clinical_rules`, `patient_scales`, `test_completions`, `event_log`; Alembic head: `0005_event_log`
- Endpoints added: GET/POST/DELETE /doctor/patients/{id}/scales[/{sid}], GET /ref/scales[/{id}/questions], POST /patient/tests/{id}/submit, GET /patient/history, GET /patient/scales[/{id}]
- TypeScript types added: `ScaleQuestion`, `ScaleOut`, `PatientScaleOut`, `TestSubmitIn`, `TestCompletionOut`
- No new env vars

### Notes
DELETE /doctor/patients/{id}/scales/{sid} returns 409 when `test_completions` exist for that `patient_scale_id`, preventing accidental cascade-deletion of clinical history. `questions_json` was added as a NOT NULL JSONB column on `scales` to serve the questions endpoint — a spec gap resolved in this phase. `event_log` is minimal (append-only) and will be extended with full timeline features in Phase 06.

---

## 2026-05-17 — Phase 02 complete

**Type**: phase-completion
**Author**: AI (context-update)
**Triggered by**: PHASE_02 gate passed and committed

### Changes
- ORM models: `Diagnosis`, `MedicationReference`, `PatientMedication`
- Alembic migration `0003_diagnoses_medications`
- Patient CRUD module: list, create (with temp credential generation), get, update, archive
- Patient repository scoped to `doctor_id`; service generates random 8-char alphanumeric temp credentials
- Diagnoses module: add and update diagnoses per patient
- Medications reference module: searchable paginated reference list with ≥5 seed entries
- Doctor medication assignment: assign medications to patients with dose/unit/frequency/dates
- All new routers wired into `app/api/v1/router.py`
- Backend tests: patient CRUD, 403 isolation, diagnoses, medications
- Doctor patient roster page (`/doctor`) with `PatientCard` grid and sort controls
- Add patient modal with temp credentials copy-to-clipboard panel
- Patient detail shell with edit mode and archive confirmation
- Diagnoses section (inline add/edit) inside patient detail
- Medication assignment section with typeahead search inside patient detail
- API service layer: `patients.ts`, `diagnoses.ts`, `medications.ts` typed wrappers
- Routes wired: `/doctor` and `/doctor/patients/:id`; Sidebar updated with doctor nav links

### Affected Phases
- None (additive change)

### Contract Updates
- DB tables added: `diagnoses`, `medications_reference`, `patient_medications`; Alembic head: `0003_diagnoses_medications`
- Endpoints added: GET/POST /doctor/patients, GET/PATCH /doctor/patients/{id}, POST /doctor/patients/{id}/archive, POST/PATCH /doctor/patients/{id}/diagnoses[/{did}], POST/PATCH /doctor/patients/{id}/medications[/{mid}], GET /ref/medications
- TypeScript types added: `PatientCreate`, `PatientOut`, `PatientCreatedOut`, `DiagnosisOut`, `MedicationReferenceOut`, `PatientMedicationOut`
- No new env vars

### Notes
Patient CRUD is fully scoped to the owning doctor — cross-doctor access returns 403. Temp credentials (login + password) are generated once on patient creation and never stored in plaintext. Color logic for PatientCard indicator is deferred to Phase 06; all cards render gray for now.

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
