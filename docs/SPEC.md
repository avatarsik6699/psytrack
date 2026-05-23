# TECHNICAL SPECIFICATION (SPEC.md): `Patient Tracker — Docassist`

> **For AI agent**: Read this file in full before starting any phase.
> Confirm understanding of constraints and the phased development model.
> When this file changes, run `/spec-sync [description of change]` immediately.

## Metadata

| Field | Value |
|-------|-------|
| Document Version | `v1.7` |
| Date | `2026-05-23` |
| Architect / Owner | `v.godlevskiy` |
| Contract Version | `v1.0` (see `docs/CONTEXT.md`) |
| Stack | See [docs/STACK.md](./STACK.md) |
| Domain | `Psychiatric inter-visit monitoring` |
| Brief source | `docs/TEMP_SPEC.md` + design screenshots (Docassist reference UI) |

---

## 1. Project Overview and Goals

### 1.1 Problem

Psychiatrists and psychotherapists currently lack a lightweight tool to track patient progress *between* appointments. Medication adherence, symptom dynamics, and side effects are reported verbally at each visit, leading to incomplete data, missed adverse events, and wasted consultation time.

### 1.2 Goal and Success Metrics

Build **Docassist** — a web-based inter-visit monitoring platform for psychiatry/psychotherapy that:

1. Saves doctor time at appointments (structured summary replaces verbal reports).
2. Provides fast visual understanding of therapy dynamics (color-coded roster + trend charts).
3. Tracks side effects precisely using a UKU-based catalogue.
4. Reduces missed clinical details.
5. Improves patient medication adherence.
6. Simplifies dose → effect → tolerability analysis.

**Measurable acceptance criteria (MVP):**
- Doctor can review a full patient summary (meds, test scores, side effects) in < 2 minutes.
- Patient completes a PHQ-9/GAD-7 task without support from clinic staff.
- Missed medication events are captured within 24 h of the scheduled dose.
- All test results appear on the doctor's chart within 5 s of patient submission.

### 1.3 Project Boundaries

| Included (MVP) | Excluded (V2+) |
|----------------|----------------|
| Doctor registration (email + password) | Document verification, e-mail invite to patient |
| Doctor-issued patient login/password, patient self-change, doctor credential reset | Patient email/password login, email-based account recovery |
| Soft onboarding with flexible dates | Multi-domain symptom scales, predictive models |
| Color logic: side-effect severity > clinical dynamics | Chart overlays, automated clinical conclusions |
| 3 chart types (medications / test scores / UKU side effects) | Push notifications, email campaigns |
| Immutable event timeline with timestamp | Emergency alerts, doctor-handoff workflow |
| In-app task queue (cron-based) | Mobile-native app |
| Patient archiving (> 90 days inactive) | Patient-initiated doctor search |

---

## 2. Domain Context

### 2.1 Roles and Permissions

| Role | Capabilities | Restrictions |
|------|-------------|--------------|
| `doctor` | Create/archive patients; assign diagnoses, scales, medications; set monitoring rules; view all charts; manage therapy goals | Cannot impersonate patients; cannot edit completed test answers |
| `patient` | Log medication (taken/missed); **add and edit own medications** (all changes produce `drug_started`/`dose_changed`/`drug_stopped` events visible to the doctor); complete assigned tests; report/edit/delete side effects (indefinitely); view own tasks and history | Cannot change diagnoses, scale assignments, or monitoring rules; cannot view other patients |
| `AI_Agent` | Implements phases, runs gate checks | No push to main/develop; no destructive migrations without explicit instruction |

### 2.2 Key Entities

```
Doctor ──< Patient ──< Diagnosis ──< PatientScale ──< TestCompletion
                  ──< PatientMedication
                  ──< PatientSideEffect ──< SEMonitoringRule
                  ──< EventLog
                  ──< Task
                  ──< Appointment
                  ──< TherapyGoal
```

---

## 3. Data Model

