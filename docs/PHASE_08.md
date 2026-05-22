# PHASE 08 — Patient Portal Polish

<!-- TOKEN BUDGET: keep this file under 10,000 tokens. Be concise. -->

## Phase Metadata

| Field | Value |
|-------|-------|
| Phase | `08` |
| Title | Patient Portal Polish |
| Status | `⏳ in-progress` |
| Tag | `v0.08.0` |
| Depends on | PHASE_07 gate passing |

---

## Phase Goal

Phase 08 completes the patient-facing portal. It delivers four dedicated patient pages (home dashboard, tests list, medications daily log, side effects) plus a 4-step "Add Side Effect" wizard, a test completion success screen, and dynamic sidebar badge counts. The backend adds the missing `GET /patient/tasks` and `GET /patient/me` endpoints, and the `PATCH /auth/me/email` auth endpoint. After this phase a patient can navigate the full portal, log medications, report side effects, and complete assigned tests within a coherent UI. Profile/account settings and activity history pages are included as SPEC-required deliverables (no design screenshot yet — implemented from SPEC §5.1 descriptions).

---

## Design References

Screenshots in `docs/assets/patient-profile-*` (10 files). All screens share the same chrome:
- **TopBar**: black `#111827` bar; "PsychTrack" logo left; "Врач / Пациент" role-toggle pills right.
- **Sidebar** (180 px, white): brand logo + subtitle "Мониторинг" at top; 4 nav links with teal active state and red badge counters; patient avatar + full name + "34 года · Пациент" pinned at bottom.

---

### 1. Home — `patient-profile-main-page.png`
Main content area, no right sidebar. Layout:
- Date line (gray): "Четверг, 22 мая 2025"
- Heading: "Добрый день, [Name]" + subtitle "Как вы себя чувствуете сегодня?"
- **3 horizontal stat cards** (rounded, ~equal width, `--radius-lg`):
  - **Medications card** (teal-tinted bg): pill icon; "0/2" large number; "ПРИЁМОВ СЕГОДНЯ" label; "Препараты" title; "0 из 2 принято сегодня" muted sub-line.
  - **Tests card** (purple/lavender-tinted bg): clipboard icon; "1 просрочено" amber badge top-right; "1" large; "ОЖИДАЕТ" label; "Тесты" title; "1 ожидает прохождения" muted sub-line.
  - **Side Effects card** (amber-tinted bg): warning triangle icon; "2" large; "АКТИВНЫХ" label; "Побочные эффекты" title; "2 активных" muted sub-line.
- **"Текущие препараты"** card section below: list rows — colored dot + drug name + dose, frequency right-aligned as muted "Не отмечено" or status.

Sidebar nav badges: "Тесты" badge "1" (red), "Побочные эффекты" badge "2" (red).

---

### 2. Tests List — `patient-profile-tests-page.png`
- Heading: "Тесты" + subtitle "Опросники, назначенные врачом"
- Test card (white, rounded): scale icon (square, amber bg) + scale name "PHQ-9" + "Просрочен" amber badge + description "Оценка депрессии · Последний результат: 14 (17 мая)" + "Пройти" teal button (right).
- Sidebar: "Тесты" nav link active (teal bg).

---

### 3. Test Assessment Wizard — `patient-profile-test-steps-form-page.png`
Design polish for existing `/assessment/:patientScaleId` route:
- Header bar (white): "← К тестам" back link (teal) + scale title "PHQ-9 — Оценка депрессии" + "1 / 9" step counter (right); blue-teal progress bar beneath.
- Question area: context text (gray, small) → bold question text → 4 radio option cards (full-width, white, `--radius-md`); selected option highlighted.
- "Далее →" full-width button (gray/disabled until option selected; teal when active).

---

### 4. Test Success Screen — `patient-profile-test-success-page.png`
Post-submission screen (shown after `POST /patient/tests/{patient_scale_id}/submit`):
- Centered layout: large green circle (`--color-success-500`) with white checkmark.
- "Тест пройден!" heading.
- "Ответы переданы врачу" subtitle.
- "Результат PHQ-9: 14 — умеренная депрессия" muted line (score + severity label).
- "К списку тестов" teal button → navigates to `/tests`.

