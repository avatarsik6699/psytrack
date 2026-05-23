# CHANGELOG — Spec & Architecture History

> Records changes to `docs/SPEC.md` and `docs/CONTEXT.md`. This is **NOT** a git commit log.
> Purpose: capture *why* the contract changed and which phases were affected.
> Format: newest entry at top.

---

## 2026-05-23 — Generated demo/design artifacts marked for removal

**Type**: spec-change
**Author**: AI (spec-sync)
**Triggered by**: Architect clarified that UI elements generated as design/demo artifacts must not ship when they are not backed by product specification or business logic.

### Changes
- `docs/SPEC.md` updated from `v1.6` to `v1.7`
- `TopBar` and `Sidebar` component contracts now explicitly forbid production doctor/patient role switching and cross-role view toggles
- Phase 09 now contains a **Production Artifacts — К Удалению** section
- Phase 09 audit/gate requirements now require finding and removing generated/demo artifacts before close
- Phase 08 design-reference notes now clarify that the `Врач / Пациент` top-bar switch was a generated design artifact, not production behavior

### Affected Phases
- PHASE_09 — must remove or strictly dev-guard the listed artifacts during frontend cleanup
- PHASE_08 — historical documentation annotated only; completed implementation is not reopened

### Contract Updates
- No backend endpoint, DB schema, env var, or active CONTEXT contract change
- Frontend production contract tightened: no cross-role top-bar switch, no out-of-scope doctor settings/schedule affordances, no hardcoded production identity data, no visible production demo credential helpers

### Notes
Known artifacts marked **К удалению**: top-bar `Врач` / `Пациент` links, `/doctor/settings` or `/doctor/schedule` nav affordances, hardcoded doctor chrome identity such as `Волков А.Н.`, and production-visible demo credential helper UI.

---

## 2026-05-23 — Profile and credential reset design references added

**Type**: spec-change
**Author**: AI (spec-sync)
**Triggered by**: Architect added new `docs/assets/` references for doctor profile, patient profile, and doctor-side patient credential reset.

### Changes
- `docs/SPEC.md` updated from `v1.5` to `v1.6`
- SPEC §5.1 now includes `/doctor/profile` as a Phase 09 doctor route target
- SPEC §5.3 inventories `doctor-profile-page.png`, `doctor-profile-page-dark.png`, `doctor-reset-login-pass-for-patient-page.png`, and `patient-profile-page.png`
- Patient profile, doctor profile, credential reset, and global language/theme control placement are no longer treated as missing visual references
- Phase 09 now maps `/doctor/profile`, patient `/profile`, and doctor credential reset UX to the new canonical screenshots
- Phase 08 design-reference notes now record the newly supplied patient profile screenshot for historical traceability

### Affected Phases
- PHASE_09 — pending implementation must use the newly supplied profile and credential-reset references
- PHASE_08 — completed phase documentation updated only to replace the historical "no screenshot yet" note for patient `/profile`

### Contract Updates
- Frontend route target added for Phase 09: `/doctor/profile`
- No backend endpoint, DB schema, env var, or active CONTEXT contract change

### Notes
`/doctor/settings` and `/doctor/schedule` remain out of scope. `/history`, auth screens, and responsive states still require derived design work or future screenshots.

---

## 2026-05-23 — Patient credential model and real history scope clarified

**Type**: spec-change
**Author**: AI (spec-sync)
**Triggered by**: Architect clarified MVP patient authentication and profile requirements: patients should use doctor-issued/self-changed login/password, not email/password; doctors must be able to reset patient credentials; `/history` must show real data; notifications are in-app visual indicators only.

### Changes
- `docs/SPEC.md` updated from `v1.4` to `v1.5`
- Patient email/password login and email-based recovery removed from MVP scope
- Patient login/password management added: patient self-change, generic login-unavailable errors, and doctor reset that returns a new login/password once
- Current-session/token metadata added for profile UX, while full token inventory, device management, refresh-token revocation, and revoke-all-sessions are deferred to a later auth hardening phase
- `/history` clarified as a real completed-assessment history screen backed by `GET /patient/history`
- Browser push, web push, email notifications, and server-side notification contracts deferred; Phase 09 may use only in-app visual indicators such as badges, counters, highlighted rows, and a bell icon
- Phase 09 route inventory now explicitly covers public, patient, and doctor routes and excludes `/doctor/settings` and `/doctor/schedule`