```sql
-- Auth / identity
users(id UUID PK, email TEXT UNIQUE NOT NULL, password_hash TEXT,
      role TEXT CHECK(role IN ('doctor','patient')),
      email_verified BOOL DEFAULT false, created_at TIMESTAMPTZ)

doctor_profiles(id UUID PK, user_id UUID FK users, full_name TEXT,
                specialty TEXT, created_at TIMESTAMPTZ)

patients(id UUID PK, doctor_id UUID FK doctor_profiles,
         full_name TEXT NOT NULL, birth_date DATE, gender TEXT,
         temp_login TEXT UNIQUE, temp_password_hash TEXT,  -- patient login/password credential pair
         email TEXT, email_verified BOOL DEFAULT false,
         onboarding_complete BOOL DEFAULT false,
         archived_at TIMESTAMPTZ, created_at TIMESTAMPTZ)

-- Configuration tables (seed data, rarely mutated)
scales(id UUID PK, code TEXT UNIQUE,         -- PHQ9, GAD7, UKU, YMRS …
       name TEXT, score_min INT, score_max INT,
       improvement_direction TEXT CHECK(improvement_direction IN ('lower','higher')),
       domains_json JSONB)                   -- deferred for V2

clinical_rules(id UUID PK, diagnosis_icd TEXT,
               scale_id UUID FK scales,
               control_point_days INT,        -- e.g. 42 for depression
               response_threshold_pct INT,    -- e.g. 50 (%)
               response_threshold_abs INT)    -- e.g. 5 points

se_dictionary(id UUID PK, uku_code TEXT UNIQUE,
              name_ru TEXT NOT NULL,          -- displayed to patient/doctor in Russian
              name_en TEXT NOT NULL,          -- displayed when locale = 'en'; bilingual confirmed
              body_system TEXT,               -- psychic / neurological / autonomic …
              severity_min INT DEFAULT 0, severity_max INT DEFAULT 4)

medications_reference(id UUID PK, inn TEXT, brand_names JSONB)

-- Per-patient clinical data
diagnoses(id UUID PK, patient_id UUID FK patients, icd_code TEXT,
          name TEXT, is_primary BOOL DEFAULT false,
          date_diagnosed DATE, notes TEXT, created_at TIMESTAMPTZ)

patient_scales(id UUID PK, patient_id UUID FK patients,
               diagnosis_id UUID FK diagnoses, scale_id UUID FK scales,
               frequency_days INT, assigned_by UUID FK doctor_profiles,
               created_at TIMESTAMPTZ)

test_completions(id UUID PK, patient_id UUID FK patients,
                 patient_scale_id UUID FK patient_scales,
                 scale_id UUID FK scales, score INT NOT NULL,
                 answers_json JSONB, baseline BOOL DEFAULT false,
                 completed_at TIMESTAMPTZ NOT NULL)

patient_medications(id UUID PK, patient_id UUID FK patients,
                    medication_id UUID FK medications_reference,
                    dose_mg NUMERIC, unit TEXT,
                    frequency TEXT,           -- "once daily", "PRN", …
                    started_at DATE, ended_at DATE,
                    dose_precision TEXT CHECK(dose_precision IN ('exact','approx','range')),
                    created_by_role TEXT,     -- 'doctor' | 'patient' — determines event origin
                    created_at TIMESTAMPTZ)
-- NOTE: patient writes to this table are fully permitted; every insert/update must
-- emit a corresponding event_log entry (drug_started / dose_changed / drug_stopped)
-- so the doctor sees the full change audit in the event timeline.

patient_side_effects(id UUID PK, patient_id UUID FK patients,
                     se_id UUID FK se_dictionary, severity INT CHECK(severity BETWEEN 0 AND 4),
                     started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ,
                     date_precision TEXT CHECK(date_precision IN ('exact','lt_24h','month','year','range')),
                     duration_label TEXT,     -- e.g. "<24h"
                     resolved BOOL DEFAULT false,
                     notes TEXT, created_at TIMESTAMPTZ)

se_monitoring_rules(id UUID PK, patient_id UUID FK patients,
                    se_id UUID FK se_dictionary,
                    frequency_days INT,
                    assigned_by UUID FK doctor_profiles, created_at TIMESTAMPTZ)

-- Event timeline (append-only)
event_log(id UUID PK, patient_id UUID FK patients,
          event_type TEXT NOT NULL,           -- see §3.1
          payload JSONB,
          occurred_at TIMESTAMPTZ NOT NULL,   -- actual time of the clinical event
          created_at TIMESTAMPTZ NOT NULL,    -- server receipt time
          created_by UUID FK users)

-- Appointments, goals, tasks
appointments(id UUID PK, patient_id UUID FK patients,
             doctor_id UUID FK doctor_profiles,
             scheduled_at TIMESTAMPTZ, type TEXT,  -- 'in_person' | 'telehealth'
             status TEXT)

therapy_goals(id UUID PK, patient_id UUID FK patients,
              description TEXT, is_completed BOOL DEFAULT false,
              created_at TIMESTAMPTZ)

tasks(id UUID PK, patient_id UUID FK patients,
      task_type TEXT,         -- 'test' | 'medication_log' | 'se_report'
      reference_id UUID,      -- FK to patient_scales / patient_medications / se_monitoring_rules
      due_at TIMESTAMPTZ, status TEXT,  -- 'pending' | 'done' | 'missed' | 'snoozed'
      created_at TIMESTAMPTZ)
```