---

### 5. Medications Log — `patient-profile-drugs-page.png`
- Heading: "Препараты" + subtitle "Отметьте приём на сегодня, [date]"
- Medication rows (white card): pill icon (teal bg) + name + "1×/день · с [date]" + **"✓ Принял" / "Пропустил"** toggle buttons (outlined; selected state: teal-filled).
- Dashed "+ Добавить препарат" button at bottom (full width).

---

### 6. Side Effects List — `patient-profile-side-effects-page.png`
- Heading: "Побочные эффекты" + subtitle "Сообщайте об изменениях самочувствия" + "+ Добавить" teal button (top right).
- "АКТИВНЫЕ (N)" section label.
- SE card (white, **red left border strip** for active): name + "UKU N" severity badge (danger) + severity label badge (orange) + "ЦНС · с [date]" + "✓ Прошёл" green outline button (right).

---

### 7. Add SE Wizard — 4 steps
**Step 1 "Выбор симптома"** (`patient-profile-add-side-effect-first-step-page.png`):
- Wizard header bar: "← Назад" + "Добавить побочный эффект" title + "Выбор симптома" muted step label (right) + 4-segment progress bar (step 1 filled teal).
- "Что вас беспокоит?" heading.
- Body-system filter tabs (pill toggle): Психические (active, blue) | ЦНС | Вегетативные | ЖКТ | Кожные | Другое.
- Symptom grid (2-column, rounded cards): tappable symptom names from se_dictionary filtered by body_system.

**Step 2 "Тяжесть"** (`patient-profile-add-side-effect-second-step-page.png`):
- "Насколько тяжело?" + selected symptom name (gray).
- Severity rows (0–4): numbered + label; selected row has amber border + amber text.
- "← Назад" + "Далее →" teal button.

**Step 3 "Длительность"** (`patient-profile-add-side-effect-third-step-page.png`):
- "Как давно это началось?" + symptom name.
- Duration options: "Менее 24 часов" / "24 часа и более" (radio-style cards; selected has blue border).
- Date picker: "Дата начала" label + `<input type="date">`.
- "← Назад" + "Далее →".

**Step 4 "Подтверждение"** (`patient-profile-add-side-effect-final-step-page.png`):
- "Подтверждение" heading.
- Summary table (label/value rows): Симптом · Категория · Тяжесть (UKU N — label) · Начало · Длительность.
- "← Назад" + "Сохранить" teal button → calls `POST /patient/side-effects`.

---

### 8. Profile Page — no screenshot yet
Implemented from SPEC §5.1: `EmailBindForm`, `PasswordChangeForm`, `NotificationToggle` placeholder. Update this section when screenshots are added to `docs/assets/`.

---

## Scope

### Backend
- [x] `B1` `GET /api/v1/patient/tasks` — patient's pending task list from `tasks` table (filtered by `patient_id` + `status = 'pending'`); response `TaskOut[]`; used to compute stat-card counts on home page — _Depends on:_ —
- [x] `B2` `GET /api/v1/patient/me` — patient self-profile: `id`, `fullName`, `email`, `emailVerified`, `onboardingComplete` + joined doctor `fullName` and `specialty`; used by `GreetingHeader`, sidebar footer, and profile page — _Depends on:_ —
- [x] `B3` `PATCH /api/v1/public/auth/me/email` — bind / update email for authenticated user (doctor or patient); body `{ email }`; response `{ ok: true }` — _Depends on:_ —

