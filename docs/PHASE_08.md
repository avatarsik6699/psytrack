# PHASE 08 — Patient Portal Polish

<!-- TOKEN BUDGET: keep this file under 10,000 tokens. Be concise. -->

## Phase Metadata

| Field | Value |
|-------|-------|
| Phase | `08` |
| Title | Full Frontend Refactoring — Design Alignment & Code Conventions |
| Status | `⏳ in-progress` |
| Tag | `v0.08.0` |
| Depends on | PHASE_07 gate passing |

---

## Phase Goal

Phase 08 was originally "Patient Portal Polish." It has been expanded to cover a **full frontend refactoring** of both portals (patient + doctor) based on the Architect Review Notes.

**Original deliverables (all done):** four patient pages (home dashboard, tests list, medications log, side effects), a 4-step "Add Side Effect" wizard, test success screen, dynamic sidebar badge counts, and the backend endpoints `GET /patient/tasks`, `GET /patient/me`, `PATCH /auth/me/email`.

**Expanded scope (this phase extension):**
- **R8** — Remove template artifact components (app-top-bar.tsx).
- **R9** — Apply `FRONTEND_CONVENTIONS.md` rules to doctor components, chart components, shared UI, layouts, and doctor routes (kebab-case filenames, `type` not `interface`, `React.FC<Props>`, `props.x` notation, no destructuring, `Fx` useEffect names).
- **R10** — Design system completion: semantic color tokens for severity/status, missing shadcn components (badge, tabs, dialog, select, scroll-area, separator), mobile-first responsive sidebar, visual alignment of doctor portal pages to design screenshots.
- **R11** — Complete R7: verify unit tests pass, expand E2E coverage to doctor routes and assessment wizard flow.

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

### Phase 08 Extension — Full Frontend Refactoring
- [x] `R8` Remove `app-top-bar.tsx` template artifact — delete file; update `root.tsx`; move `LanguageSwitcher` + `ThemeToggle` into sidebar footer — _Depends on:_ —
- [x] `R9` Apply `FRONTEND_CONVENTIONS.md` to all doctor components, chart components, shared UI, layouts, and doctor routes — kebab-case filenames, `type` not `interface`, `React.FC<Props>`, `props.x` notation, no prop destructuring, `Fx` useEffect names — _Depends on:_ —
- [x] `R10` Design system completion — add semantic severity/status color tokens to `app.css`; install shadcn `badge`, `tabs`, `dialog`, `select`, `scroll-area`, `separator`; mobile-first responsive sidebar; visual alignment of doctor portal to design screenshots in `docs/assets/` — _Depends on:_ `R9`
- [x] `R11` Complete R7 — verify unit tests pass; expand E2E spec to cover doctor routes (`/doctor`, `/doctor/patients/:id` tab navigation) and assessment wizard completion flow — _Depends on:_ `R9`, `R10`

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

- [x] **[R9 + R10]** Design system refactoring and component architecture rules for the WHOLE project (patient + doctor + shared). Conventions documented in `docs/FRONTEND_CONVENTIONS.md`. Implementation for patient routes was completed in R1 (see NOTES). Doctor components, chart components, shared UI, layouts, and doctor routes are refactored (R9); design tokens, missing shadcn components, mobile-first layout, and doctor portal visual alignment are complete (R10).

- [x] **[R8]** Необходимо избавиться от старых компонентов, которые никак не относятся к нашему проекту напрямую, а являются артефактами из шаблона. Артефактом является компонент `app-top-bar.tsx`. Удалить файл, убрать из `root.tsx`, переместить `LanguageSwitcher` + `ThemeToggle` в sidebar footer.

- [x] Надо добавить строгое ограничение на использование сырых апи для работы с window.localStorage и JSON,  import.meta.env. Вместо этого всегда нужно использовать утилиты safe-json.ts и safe-ls.ts и env/runtime из frontend/app/shared/config. Это предотвращает скрытые баги, рассинхронизацию и отсутствие версионирования, а также решает проблему со строгой типизацией.

- [x]  Для работы с датами предлагаю завести утилиту в shared/lib/date.ts, где реализовать единую обертку поверх нативного Date, для унификации и декларативности работы с датами в рамках всего проекта. По возможности обобщай и выноси как пресеты, константы часто переиспользуемые действия с Date.

- [x] В компонентах не должно быть множества useState, useEffect, useRef, useCallback, useMemo, вспомогательных функций и т.д., которые могут быть связаны друг с другом общим доменом/ответственностью, но по итогу размазаны по всему компоненту, от чего неочевидно и непредсказуемо, как они связаны между собой, какую задачу решают. Я предлагаю выносить их в кастомные хуки, где будет содержаться связка хуков, состояния, вспомогательных функций на основе домена и единой ответственности, которую они решают. Это позволит снизить когнитивную нагрузку и сложность восприятия кода. Если это локальные хуки, которые работают только в рамках модуля/компонента, то такие хуки должны располагаться рядом с модулем/компонентом в директории module-name|component-name/hooks/*.

- [x] Для работы с search params не использовать примитивные и "грязные" подходы: const [searchQuery, setSearchQuery] = useState(''), searchQuery.trim() и т.д. Я хочу чтобы ты сделал наш кастомный хук useSearchParams поверх useSearchParams и других хуков из react-router. Необходимо добиться декларативности через методы (set,add,remove,has и т.д.), строгой типизации и валидации через zod при работе с search params в url. Детально изучи существующий код, исследуй документацию для react-router v7+, zod latest version и сделай продакшен реализацию кастомного хука для работы с search params. Жестко зафиксируй в документации, что мы используем только данный хук при работе с search params, не используем сырой хук useSearchParams из 'react-router'.

- [x] Я бы хотел сделать единую точку входа и апи работы с роутингом, вместо множества отдельных хуков useParams, useNavigate и т.д. Должен быть единый хук useRouter, который инкапсулирует и обобщает всю работу с роутингом, представляя декларативный, строго типизированный апи для работы с роутингом. Должны быть обобщенные, типобезопасные методы + необходимые состояния. Жестко зафиксируй в документации, что мы используем только данный хук при работе с роутингом, не используем по отдельности хуки useParams, useNavigate и т.д.

- [x] На данный момент у нас отсутствует полноценное покрытие e2e playwright тестами функционала frontend. Я бы хотел решить эту проблему и покрыть текущий функционал e2e тестами. При этом, не смотря на то, что мы зафиксировали правило, что со всеми сервисами работаем в рамках docker контейнеров, предлагаю запускать e2e тесты локально на текущем хосте, а не в рамках docker контейнера. Это компромисс, чтобы избежать проблем и доп. нагрузки на docker контейнеры. Я не планирую запускать e2e тесты где-либо ещё, кроме локального запуска на текущем хосте. Там, где e2e тесты ненужны, предлагаю писать unit тесты на базе текущего стека тестирование во frontend. Проведи исследование, определи какой функционал уже покрыт тестами, а какой ещё нет. Разработай план и реализуй его. Зафиксируй в документации то, что e2e и unit тесты являются необходимым этапом разработки и их обязательно нужно писать при разработке нового функционала.

- [x] На данный момент часть файлов во frontend использует camel case, pascal case, kebab case. Я бы хотел свести нейминг всех файлов к kebab-case. Выполни рефакторинг. Зафиксируй это как обязательное правило в документации.
---

## Atomic Commit Message

```
feat(phase-08): full frontend refactoring — design alignment, conventions, doctor portal
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