### 3.1 Event Types (event_log.event_type)

`drug_started` · `dose_changed` · `dose_taken` · `dose_missed` · `drug_stopped`
· `test_completed` · `se_reported_start` · `se_severity_updated` · `se_resolved`
· `se_correction` · `diagnosis_updated` · `monitoring_rule_changed` · `patient_archived`

### 3.2 Patient card color rules (computed, not stored)

Priority: **side effects > clinical dynamics**

| Color | Condition |
|-------|-----------|
| 🔴 Red | ≥ 1 SE with severity 3–4 **OR** negative clinical dynamics at control point |
| 🟡 Yellow | > 3 SE with severity 1 **OR** ≥ 1 SE with severity 2 **OR** expected improvement not reached at control point |
| 🟢 Green | Positive dynamics **AND** ≤ 3 SE severity-1 **AND** 0 SE severity ≥ 2 |
| ⚪ Gray | Insufficient data (< 7 days of therapy or no test results) |

---

## 4. API / Backend Contract

Base path: `/api/v1`. JWT Bearer auth on all protected routes.

### 4.1 Auth

| Verb | Path | Auth | Notes |
|------|------|------|-------|
| POST | `/auth/register` | — | Doctor registration; creates `users` + `doctor_profiles` |
| POST | `/auth/login` | — | Returns `access_token` (JWT) + `refresh_token` |
| POST | `/auth/refresh` | refresh token | Rotates tokens |
| POST | `/auth/patient-login` | — | Patient login via patient `login` + password only |
| PATCH | `/auth/me/password` | bearer | Change current user's password; patient changes update the patient credential password |
| GET | `/auth/session` | bearer | Current-session metadata derived from JWT/client context; no multi-session store in MVP |

Patient login/password rules:
- MVP patients do **not** authenticate by email/password. Patient email may exist later as contact
  data only; it is not a login identifier in MVP.
- `patients.temp_login` is the current technical column for the patient login. UI copy should call it
  "login", not "temporary login", once the patient has accepted/changed credentials.
- Patient login is globally unique, case-insensitive if the DB collation/type supports it; API
  responses must never reveal whether a specific login belongs to another patient.
- Login update failures use a generic validation message, e.g. "This login cannot be used. Try
  another one."
- Full server-side refresh-token inventory, device list, and revoke-all-sessions require a persistent
  token/session store and are deferred until a dedicated auth hardening phase. MVP must not fake
  revocation beyond clearing tokens for the current browser session.

### 4.2 Doctor — Patient management

| Verb | Path | Auth | Notes |
|------|------|------|-------|
| GET | `/doctor/patients` | doctor | Roster with computed card color, sorted red→gray |
| POST | `/doctor/patients` | doctor | Create patient; returns `temp_login`/`temp_password` |
| GET | `/doctor/patients/{id}` | doctor | Full patient detail payload |
| PATCH | `/doctor/patients/{id}` | doctor | Update profile fields |
| POST | `/doctor/patients/{id}/archive` | doctor | Set `archived_at` |
| POST | `/doctor/patients/{id}/credentials/reset` | doctor | Generate a new patient login/password pair, replace existing credentials, return plaintext once |

### 4.3 Doctor — Clinical configuration

| Verb | Path | Auth | Notes |
|------|------|------|-------|
| POST | `/doctor/patients/{id}/diagnoses` | doctor | Add diagnosis |
| PATCH | `/doctor/patients/{id}/diagnoses/{did}` | doctor | Update diagnosis |
| POST | `/doctor/patients/{id}/scales` | doctor | Assign scale + frequency to patient |
| DELETE | `/doctor/patients/{id}/scales/{sid}` | doctor | Remove scale assignment |
| POST | `/doctor/patients/{id}/medications` | doctor | Add medication |
| PATCH | `/doctor/patients/{id}/medications/{mid}` | doctor | Edit dose/dates |
| POST | `/doctor/patients/{id}/se-rules` | doctor | Set SE monitoring rule |
| DELETE | `/doctor/patients/{id}/se-rules/{rid}` | doctor | Remove SE rule |
| GET/POST/PATCH | `/doctor/patients/{id}/goals` | doctor | Therapy goals CRUD |
| GET | `/doctor/patients/{id}/events` | doctor | Paginated event timeline |

### 4.4 Doctor — Appointments

Deferred. Appointment DB/API work is not part of the implemented MVP until a later phase defines
explicit product value and contracts.

### 4.5 Patient — Tasks & data entry