### Frontend
- [x] `F1` Patient home dashboard (`/dashboard`) — `GreetingHeader` (date + greeting + subtitle), 3 stat cards (`MedStatCard`, `TestStatCard`, `SEStatCard`) with live counts from `B1` + `GET /patient/medications`, "Текущие препараты" list section; sidebar badge counts wired — _Depends on:_ `B1`, `B2`
- [x] `F2` Tests page (`/tests`) — `TestsList`: one card per assigned scale (icon + name + status badge + last result line + "Пройти" button linking to `/assessment/:patientScaleId`); uses existing `GET /patient/scales` — _Depends on:_ —
- [x] `F3` Medications daily-log page (`/drugs`) — list of active meds with "Принял" / "Пропустил" toggle (calls existing `PATCH /medications/{id}/log`); "+ Добавить препарат" dashed button (existing `POST /patient/medications` flow or inline form) — _Depends on:_ —
- [x] `F4` Side effects page (`/side-effects`) — "АКТИВНЫЕ (N)" section header; SE cards with left-border severity color, badges, "Прошёл" resolve button; "+ Добавить" triggers SE wizard — _Depends on:_ —
- [x] `F5` Add SE 4-step wizard (`SEWizard`) — step 1: body-system filter tabs + symptom grid (from `GET /ref/se-dictionary`); step 2: severity 0–4 selector; step 3: duration options + date picker; step 4: confirmation summary; submits via `POST /patient/side-effects` — _Depends on:_ `F4`
- [x] `F6` Test success screen — post-submit state on assessment route: green checkmark circle, "Тест пройден!", score + severity interpretation, "К списку тестов" button — _Depends on:_ —
- [x] `F7` Assessment wizard design polish — update `/assessment/:patientScaleId` chrome to match screenshot: "← К тестам" back link, "N / Total" counter top-right, teal progress bar, full-width radio option cards, disabled "Далее →" until selection — _Depends on:_ —
- [x] `F8` Patient profile page (`/profile`) — `EmailBindForm` → calls `B3`; `PasswordChangeForm` → calls existing `PATCH /auth/me/password`; `NotificationToggle` UI-only placeholder; uses `B2` to prefill current email — _Depends on:_ `B2`, `B3`

### Frontend Tests
- [x] `FT1` `frontend/tests/e2e/phase-08-smoke.spec.ts` — smoke: home stat cards render (or empty state), tests page shows scale list, medications page shows log buttons, SE page shows add button, profile form renders; min one `test()` per new route — _Depends on:_ `F1`, `F2`, `F3`, `F4`, `F8`
- [x] `FT2` Unit tests for `activityLabel(eventType)` utility and SE wizard step-validation logic — mark `n/a` and check off if no new pure-logic utilities — _Depends on:_ —

---

## Files

### Create / modify
~~~
# Backend — modify
app/modules/tasks/api.py              # add GET /patient/tasks patient-scoped route
app/modules/tasks/schemas.py          # verify/add TaskOut
app/modules/tasks/service.py          # add get_patient_tasks(patient_id, db)
app/modules/patients/api.py           # add GET /patient/me route
app/modules/patients/schemas.py       # add PatientMeOut
app/modules/patients/service.py       # add get_patient_me(user_id, db)
app/modules/auth/api.py               # add PATCH /auth/me/email route
app/modules/auth/schemas.py           # add EmailUpdateIn

# Frontend — new routes
frontend/app/routes/tests.tsx         # Tests list page
frontend/app/routes/drugs.tsx         # Medications daily-log page
frontend/app/routes/side-effects.tsx  # Side effects page

# Frontend — modify existing routes
frontend/app/routes/dashboard.tsx                       # wire real data
frontend/app/pages/dashboard/ui/dashboard-page.tsx      # full stat-card implementation
frontend/app/routes/profile.tsx                         # full ProfilePage
frontend/app/routes/assessment.$patientScaleId.tsx      # add success screen state + design polish

# Frontend — new components
frontend/app/components/patient/MedStatCard.tsx
frontend/app/components/patient/TestStatCard.tsx
frontend/app/components/patient/SEStatCard.tsx
frontend/app/components/patient/CurrentMedsList.tsx
frontend/app/components/patient/TestCard.tsx
frontend/app/components/patient/MedLogCard.tsx
frontend/app/components/patient/SECard.tsx
frontend/app/components/patient/SEWizard.tsx
frontend/app/components/patient/SEWizardSymptomStep.tsx
frontend/app/components/patient/SEWizardSeverityStep.tsx
frontend/app/components/patient/SEWizardDurationStep.tsx
frontend/app/components/patient/SEWizardConfirmStep.tsx
frontend/app/components/patient/TestSuccessScreen.tsx
frontend/app/components/patient/EmailBindForm.tsx
frontend/app/components/patient/PasswordChangeForm.tsx