### Affected Phases
- PHASE_09 — scope expanded from pure frontend refactor to include narrowly scoped patient credential/session API work and doctor credential reset

### Contract Updates
- Endpoints to add: `GET /api/v1/public/auth/session`, `PATCH /api/v1/patient/me/credentials`, `POST /api/v1/doctor/patients/{patient_id}/credentials/reset`
- Types to add: `SessionInfoOut`, `PatientCredentialUpdateIn`, `PatientCredentialResetOut`
- Existing patient login column remains `patients.temp_login`; API/UI copy should present it as patient "login"
- Possible narrow DB migration: case-insensitive unique constraint/index for patient login if current DB semantics do not enforce it
- No appointment, notification-delivery, or token-store tables are added in this clarification

### Notes
Do not fake server-side token revocation in the UI. Until a persistent token/session store exists, token management is limited to current-session metadata and clearing tokens for the current browser session.

---

## 2026-05-23 — Removed undefined doctor settings and schedule routes from MVP scope

**Type**: spec-change
**Author**: AI (spec-sync)
**Triggered by**: Architect clarified that `/doctor/settings` and `/doctor/schedule` were likely design/specification artefacts and should not become implementation scope without explicit product logic.

### Changes
- `docs/SPEC.md` updated from `v1.3` to `v1.4`
- Removed `/doctor/settings` and `/doctor/schedule` from SPEC §5.1 doctor page contract
- Removed doctor settings/schedule reference-gap language from SPEC §5.3 and Phase 09 scope
- Added explicit Phase 09 non-goal: do not add `/doctor/settings` or `/doctor/schedule` frontend routes unless a later phase defines user value, route logic, and contracts

### Affected Phases
- PHASE_09 — scope updated before implementation; requires architect review before coding starts

### Contract Updates
- No backend contract change
- No DB schema change
- No API endpoint change
- No env var change
- Frontend route contract reduced: `/doctor/settings` and `/doctor/schedule` are no longer MVP routes

### Notes
Patient `/profile` and `/history` remain in Phase 09. Appointment backend work remains out of scope.

---

## 2026-05-23 — Phase 09 replanned for frontend design completion

**Type**: spec-change
**Author**: AI (spec-sync)
**Triggered by**: Architect requested replacing Phase 09 appointments/notifications with a full frontend design-system completion and UX refactor after Phase 08 visual gaps were identified.

### Changes
- `docs/SPEC.md` updated from `v1.2` to `v1.3`
- SPEC §5.3 now inventories current `docs/assets/` design references and records known missing reference gaps: login/role entry, profile/settings, global language/theme controls, history/schedule placeholders, and responsive states
- SPEC §8 Phase 09 changed from "Appointments & Notifications" to "Frontend Design-System Completion & UX Refactor"
- SPEC §8.1 added detailed Phase 09 scope covering visual audit, global chrome, auth UX, patient portal, doctor portal, design-system refactor, responsive/accessibility pass, and frontend regression coverage

### Affected Phases
- PHASE_09 — new pending phase initialized from the updated SPEC scope
- Completed PHASE_08 is not reopened; its residual visual/reference debt is carried forward into PHASE_09

### Contract Updates
- No backend contract change
- No DB schema change
- No API endpoint change
- No env var change

### Notes
Appointments, notification expansion, appointment DB model, schedule endpoints, and push/web/email notification work are deferred until the implemented frontend matches the Docassist reference system.

---

## 2026-05-23 — Phase 08 complete

**Type**: phase-completion
**Author**: AI (context-update)
**Triggered by**: PHASE_08 gate passed and committed