| Verb | Path | Auth | Notes |
|------|------|------|-------|
| GET | `/patient/tasks` | patient | Today's task list |
| GET | `/patient/history` | patient | Paginated completed assessment history (`TestCompletionPage`) |
| POST | `/patient/tests/{patient_scale_id}/submit` | patient | Submit test answers + score |
| PATCH | `/patient/medications/{id}/log` | patient | Log taken/missed |
| GET | `/patient/medications` | patient | Current medication list |
| POST | `/patient/medications` | patient | **Add new medication** (emits `drug_started` event; visible to doctor) |
| PATCH | `/patient/medications/{id}` | patient | Edit dose/dates (emits `dose_changed` event) |
| DELETE | `/patient/medications/{id}` | patient | Stop medication (emits `drug_stopped` event; soft-delete, keeps history) |
| POST | `/patient/side-effects` | patient | Report new SE |
| PATCH | `/patient/side-effects/{id}` | patient | Edit SE (creates `se_correction` event) |
| DELETE | `/patient/side-effects/{id}` | patient | Mark deleted (soft; original event preserved) |
| GET | `/patient/side-effects` | patient | List patient's SE |
| GET | `/patient/me` | patient | Current patient profile + linked doctor identity |
| PATCH | `/patient/me/credentials` | patient | Change own patient login and/or password using current password |

### 4.6 Reference data

| Verb | Path | Auth | Notes |
|------|------|------|-------|
| GET | `/ref/scales` | bearer | List available scales |
| GET | `/ref/scales/{id}/questions` | bearer | Questions for a scale |
| GET | `/ref/se-dictionary` | bearer | Paginated/searchable UKU catalogue |
| GET | `/ref/medications` | bearer | Searchable medication reference (INN + brand) |

### 4.7 Charts / analytics

| Verb | Path | Auth | Notes |
|------|------|------|-------|
| GET | `/doctor/patients/{id}/charts/medications` | doctor | Medication dose series per INN |
| GET | `/doctor/patients/{id}/charts/scores` | doctor | Test score series per scale |
| GET | `/doctor/patients/{id}/charts/side-effects` | doctor | SE severity timeline |

### 4.8 Internal / system

| Verb | Path | Auth | Notes |
|------|------|------|-------|
| POST | `/system/tasks/generate` | internal (cron) | Generate due tasks (missed meds, scheduled tests) |
| GET | `/health` | — | Liveness probe |

---

## 5. Frontend / Client Contract

Stack: React Router v7, TypeScript, pnpm. Shared between both roles; route-level auth guard redirects by `role`.

### 5.1 Pages

#### Patient views

| Route | Page | Key components |
|-------|------|----------------|
| `/login` | Login | `LoginForm`, role-aware redirect |
| `/` (patient home) | Dashboard | `GreetingHeader`, `TaskCard` (×3 types), `StatBar`, `CareTeamCard`, `RecentActivityList`, in-app indicator badges |
| `/assessment/:patientScaleId` | Assessment wizard | `AssessmentHeader` (progress bar), `QuestionCard`, `AnswerOption`, `NavButtons` |
| `/history` | Assessment history | `FilterTabs`, `ActivityTable`, `StatusBadge`, empty/loading/error states backed by `GET /patient/history` |
| `/profile` | Patient profile | `PatientCredentialForm`, `PasswordChangeForm`, `SessionInfoPanel`, in-app notification preferences placeholder |

#### Doctor views

| Route | Page | Key components |
|-------|------|----------------|
| `/doctor` | Patient roster | `PatientCard` (color-coded), `SortControls`, `AddPatientModal` |
| `/doctor/patients/:id` | Patient detail | `PatientHeader`, `DiagnosisTabSwitcher`, `MedicationChart`, `ScoreChart`, `SEChart`, `EventTimeline`, `TherapyGoals`, `AssignTestModal`, `SEMonitoringModal`, `PatientCredentialResetAction` |
| `/doctor/profile` | Doctor profile | `DoctorProfileCard`, `PreferenceControls`, `SessionInfoPanel`, `AccessTokenPanel` |

### 5.2 Components

| Component | Purpose |
|-----------|---------|
| `Sidebar` | Left nav (180 px); role-aware links only for the authenticated role; no cross-role view switching |
| `TopBar` | Brand/header area + in-app indicator bell + current-user affordance; no doctor/patient role switch |
| `TaskCard` | Unified task tile; variants: `test`, `medication`, `side_effect`; status badge |
| `StatusBadge` | Color pill: `completed` (blue) / `logged` (green) / `flagged` (red) / `pending` (amber) / `optional` (gray) |
| `PatientCard` | Roster card with color indicator strip (red/yellow/green/gray) |
| `LineChart` | Recharts-based; shared for medication / scores / SE |
| `AssessmentHeader` | Purple header with step indicator dots and progress bar |
| `EventTimeline` | Vertical timeline; append-only entries |
| `TherapyGoals` | Checkbox list with completion bar |
| `StatBar` | Three KPI cells (Tasks Done / Pending Tests / Medication) |
| `CareTeamCard` | Doctor info only; message/schedule actions are deferred |