# Frontend — new API hooks
frontend/app/shared/api/tasks.ts          # usePatientTasks()
frontend/app/shared/api/patient-me.ts    # usePatientMe()

# Frontend — modify shared
frontend/app/layouts/patient-layout.tsx   # sidebar badge counts (tasks + active SE)
frontend/app/routes.ts                    # register /tests, /drugs, /side-effects
frontend/app/schema.ts                    # regenerate: pnpm generate:api

# Tests
frontend/tests/e2e/phase-08-smoke.spec.ts
~~~

### Do NOT touch
- Any existing Alembic migration files
- `app/modules/events/models.py` (append-only)
- `app/modules/therapy_goals/` (Phase 07; not in scope)
- `frontend/app/components/doctor/` (doctor UI)
- `frontend/app/routes/doctor/` (doctor routes)
- `docs/SPEC.md`, `docs/CONTEXT.md`

---

## Contracts

> This section is the source of truth for `/context-update`.

### New persistent data (tables / collections / files)

None — all tables already exist.

### New API endpoints / RPC methods / events

| Method | Path | Auth | Response / Payload |
|--------|------|------|--------------------|
| `GET` | `/api/v1/patient/tasks` | patient JWT | `TaskOut[]` |
| `GET` | `/api/v1/patient/me` | patient JWT | `PatientMeOut` |
| `PATCH` | `/api/v1/public/auth/me/email` | bearer (doctor or patient) | `{ ok: true }` |

### New types / models / shared interfaces

```typescript
interface TaskOut {
  id: string;
  taskType: 'test' | 'medication_log' | 'se_report';
  referenceId: string | null;
  dueAt: string;           // ISO datetime
  status: 'pending' | 'done' | 'missed' | 'snoozed';
  createdAt: string;
}

interface PatientMeOut {
  id: string;
  fullName: string;
  email: string | null;
  emailVerified: boolean;
  onboardingComplete: boolean;
  doctorFullName: string;
  doctorSpecialty: string | null;
}
```

### New env vars

None

---

## Gate Checks

> **Before running gate:** confirm all Scope checkboxes are checked (or explicitly deferred in
> Architect Review Notes). Unchecked items appear in the gate report as a warning, not a hard block.

Run `/phase-gate 08` before committing.

`/phase-gate` returns full PASS only when:
- Automated checks are green
- All architect review items below are resolved (checked off)

Use the commands in [docs/STACK.md](./STACK.md#gate-commands) as the source of truth for gate commands.

**Frontend test coverage check (hard requirement):** `FT1` must be checked, or deferral documented in Architect Review Notes.

```bash
# Phase 08 smoke checks (replace {token} with valid patient JWT)
curl -s http://localhost:8000/api/v1/patient/tasks \
  -H "Authorization: Bearer {token}"
# expected: JSON array; each item has id, taskType, dueAt, status

curl -s http://localhost:8000/api/v1/patient/me \
  -H "Authorization: Bearer {token}"
# expected: JSON object with id, fullName, onboardingComplete, doctorFullName
```

---

## Architect Review Notes

- [x] No architect review issues recorded

---

## Atomic Commit Message

```
feat(phase-08): patient portal — home stats, tests, drugs, side-effect wizard
```

---

## Post-Phase Checklist

- [ ] All Scope checkboxes checked (or deferred in Architect Review Notes)
- [x] `FT1` checked — `frontend/tests/e2e/phase-08-smoke.spec.ts` exists, or deferral documented
- [ ] `docs/PHASE_08_NOTES.md` complete — Implementation Plans filled, key decisions recorded
- [ ] All automated gate checks green
- [ ] All architect review notes resolved
- [ ] `docs/CONTEXT.md` updated — run `/context-update 08`
- [ ] `docs/STATE.md` phase row updated to `✅ done`
- [ ] `docs/CHANGELOG.md` entry added (if contracts changed)
- [ ] Committed atomically on `feat/phase-08` branch
- [ ] Tag created after merge to develop: `git tag -a v0.08.0 -m "Phase 08: Patient Portal Polish"`