### Changes
- Patient portal polish: dashboard stat cards, tests list, medications daily log, side effects list, 4-step side effect wizard, assessment success screen, and patient profile page
- `GET /api/v1/patient/tasks`: patient-scoped pending tasks for dashboard stats and sidebar badges
- `GET /api/v1/patient/me`: patient self-profile with email/onboarding status and joined doctor identity
- `PATCH /api/v1/public/auth/me/email`: authenticated email binding/update endpoint for doctor or patient users
- Full frontend refactor across patient, doctor, chart, shared UI, layout, and route modules following `docs/FRONTEND_CONVENTIONS.md`
- Removed template `app-top-bar.tsx` artifact and moved language/theme controls into sidebar chrome
- Added shared frontend utilities and conventions for safe JSON/localStorage access, runtime env access, date handling, typed search params, and typed router access
- Added semantic severity/status color tokens, shadcn UI primitives (`badge`, `tabs`, `dialog`, `select`, `scroll-area`, `separator`), mobile-first responsive sidebar, and doctor portal visual alignment
- Expanded frontend tests, including phase 08 smoke coverage plus utility tests for date, safe JSON, and safe localStorage helpers

### Affected Phases
- None (additive change)

### Contract Updates
- Endpoints added: `GET /api/v1/patient/tasks`, `GET /api/v1/patient/me`, `PATCH /api/v1/public/auth/me/email`
- TypeScript/API schemas added: `PatientMeOut`, `EmailUpdateIn`; `TaskOut` reused from Phase 06 for the new patient tasks endpoint
- UI routes added or completed: `/dashboard`, `/tests`, `/drugs`, `/side-effects`, `/profile`, `/assessment/:patientScaleId`
- No new DB tables; Alembic head unchanged: `0009_therapy_goals`
- No new env vars

### Notes
Phase 08 is contract-additive on the backend and primarily frontend-facing. Frontend API shapes continue to come from generated OpenAPI types in `frontend/app/shared/types/schema.ts`; raw API escape hatches, raw router hooks, raw search-param handling, raw localStorage/JSON, and direct `import.meta.env` access are now documented as forbidden project conventions.

---

## 2026-05-18 — Phase 07 complete

**Type**: phase-completion
**Author**: AI (context-update)
**Triggered by**: PHASE_07 gate passed and committed

### Changes
- `therapy_goals` table added (Alembic migration `0009_therapy_goals`): stores per-patient therapy goals with `description`, `is_completed`, and `created_at`
- `TherapyGoal` ORM model + `TherapyGoalOut` Pydantic schema in `app/modules/therapy_goals/`
- `GET /api/v1/doctor/patients/{id}/charts/scores`: returns `ScoreChartSeries[]` — one series per assigned scale with `scoreMin`, `scoreMax`, `improvementDirection`, and time-series `points` (score + baseline flag + ISO timestamp)
- Therapy goals CRUD: `GET/POST /doctor/patients/{id}/goals`, `PATCH /doctor/patients/{id}/goals/{gid}`
- `PatientOut` extended (B3) with three computed fields: `adherencePercent: float | null` (30-day event_log window), `latestScores: ScoreSnapshot[]` (latest score per active scale with severity label), `activeMedicationsSummary: MedSummary[]` (active patient_medications rows)
- Frontend `ScoreChart` (Recharts `LineChart`, multi-series: PHQ-9 teal, GAD-7 purple, YMRS amber; dot markers; weekly x-axis; delta chip)
- Frontend `AssessmentResultsTable` (DATE / TEST / SCORE / INTERPRETATION severity badge / Δ)
- Frontend `PatientHeader` (colored-initials avatar, severity badge pills, adherence %, card-color status chip, active medication chips, action buttons)
- Frontend `DiagnosisTabSwitcher` (one tab per patient diagnosis)
- Frontend `TherapyGoals` sidebar panel (checkbox list, teal progress bar, PATCH on toggle)
- Full `/doctor/patients/:id` detail page composed of PatientHeader, DiagnosisTabSwitcher, ScoreChart, MedicationChart, SEChart, EventTimeline, TherapyGoals, and right-sidebar panels
- `PatientCard` roster enhancements: PHQ-9/GAD-7 score+severity pills, adherence color progress bar, active medication chips, list/grid toggle
- `app/modules/scales/charts.py`: score chart service and router
- `app/modules/scales/severity.py`: severity label mapping utility
- E2e smoke test `frontend/tests/e2e/phase-07-smoke.spec.ts` covering critical path
- Unit tests for score utilities (`frontend/tests/score-utils.test.ts`): severity label mapping, delta computation, week-label formatter