### 5.3 Design References

Design references live in [`docs/assets/`](./assets/) and are the canonical visual target for
frontend implementation. Phase documents must inventory the relevant screenshots before planning
frontend work.

Current provided references:

1. **Doctor roster** — `patients-list-page.png`, `patients-list-empty-page.png`.
2. **Add patient flow** — `add-patient-form-first-step.png`, `add-patient-form-second-step.png`, `add-patient-form-third-step.png`.
3. **Doctor patient detail** — `patient-detail-overview-tab-page.png`, `patient-detail-dynamics-tab-page.png`, `patient-detail-drugs-tab-page.png`, `patient-detail-side-effects-tab-page.png`, `patient-detail-events-log-tab-page.png`.
4. **Doctor profile** — `doctor-profile-page.png`, `doctor-profile-page-dark.png`.
5. **Doctor patient credential reset** — `doctor-reset-login-pass-for-patient-page.png`.
6. **Patient portal** — `patient-profile-main-page.png`, `patient-profile-tests-page.png`, `patient-profile-test-steps-form-page.png`, `patient-profile-test-success-page.png`, `patient-profile-drugs-page.png`, `patient-profile-side-effects-page.png`, `patient-profile-page.png`.
7. **Patient side-effect wizard** — `patient-profile-add-side-effect-first-step-page.png`, `patient-profile-add-side-effect-second-step-page.png`, `patient-profile-add-side-effect-third-step-page.png`, `patient-profile-add-side-effect-final-step-page.png`.

Known reference gaps to close in Phase 09:

1. **Login and role entry** — no explicit visual reference currently exists for doctor/patient login,
   role selection, patient login/password login, registration links, or auth error states.
2. **Assessment history** — `/history` has real backend data but lacks complete visual reference
   coverage for MVP-quality UI.
3. **Responsive states** — desktop screenshots are present; mobile/tablet sidebar, dialogs, and
   long-content states must be derived from the design system and verified explicitly.

### 5.4 Design System

All design tokens are canonical source-of-truth for the frontend implementation. Defined here; to be materialized as CSS custom properties (`:root`) and/or a Tailwind config extension.

#### Color tokens

```css
/* Brand */
--color-primary-500: #0D9E7E;   /* main teal — primary actions, active nav, brand logo */
--color-primary-400: #27B594;   /* teal hover */
--color-primary-300: #4EC9AB;   /* teal light */
--color-primary-100: #E6F7F3;   /* teal surface tint (active nav bg, light badges) */
--color-primary-50:  #F0FBF8;

/* Accent / Assessments */
--color-accent-500:  #5B5BD6;   /* purple-violet — assessment UI, secondary actions */
--color-accent-400:  #7C7CE8;   /* accent hover */
--color-accent-100:  #EDEDFB;   /* accent surface tint */

/* Semantic */
--color-success-500: #22C55E;
--color-success-100: #DCFCE7;
--color-warning-500: #F59E0B;   /* amber — Due Today badge, Pending status */
--color-warning-100: #FEF3C7;
--color-danger-500:  #EF4444;   /* red — Flagged status, red card indicator, Urgent */
--color-danger-100:  #FEE2E2;
--color-info-500:    #3B82F6;   /* blue — Completed status badge */
--color-info-100:    #DBEAFE;

/* Neutral / Gray scale */
--color-gray-50:  #F9FAFB;      /* page background */
--color-gray-100: #F3F4F6;      /* subtle section bg */
--color-gray-200: #E5E7EB;      /* borders, dividers */
--color-gray-300: #D1D5DB;
--color-gray-400: #9CA3AF;      /* placeholder text, muted labels */
--color-gray-500: #6B7280;      /* secondary body text */
--color-gray-600: #4B5563;      /* primary body text */
--color-gray-700: #374151;
--color-gray-800: #1F2937;
--color-gray-900: #111827;      /* headings */
--color-white:    #FFFFFF;
```

#### Typography tokens

```css
/* Font family */
--font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Font sizes */
--font-size-xs:   11px;
--font-size-sm:   12px;
--font-size-base: 14px;
--font-size-md:   16px;
--font-size-lg:   18px;
--font-size-xl:   20px;
--font-size-2xl:  24px;
--font-size-3xl:  30px;

/* Font weights */
--font-weight-normal:    400;
--font-weight-medium:    500;
--font-weight-semibold:  600;
--font-weight-bold:      700;

/* Line heights */
--line-height-tight:  1.25;
--line-height-snug:   1.375;
--line-height-normal: 1.5;
```

