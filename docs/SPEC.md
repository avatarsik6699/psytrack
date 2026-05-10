# TECHNICAL SPECIFICATION (SPEC.md): `Patient Tracker — Docassist`

> **For AI agent**: Read this file in full before starting any phase.
> Confirm understanding of constraints and the phased development model.
> When this file changes, run `/spec-sync [description of change]` immediately.

## Metadata

| Field | Value |
|-------|-------|
| Document Version | `v1.2` |
| Date | `2026-05-09` |
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
| Temporary login/password for patient | EMR/HIS integration, multi-tenant org model |
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
         temp_login TEXT UNIQUE, temp_password_hash TEXT,
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
| POST | `/auth/patient-login` | — | Patient login via `temp_login`/`temp_password` or email+pass |
| PATCH | `/auth/me/password` | bearer | Change password (patient or doctor) |
| PATCH | `/auth/me/email` | bearer | Bind / update email |

### 4.2 Doctor — Patient management

| Verb | Path | Auth | Notes |
|------|------|------|-------|
| GET | `/doctor/patients` | doctor | Roster with computed card color, sorted red→gray |
| POST | `/doctor/patients` | doctor | Create patient; returns `temp_login`/`temp_password` |
| GET | `/doctor/patients/{id}` | doctor | Full patient detail payload |
| PATCH | `/doctor/patients/{id}` | doctor | Update profile fields |
| POST | `/doctor/patients/{id}/archive` | doctor | Set `archived_at` |

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

| Verb | Path | Auth | Notes |
|------|------|------|-------|
| GET | `/doctor/appointments` | doctor | All scheduled appointments |
| POST | `/doctor/patients/{id}/appointments` | doctor | Schedule appointment |
| PATCH | `/doctor/appointments/{aid}` | doctor | Reschedule/cancel |

### 4.5 Patient — Tasks & data entry

| Verb | Path | Auth | Notes |
|------|------|------|-------|
| GET | `/patient/tasks` | patient | Today's task list |
| GET | `/patient/history` | patient | Paginated activity log |
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
| `/` (patient home) | Dashboard | `GreetingHeader`, `TaskCard` (×3 types), `StatBar`, `CareTeamCard`, `NextAppointmentCard`, `RecentActivityList`, `DailyReminder` |
| `/assessment/:patientScaleId` | Assessment wizard | `AssessmentHeader` (progress bar), `QuestionCard`, `AnswerOption`, `NavButtons` |
| `/history` | Activity history | `FilterTabs`, `ActivityTable`, `StatusBadge` |
| `/profile` | Patient profile | `EmailBindForm`, `PasswordChangeForm`, `NotificationToggle` |

#### Doctor views

| Route | Page | Key components |
|-------|------|----------------|
| `/doctor` | Patient roster | `PatientCard` (color-coded), `SortControls`, `AddPatientModal` |
| `/doctor/patients/:id` | Patient detail | `PatientHeader`, `DiagnosisTabSwitcher`, `MedicationChart`, `ScoreChart`, `SEChart`, `EventTimeline`, `TherapyGoals`, `AssignTestModal`, `SEMonitoringModal`, `NextAppointmentCard` (Reschedule only; no Join Call link) |
| `/doctor/schedule` | Schedule | `AppointmentList`, `AppointmentCard` (no "Join Call" — telehealth link removed from MVP scope) |
| `/doctor/settings` | Settings | `ProfileForm` |

### 5.2 Components

| Component | Purpose |
|-----------|---------|
| `Sidebar` | Left nav (180 px); role-aware links; `DoctorView` / `PatientView` toggle at bottom |
| `TopBar` | Breadcrumb + notifications bell + user avatar |
| `TaskCard` | Unified task tile; variants: `test`, `medication`, `side_effect`; status badge |
| `StatusBadge` | Color pill: `completed` (blue) / `logged` (green) / `flagged` (red) / `pending` (amber) / `optional` (gray) |
| `PatientCard` | Roster card with color indicator strip (red/yellow/green/gray) |
| `LineChart` | Recharts-based; shared for medication / scores / SE |
| `AssessmentHeader` | Purple header with step indicator dots and progress bar |
| `EventTimeline` | Vertical timeline; append-only entries |
| `TherapyGoals` | Checkbox list with completion bar |
| `StatBar` | Three KPI cells (Tasks Done / Next Appt / Medication) |
| `CareTeamCard` | Doctor info + Message / Schedule buttons |

### 5.3 Design References

The following screens were provided as Figma/UI reference (Docassist brand):

1. **Patient Home** — Today's tasks in cards, right sidebar with stats, care team, appointment, recent activity, and motivational quote.
2. **PHQ-9 Assessment wizard** — Purple header with question counter + dot progress bar; radio answer options with score values; Back/Next buttons.
3. **Activity History** — Filterable full-width table; colored status badges (Completed / Logged / Flagged).
4. **Doctor Patient Detail** — Patient header with severity tags; tabbed diagnosis switcher; dual-line trend chart (PHQ-9 green, GAD-7 purple); right sidebar with appointment, therapy goals, and side effects.

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
| `09` | Appointments & Notifications | Appointment scheduling; in-app task reminders | Appointment model, schedule endpoints, due-task badge, DailyReminder widget |

---

## 9. Out of Scope

- Document verification or medical license checks for doctors.
- Email invitations to patients (temp credentials shared offline/messenger).
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
| 5 | Telehealth "Join Call" | **Removed from scope entirely.** Appointments UI shows Reschedule only. External video-service integration is out of scope (§9). |