### Affected Phases
- None (additive change)

### Contract Updates
- DB tables added: `therapy_goals`; Alembic head: `0009_therapy_goals`
- Endpoints added: `GET /api/v1/doctor/patients/{id}/charts/scores`, `GET /api/v1/doctor/patients/{id}/goals`, `POST /api/v1/doctor/patients/{id}/goals`, `PATCH /api/v1/doctor/patients/{id}/goals/{gid}`
- Endpoint modified: `GET /api/v1/doctor/patients` and `GET /api/v1/doctor/patients/{id}` — `PatientOut` extended with `adherencePercent`, `latestScores`, `activeMedicationsSummary`
- TypeScript types added: `TherapyGoalOut`, `ScoreChartPoint`, `ScoreChartSeries`, `ScoreSnapshot`, `MedSummary`
- No new env vars

### Notes
Score chart series carry `scoreMin`/`scoreMax`/`improvementDirection` directly so the frontend can render correct axis bounds and delta-arrow direction without re-fetching the scale reference. `PatientOut` B3 fields are computed on the fly from `event_log` and `patient_medications` — no denormalized columns added. Adherence is a 30-day rolling window counting `dose_taken` events against expected dose frequency. Severity labels ("Minimal"/"Mild"/"Moderate"/"Mod. Severe"/"Severe") are derived from per-scale thresholds in `app/modules/scales/severity.py`.

---

## 2026-05-18 — Phase 06 complete

**Type**: phase-completion
**Author**: AI (context-update)
**Triggered by**: PHASE_06 gate passed and committed

### Changes
- `tasks` table added (Alembic migrations `0007_tasks` + `0008_tasks_constraints`): stores generated task rows (`pending`/`done`/`missed`/`snoozed`) for missed medications, test reminders, and SE monitoring reports
- `Task` ORM model + `TaskOut` Pydantic schema in `app/modules/tasks/`
- Color computation service (`app/modules/patients/color_service.py`): pure function implementing §3.2 SE-priority rules; produces `card_color: "red" | "yellow" | "green" | "gray"`
- `GET /api/v1/doctor/patients` extended: `PatientOut` now includes `card_color` field; response sorted red → yellow → green → gray
- `GET /api/v1/doctor/patients/{id}/events`: paginated event timeline with `EventTimelinePage` response (`items`, `total`, `page`, `size`)
- `POST /api/v1/system/tasks/generate`: internal endpoint guarded by `X-Internal-Key` header; generates task rows for all active patients; returns `{ generated: int }`
- APScheduler lifespan hook in FastAPI: calls task generation daily automatically
- Frontend `EventTimeline` component rendered in doctor patient detail page (`/doctor/patients/:id`)
- `PatientCard` left-border color strip wired to `card_color` API field

### Affected Phases
- None (additive change)

### Contract Updates
- DB tables added: `tasks`; Alembic head: `0008_tasks_constraints`
- Endpoints added: `GET /api/v1/doctor/patients/{id}/events`, `POST /api/v1/system/tasks/generate`
- Endpoint modified: `GET /api/v1/doctor/patients` — `PatientOut` extended with `card_color`; response sort order changed to red → yellow → green → gray
- TypeScript types updated: `PatientOut` (new `card_color` field); new generated types `TaskOut`, `EventTimelinePage`
- No new env vars (`INTERNAL_KEY` uses default `CHANGE_ME_INTERNAL_KEY` from config; should be overridden in production)

### Notes
Color logic follows SPEC §3.2: `red` = active SE with severity ≥ 3, or missed medication in last 48 h, or overdue test; `yellow` = active SE severity 1–2, or medication missed in last 7 days; `green` = all checks nominal; `gray` = no data / patient newly added. The `event_log` table (created in Phase 03) is append-only — the timeline endpoint adds read-only pagination without touching the model. Task generation is idempotent per day: duplicate rows for the same `(patient_id, task_type, due_at::date)` are skipped.

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