#### Spacing scale

```css
--space-1:   4px;
--space-2:   8px;
--space-3:   12px;
--space-4:   16px;
--space-5:   20px;
--space-6:   24px;
--space-8:   32px;
--space-10:  40px;
--space-12:  48px;
--space-16:  64px;
```

#### Border radius

```css
--radius-sm:   4px;
--radius-md:   8px;    /* inputs, small cards */
--radius-lg:   12px;   /* content cards */
--radius-xl:   16px;   /* large modal cards */
--radius-full: 9999px; /* pills, avatars, badges */
```

#### Shadows

```css
--shadow-xs: 0 1px 2px  rgba(0, 0, 0, 0.05);
--shadow-sm: 0 2px 4px  rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 8px  rgba(0, 0, 0, 0.08);
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.10);
```

#### Layout / structure tokens

```css
--sidebar-width:       180px;
--sidebar-right-width: 270px;   /* patient home right panel */
--topbar-height:       52px;
--content-max-width:   1440px;
--card-padding:        var(--space-6);
```

#### Component states

| State | Token |
|-------|-------|
| Focus ring | `0 0 0 3px rgba(13, 158, 126, 0.35)` |
| Disabled opacity | `0.45` |
| Hover brightness | `brightness(0.95)` |

#### Status badge color mapping

| Status key | Background | Text |
|-----------|-----------|------|
| `completed` | `--color-info-100` | `--color-info-500` |
| `logged` | `--color-success-100` | `--color-success-500` |
| `flagged` | `--color-danger-100` | `--color-danger-500` |
| `pending` | `--color-warning-100` | `--color-warning-500` |
| `optional` | `--color-gray-100` | `--color-gray-500` |
| `due_today` | `--color-warning-100` | `--color-warning-500` |
| `urgent` | `--color-danger-100` | `--color-danger-500` |

#### Patient card color strip

| Color key | Left-border / indicator |
|-----------|------------------------|
| `red` | `--color-danger-500` |
| `yellow` | `--color-warning-500` |
| `green` | `--color-primary-500` |
| `gray` | `--color-gray-300` |

---

## 6. Infrastructure

- **Runtime**: Docker Compose (development + staging). See `docker-compose.yml`.
- **Backend**: FastAPI on `uvicorn` (port 8000), Nginx reverse proxy (port 80/443).
- **Database**: PostgreSQL 16 (asyncpg in production, aiosqlite in tests).
- **Migrations**: Alembic (`uv run alembic upgrade head`).
- **Frontend**: Static React build served by Nginx under `/`.
- **Task scheduling**: Python `APScheduler` or a Celery Beat–lite cron job inside the backend container. Generates `tasks` rows daily.
- **Secrets**: injected via environment variables; see `.env.example`.
- **Production**: separate `docker-compose.prod.yml`; TLS termination at Nginx.

---

## 7. Non-Functional Requirements

### Security
- JWT access tokens: 15-minute TTL. Refresh tokens: 7 days, rotation-on-use.
- Passwords hashed with bcrypt (cost ≥ 12).
- Row-level isolation: all queries scoped to `doctor_id` or `patient_id`; no cross-patient data leakage.
- Diagnoses, monitoring rules, and doctor notes not visible in patient API responses.
- Rate limiting on auth endpoints (see `app/core/rate_limit.py`).
- Temp credentials must be rotatable by doctor at any time.

### Performance
- Patient roster endpoint: < 300 ms p95 for up to 200 patients.
- Chart data endpoints: < 500 ms p95.
- Frontend LCP: < 2.5 s on mid-range device.

### Observability
- Structured JSON logging (FastAPI + uvicorn).
- Each request logged with `request_id`, `user_id`, `duration_ms`.
- Health endpoint `/health` for container liveness.

### Data integrity
- `event_log` is append-only (no `UPDATE`/`DELETE` at DB level — enforce via SQLAlchemy model).
- SE corrections create a new `se_correction` event; original record is never mutated.
- Retroactive data entry (backdating events) is prohibited in the UI and rejected by the API.

### Accessibility
- WCAG 2.1 AA color contrast for all text on backgrounds.
- Keyboard-navigable forms (assessment wizard, task cards).
- All interactive elements have accessible labels.

---

## 8. Phased Delivery Plan

| Phase | Title | Goal | Key Outputs |
|-------|-------|------|-------------|
| `01` | Foundation & Auth | Working skeleton with auth flows for both roles | DB schema (users, patients, doctor_profiles), JWT auth endpoints, React Router shell, login page, sidebar |
| `02` | Patient Management | Doctor can create and manage patients | Patient CRUD, temp credential generation, diagnoses, medication assignment, patient roster (no color logic yet) |
| `03` | Scale & Assessment Engine | Patient can complete assigned tests; doctor assigns scales | Scale/clinical_rules seed data (**PHQ-9, GAD-7, YMRS** in MVP; HAM-D deferred to V2), patient_scales, test submission, score calculation, test history |
| `04` | Medication Tracking | Patient logs meds; doctor sees logs | Medication log events, `dose_taken`/`dose_missed` event types, patient medication view, doctor medication chart |
| `05` | Side Effects | Patient reports SE; doctor assigns monitoring rules | UKU SE dictionary seed, SE reporting flow, SE monitoring rules, SE chart data |
| `06` | Event Timeline & Color Logic | Full event audit trail; patient card color computed | append-only event_log, color computation service, task generation cron, doctor roster with color sorting |
| `07` | Charts & Doctor Detail | Visual analytics page for doctor | Medication/score/SE chart endpoints, React charts (Recharts), doctor patient detail page, therapy goals |
| `08` | Patient Portal Polish | Complete patient UX | Today's tasks dashboard, activity history page, profile page, onboarding soft-gate |
| `09` | Frontend Design-System Completion & UX Refactor | Bring the implemented MVP frontend to the Docassist design target and complete patient credential/profile gaps | Visual audit, patient credential/session API, real history UI, doctor credential reset, global language/theme controls, responsive/accessibility pass, e2e smoke coverage |

---

### 8.1 Phase 09 Detailed Scope

Phase 09 replaces the previous "Appointments & Notifications" plan. Appointment scheduling and
notification expansion remain deferred until the implemented MVP frontend matches the design
system and reference screenshots.

**Goal:** perform a full design-system completion and UX refactor across doctor, patient, and
public auth surfaces, plus the narrowly scoped patient credential/session API work required by the
profile and recovery UX.

**Required outputs:**

1. **Design/reference audit**
   - Create a per-route audit of current frontend screens against `docs/assets/`.
   - Document which existing screenshots are authoritative for each route and which missing screens
     are derived from the shared Docassist chrome/tokens.
   - Record missing reference gaps for future screenshots without blocking implementation of
     already-defined functionality.

2. **Global application chrome**
   - Align doctor, patient, and public auth layouts with the same Docassist visual language:
     sidebar/top-bar spacing, active states, badges, avatar blocks, typography, empty states,
     loading states, and error states.
   - Place `LanguageSwitcher` and `ThemeToggle` visibly in the shared navigation/account chrome for
     both roles, with mobile-safe states.
   - Preserve existing i18n/theme functionality; this phase is about visual integration and
     interaction polish, not new localization semantics.
   - Remove production UI artifacts that came from generated design/demo scaffolding rather than
     product requirements. The authenticated role is fixed by the token and backend authorization;
     the UI must not offer a doctor/patient view switch unless a later spec defines impersonation or
     role-switching semantics.

3. **Public auth UX**
   - Redesign `/login` to support doctor login, patient login/password login, and clear role
     switching in a single reference-aligned screen.
   - Patient email/password login is explicitly out of MVP scope.
   - Align `/register` with the same auth visual system and doctor registration contract.
   - Cover validation, loading, error, and redirect states.

4. **Patient portal completion**
   - Reconcile `/dashboard`, `/tests`, `/assessment/:patientScaleId`, `/drugs`, `/side-effects`,
     `/profile`, and `/history` with the patient-profile references and SPEC §5.1. Use
     `patient-profile-page.png` as the canonical `/profile` target for login/password,
     preferences, and current-session layout.
   - Finish `/history` as a real completed-assessment history screen backed by
     `GET /patient/history`; do not leave it as a placeholder.
   - Implement profile visual states: patient login/password change, current-session/token
     metadata, in-app notification placeholder, account identity, and linked doctor information.
   - Patient credential edits must use generic login-validation errors and must not disclose whether
     another patient owns a rejected login.
   - Ensure task badges, test overdue states, medication log states, side-effect severity states,
     and success screens are visually consistent.

5. **Doctor portal completion**
   - Reconcile `/doctor`, `/doctor/profile`, add-patient modal, and `/doctor/patients/:id` tabs
     with the doctor roster/detail/add-patient/profile references. Use `doctor-profile-page.png`
     and `doctor-profile-page-dark.png` as canonical light/dark profile targets.
   - Add a doctor-only credential reset action for a patient. It generates a new login/password
     pair, replaces the existing pair, returns plaintext once, and is visibly framed as account
     recovery rather than routine editing. Use `doctor-reset-login-pass-for-patient-page.png` as
     the canonical modal target.
   - Ensure chart panels, tab bars, modals, right-side clinical panels, empty states, and long data
     states match the reference density and spacing.

6. **Design-system refactor**
   - Consolidate repeated page/card/status styles into shared primitives where it reduces real
     duplication.
   - Keep API-derived frontend types sourced from `frontend/app/shared/types/schema.ts`.
   - Preserve `docs/FRONTEND_CONVENTIONS.md`: kebab-case files, `type` over `interface`,
     `React.FC<Props>`, `props.x`, named `Fx` effects, typed router/search-param helpers, and no raw
     API escape hatches.

7. **Responsive, accessibility, and regression coverage**
   - Verify desktop, tablet, and mobile states for every public, doctor, and patient route in scope.
   - Confirm WCAG 2.1 AA contrast, keyboard navigation, focus indicators, accessible names, and
     no text overlap/truncation in core workflows.
   - Add/update e2e smoke tests for auth, patient portal, real history, patient credential profile
     controls, doctor roster/detail, add-patient modal, doctor credential reset controls, language
     switcher, theme toggle, and responsive navigation.
   - Add unit tests for any new pure utilities introduced during the refactor.

**Explicit non-goals for Phase 09:**

- New appointment DB model, migrations, or schedule endpoints.
- `/doctor/settings` or `/doctor/schedule` frontend routes unless a later phase defines explicit
  user value, route logic, and contracts.
- Any production-facing role impersonation, cross-role "view as", or doctor/patient toggle that is
  not backed by a real authorization contract.
- Patient email/password login or email-based account recovery.
- Push, browser, web, or email notifications. Phase 09 may use in-app visual indicators only:
  badges, counters, highlighted task rows, and a bell icon that reflects already-loaded in-app state.
- Server-side token inventory, device management, revoke-all-sessions, or refresh-token blacklist.
- New clinical calculations or unrelated backend contracts beyond patient credentials/session.
- Manual edits to generated `frontend/app/shared/types/schema.ts`.

**Known generated/demo artifacts to remove in Phase 09:**

- **К удалению:** `TopBar` doctor/patient links (`Врач` / `Пациент`) that navigate between role
  areas. They are a design/demo artifact and violate the app's role model.
- **К удалению:** any `/doctor/settings` or `/doctor/schedule` navigation affordance still present
  in frontend chrome. Those routes remain out of MVP scope.
- **К удалению:** hardcoded demo identity in production chrome, e.g. doctor footer text such as
  `Волков А.Н.` / `Психиатр`; use authenticated profile data or a loading/empty state.
- **К удалению или строгому dev-only guard:** visible demo credential helpers in auth UI. Production
  builds must not expose seed/demo login values or fill-buttons.

## 9. Out of Scope

- Document verification or medical license checks for doctors.
- Email invitations to patients (patient credentials are shared offline/messenger).
- EMR / HIS integration.
- Multi-domain symptom scale analysis (domains within PHQ-9, etc.).
- Predictive models, AI-generated clinical conclusions.
- Chart overlays (medication + score on same axis).
- Push notifications (web or mobile).
- Email newsletters or reminders.
- Emergency alert system.
- Doctor-handoff / practice transfer workflow.
- Mobile-native app.
- Patient-initiated doctor search or marketplace.
- Telehealth "Join Call" deep-link (external video service integration).

---

## 10. Open Questions

All questions resolved — no open items.

| # | Question | Decision |
|---|----------|----------|
| 1 | SE editing window | Patient may edit a reported side effect **indefinitely**. Each edit creates a `se_correction` event in the timeline; the original entry is never mutated. |
| 2 | Medication self-add | Patient **can** add, edit, and stop their own medications. Every write emits the corresponding event (`drug_started` / `dose_changed` / `drug_stopped`) so the doctor sees the full change audit in the timeline. See §2.1 and §4.5. |
| 3 | UKU catalogue locale | **Bilingual (RU + EN)**. Both `name_ru` and `name_en` are required fields on `se_dictionary`. UI locale switching is a §8 Phase 05 concern. |
| 4 | Scale seed scope | **PHQ-9, GAD-7, YMRS** ship in MVP. HAM-D deferred to V2. Clinical rules configured per scale per diagnosis per TEMP_SPEC §3. |
| 5 | Telehealth "Join Call" | **Removed from MVP scope entirely.** Appointment UI/API is deferred until a later phase; external video-service integration is out of scope (§9). |
| 6 | Patient credentials | MVP patients authenticate only with doctor-issued/self-changed login/password. Patient email/password login and email recovery are deferred. Doctor can reset patient credentials for recovery. |
| 7 | Notifications | MVP notification UX is in-app-only visual indicators. Browser push, email, background delivery, and server-side notification contracts are deferred. |
