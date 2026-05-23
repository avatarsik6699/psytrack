# PHASE 09 — Frontend Design-System Completion & UX Refactor

<!-- TOKEN BUDGET: keep this file under 10,000 tokens. Be concise. -->

> ⚠️ **NEEDS_REVIEW** — SPEC v1.7 revises Phase 09 around patient credentials, newly supplied
> profile/credential-reset design references, and removal of generated demo/design artifacts.
> Architect should confirm this revised scope before implementation starts.

## Phase Metadata

| Field | Value |
|-------|-------|
| Phase | `09` |
| Title | Frontend Design-System Completion & UX Refactor |
| Status | `⚠️ NEEDS_REVIEW` |
| Tag | `v0.09.0` |
| Depends on | PHASE_08 gate passing |

---

## Phase Goal

Phase 09 replaces the previous Appointments & Notifications plan. Its goal is to bring the
implemented MVP frontend into alignment with the Docassist design references in `docs/assets/`,
while completing the MVP patient credential/profile and real `/history` contracts needed by that
frontend. Appointment scheduling, browser/email notifications, and doctor settings/schedule routes
remain out of scope.

---

## Design References

Design assets are stored in `docs/assets/` and must be treated as the visual target where a
screenshot exists. Missing screenshots are explicitly handled as derived design work from the same
Docassist chrome, spacing, typography, and token system.

### Provided References

- Doctor roster — `patients-list-page.png`, `patients-list-empty-page.png`
- Add patient flow — `add-patient-form-first-step.png`, `add-patient-form-second-step.png`, `add-patient-form-third-step.png`
- Doctor patient detail — `patient-detail-overview-tab-page.png`, `patient-detail-dynamics-tab-page.png`, `patient-detail-drugs-tab-page.png`, `patient-detail-side-effects-tab-page.png`, `patient-detail-events-log-tab-page.png`
- Doctor profile — `doctor-profile-page.png`, `doctor-profile-page-dark.png`
- Doctor patient credential reset — `doctor-reset-login-pass-for-patient-page.png`
- Patient portal — `patient-profile-main-page.png`, `patient-profile-tests-page.png`, `patient-profile-test-steps-form-page.png`, `patient-profile-test-success-page.png`, `patient-profile-drugs-page.png`, `patient-profile-side-effects-page.png`, `patient-profile-page.png`
- Patient side-effect wizard — `patient-profile-add-side-effect-first-step-page.png`, `patient-profile-add-side-effect-second-step-page.png`, `patient-profile-add-side-effect-third-step-page.png`, `patient-profile-add-side-effect-final-step-page.png`

### New Profile / Reset Reference Details

- `doctor-profile-page.png`: light-theme `/doctor/profile` target with doctor identity card, language/theme preference segmented controls, current-session table, access-token panel, profile nav active state, and doctor footer identity block.
- `doctor-profile-page-dark.png`: dark-theme variant of the same `/doctor/profile` layout; use it to validate token panels, segmented controls, side navigation, card borders, and text contrast in dark mode.
- `doctor-reset-login-pass-for-patient-page.png`: doctor patient-detail modal target for credential recovery; background is dimmed, patient context remains visible, generated login/password are shown once in a compact credential box with copy action, cancel action, and primary confirmation action.
- `patient-profile-page.png`: patient `/profile` target with identity card, login-change form, password-change form, language/theme preferences, current-session table, red end-session action, patient nav badges, and patient footer identity block.

### Missing References To Derive

- `/login` and `/register`: doctor login, patient login/password login, role switching, validation/loading/error states.
- `/history`: completed-assessment history backed by real `GET /patient/history` data.
- Responsive states: mobile/tablet navigation, dialogs, long data, text wrapping, and focus states.

### Production Artifacts — К Удалению

These items are not product requirements. They came from generated/demo design scaffolding or old
template assumptions and must be removed or constrained before Phase 09 can pass:

- **К удалению:** top-bar role switch links `Врач` / `Пациент` that navigate between `/doctor` and
  `/dashboard`. Authenticated role comes from the JWT/backend and the app has no impersonation or
  "view as" business flow.
- **К удалению:** any `/doctor/settings` or `/doctor/schedule` link, nav item, or placeholder route
  still present in frontend chrome. These routes remain explicitly out of scope.
- **К удалению:** hardcoded doctor identity in production chrome, including sidebar/footer examples
  like `Волков А.Н.` / `Психиатр`; render real authenticated doctor profile data or an honest
  loading/empty state.
- **К удалению или строгому dev-only guard:** demo credential helper UI, hardcoded seed credentials,
  and "fill demo credentials" controls. They may exist only in local development if fully hidden
  from production builds.
- **К проверке:** any other clickable command, route, status, placeholder, badge, token panel, or
  identity value that is not backed by SPEC/API contracts. If found during T1 audit, add it to
  `docs/PHASE_09_DESIGN_AUDIT.md` as **К удалению** and remove it under `F1`/`F2`/`F4` as
  appropriate.

### In-Scope Route Inventory

Audit, visual refactor, responsive checks, and e2e smoke must cover every route below:

Public:
- `/login`
- `/register`

Patient:
- `/`
- `/dashboard`
- `/history`
- `/profile`
- `/tests`
- `/drugs`
- `/side-effects`
- `/assessment/:patientScaleId`

Doctor:
- `/doctor`
- `/doctor/patients/:id`
- `/doctor/profile`

Explicitly out of scope:
- `/doctor/settings`
- `/doctor/schedule`

---

## Scope

### Documentation / Audit
- [x] `T1` Create `docs/PHASE_09_DESIGN_AUDIT.md` with a per-route current-vs-target audit, mapping each public/patient/doctor route to provided references or derived-reference rules; include unresolved screenshot gaps for future design input — _Depends on:_ —

### Backend / API
- [x] `B1` Patient credential and session contracts — add patient self-service login/password update, current-session metadata, generic login-unavailable errors, OpenAPI schemas, and focused backend tests; preserve current patient login/password auth and remove patient email/password login from MVP language — _Depends on:_ `T1`
- [x] `B2` Doctor patient credential reset — add doctor-only endpoint that generates a new patient login/password pair, replaces existing credentials, returns plaintext once, and is tested for doctor ownership boundaries — _Depends on:_ `B1`

### Frontend
- [x] `F1` Global application chrome — align doctor, patient, and public auth layouts with Docassist sidebar/top-bar spacing, active states, badges, avatar blocks, typography, empty/loading/error states; place `LanguageSwitcher` and `ThemeToggle` visibly in role-aware navigation/account chrome with mobile-safe states; remove production artifacts listed above, including the top-bar doctor/patient switch, out-of-scope doctor nav links, and hardcoded identity data — _Depends on:_ `T1`
- [x] `F2` Public auth UX — redesign `/login` and `/register` for doctor login, patient login/password login, role switching between login form modes only, registration links, validation, loading, error, and redirect states; do not add patient email/password login; remove or strictly dev-guard visible demo credential helpers — _Depends on:_ `F1`, `B1`
- [x] `F3` Patient portal completion — reconcile `/dashboard`, `/tests`, `/assessment/:patientScaleId`, `/drugs`, `/side-effects`, `/profile`, and `/history` with patient-profile references and SPEC §5.1; use `patient-profile-page.png` for the canonical profile layout; finish real `/history`, patient credential forms, current-session panel, in-app notification placeholder, and task/test/medication/side-effect/success states — _Depends on:_ `F1`, `B1`
- [x] `F4` Doctor portal completion — reconcile `/doctor`, `/doctor/profile`, add-patient modal, and `/doctor/patients/:id` tabs with roster/detail/add-patient/profile references; use `doctor-profile-page.png` and `doctor-profile-page-dark.png` for profile light/dark states; add patient credential reset UX from `doctor-reset-login-pass-for-patient-page.png`; do not add `/doctor/settings` or `/doctor/schedule` routes in this phase — _Depends on:_ `F1`, `B2`
- [x] `F5` Design-system refactor — consolidate repeated page/card/status/control patterns into shared primitives where it reduces duplication; preserve `docs/FRONTEND_CONVENTIONS.md`, generated API types from `schema.ts`, typed router/search helpers, and no raw API escape hatches — _Depends on:_ `F2`, `F3`, `F4`
- [x] `F6` Responsive and accessibility pass — verify desktop/tablet/mobile states, WCAG 2.1 AA contrast, keyboard navigation, focus indicators, accessible names, and no text overlap/truncation in core workflows — _Depends on:_ `F5`

### Frontend Tests
- [x] `FT1` `frontend/tests/e2e/phase-09-smoke.spec.ts` — e2e smoke covering auth, patient portal, real history, patient credential profile controls, doctor roster/detail/profile, add-patient modal, doctor credential reset controls, language switcher, theme toggle, and responsive navigation; minimum one `test()` block per route group or major interaction — _Depends on:_ `F6`
- [x] `FT2` Unit tests for new utility functions, hooks, or pure-logic modules introduced in this phase; n/a — no new pure utility modules were introduced — _Depends on:_ `F5`

---

## Files

### Create / modify
~~~
# Documentation
docs/PHASE_09_DESIGN_AUDIT.md

# Backend — patient credentials / session
app/modules/auth/api.py
app/modules/auth/schemas.py
app/modules/auth/service.py
app/modules/patients/api.py
app/modules/patients/schemas.py
app/modules/patients/service.py
app/modules/patients/repository.py
alembic/versions/
tests/

# Frontend — global chrome / shared UI / styles
frontend/app/root.tsx
frontend/app/routes.ts
frontend/app/styles/app.css
frontend/app/layouts/doctor-layout.tsx
frontend/app/layouts/patient-layout.tsx
frontend/app/shared/ui/sidebar.tsx
frontend/app/shared/ui/top-bar.tsx
frontend/app/shared/ui/language-switcher.tsx
frontend/app/shared/ui/theme-toggle.tsx
frontend/app/shared/ui/error-state.tsx
frontend/app/shared/ui/page-skeleton.tsx
frontend/app/shared/ui/section-skeleton.tsx
frontend/app/components/ui/badge.tsx
frontend/app/components/ui/button.tsx
frontend/app/components/ui/card.tsx
frontend/app/components/ui/dialog.tsx
frontend/app/components/ui/input.tsx
frontend/app/components/ui/label.tsx
frontend/app/components/ui/scroll-area.tsx
frontend/app/components/ui/select.tsx
frontend/app/components/ui/separator.tsx
frontend/app/components/ui/tabs.tsx

# Frontend — public auth
frontend/app/pages/auth/login/index.tsx
frontend/app/pages/auth/register/index.tsx
frontend/app/routes/login.tsx
frontend/app/routes/register.tsx
frontend/app/features/auth/login-form.tsx
frontend/app/features/auth/register-form.tsx

# Frontend — patient portal
frontend/app/pages/dashboard/ui/dashboard-page.tsx
frontend/app/pages/dashboard/ui/components/stat-card.tsx
frontend/app/routes/dashboard.tsx
frontend/app/routes/tests/index.tsx
frontend/app/routes/tests/components/test-card.tsx
frontend/app/routes/assessment/index.tsx
frontend/app/routes/assessment/components/test-success-screen.tsx
frontend/app/routes/drugs/index.tsx
frontend/app/routes/drugs/components/med-log-card.tsx
frontend/app/routes/side-effects/index.tsx
frontend/app/routes/side-effects/components/se-card.tsx
frontend/app/components/patient/se-wizard/index.tsx
frontend/app/components/patient/se-wizard/constants/body-systems.ts
frontend/app/components/patient/se-wizard/hooks/use-se-wizard.ts
frontend/app/routes/profile/index.tsx
frontend/app/routes/profile/components/password-change-form.tsx
frontend/app/routes/profile/components/patient-credential-form.tsx
frontend/app/routes/profile/components/session-info-panel.tsx
frontend/app/routes/profile/components/profile-section.tsx
frontend/app/routes/profile/hooks/use-password-form.ts
frontend/app/routes/profile/hooks/use-patient-credential-form.ts
frontend/app/routes/history.tsx

# Frontend — doctor portal
frontend/app/routes/doctor/index.tsx
frontend/app/routes/doctor/patient-detail.tsx
frontend/app/routes/doctor/profile.tsx
frontend/app/components/doctor/add-patient-modal/index.tsx
frontend/app/components/doctor/add-patient-modal/components/copy-field.tsx
frontend/app/components/doctor/add-patient-modal/components/modal-overlay.tsx
frontend/app/components/doctor/assign-test-modal.tsx
frontend/app/components/doctor/diagnosis-form.tsx
frontend/app/components/doctor/diagnosis-list.tsx
frontend/app/components/doctor/diagnosis-tab-switcher.tsx
frontend/app/components/doctor/event-timeline.tsx
frontend/app/components/doctor/medication-assign-form.tsx
frontend/app/components/doctor/medication-chart.tsx
frontend/app/components/doctor/patient-card.tsx
frontend/app/components/doctor/patient-header.tsx
frontend/app/components/doctor/se-chart.tsx
frontend/app/components/doctor/se-monitoring-modal.tsx
frontend/app/components/doctor/therapy-goals.tsx
frontend/app/components/doctor/patient-credential-reset-action.tsx

# Tests
frontend/tests/e2e/phase-09-smoke.spec.ts
frontend/tests/phase-09-ui-utils.test.ts
~~~

### Do NOT touch
- Backend modules outside the patient credential/session contracts listed above.
- `frontend/app/shared/types/schema.ts` by hand. If an approved API change occurs, regenerate it via `cd frontend && pnpm generate:api`.
- Existing completed phase documents except through explicit SDD workflow updates.
- Appointment DB model, schedule endpoints, push/web/email notification contracts.
- `/doctor/settings` or `/doctor/schedule` frontend routes unless a later phase defines explicit
  user value, route logic, and contracts.
- Patient email/password login, email-based account recovery, server-side token inventory,
  revoke-all-sessions, refresh-token blacklist, or device management.

---

## Contracts

> This section is the source of truth for `/context-update`.

### New persistent data (tables / collections / files)

No new tables. Existing `patients.temp_login` remains the patient login field. If needed for
case-insensitive uniqueness, add a narrow Alembic migration to enforce a case-insensitive unique
constraint/index for patient login without changing the external API name.

### New API endpoints / RPC methods / events

- `GET /api/v1/public/auth/session` — returns current-session metadata derived from bearer auth.
- `PATCH /api/v1/patient/me/credentials` — patient changes own login and/or password using current password.
- `POST /api/v1/doctor/patients/{patient_id}/credentials/reset` — doctor resets a patient login/password pair; returns plaintext once.

### New types / models / shared interfaces

- `SessionInfoOut`
- `PatientCredentialUpdateIn`
- `PatientCredentialResetOut`
- Generic login validation error response for unavailable/invalid patient login.

### New env vars

None

---

## Gate Checks

> **Before running gate:** confirm all Scope checkboxes are checked (or explicitly deferred in
> Architect Review Notes). Unchecked items appear in the gate report as a warning, not a hard block.

Run `/phase-gate 09` before committing.

`/phase-gate` returns full PASS only when:
- Automated checks are green
- All architect review items below are resolved (checked off)
- `docs/PHASE_09_DESIGN_AUDIT.md` exists and maps all in-scope routes to provided or derived references
- `docs/PHASE_09_DESIGN_AUDIT.md` inventories generated/demo artifacts with **К удалению** status
  and none of those artifacts remain in production UI
- Desktop, tablet, and mobile screenshots/manual checks have no incoherent overlap, clipped text, or unreachable controls

Use the commands in [docs/STACK.md](./STACK.md#gate-commands) as the source of truth for:
- infrastructure / bootstrap
- migrations (if applicable)
- backend / unit tests
- frontend prep, type-check, unit tests
- e2e
- the default smoke check

**Frontend test coverage check (hard requirement):** before the gate can pass, confirm:
- `FT1` checkbox is checked and `frontend/tests/e2e/phase-09-smoke.spec.ts` exists
- `pnpm test:e2e` covers auth, patient portal, real history, patient credential profile controls,
  doctor portal, doctor profile, doctor credential reset controls, global controls, and responsive navigation paths

---

## Architect Review Notes

Use this section after manual verification. Add one checkbox item per issue the architect wants
fixed before the phase can close. Leave the item unchecked while it is still open. Check it off
only after the fix is implemented and re-verified.

- [x] Confirm SPEC v1.7 Phase 09 scope: patient login/password only, patient credential self-change,
  `/doctor/profile`, doctor credential reset, real `/history`, in-app-only notification
  indicators, and removal of generated/demo artifacts marked **К удалению**.

- [x] На данный момент есть проблемные места в отображении контента на frontend части. В шапке постоянно присутствуют кнопки для переключения языка и темы. Эти же компоненты дублируются в боковом меню. В спецификации и фазе было чётко зафксировано, что этот функционал должен быть в рамках настроек профиля. Убери дублирующиеся компоненты из шапки и бокового меню.

- [x] На данный момент есть проблема с тем, что визуально дизайн в плане цветов, отступов, расположения некоторых элементов расходится с тем, что было представлено в дизайн референсах /home/niquetamerewsl/projects/patient_tracker/docs/assets. Также во многих частях приложения "захардкожены" английские и русские текста, то есть переключение языка никак не меняет текст, хотя он должен был поменяться. Также переключение между темной и светлой темой работает не до конца, какие то компоненты так и остаются светлыми, а какие-то темными, то есть функционал работает не полностью. Я хочу чтобы ты детально разобрался с этим и решил все эти проблемы. 

- [x] На данный момент всё ещё есть проблемы с тем, что реализованные компоненты и дизайн система расходятся с тем, что представлено в качестве дизайн референсов в /home/niquetamerewsl/projects/patient_tracker/docs/assets. Я хочу чтобы ты детально изучил предоставленные дизайн референсы и скорректировал дизайн систему, компоненты. Также, по прежнему во многих местах используются сырые компоненты по типу <input/>, <button/>, списки и т.д. вместо того, чтобы использовать компоненты из shadcn и наши собственные переиспользуемые обертки из shared/ui, для избежания дублирования компонентов, разметки, предустановленного функционала и т.д.

- [x] На данный момент на странице входа в систему /login в хедере присутствуют кнопки смена языка, темы. Я предлагаю убрать эти компоненты из хедера. Язык и тема должен определяться автоматически на основе метаданных клиента, который зашел в систему.

- [] 
---

## Atomic Commit Message

```
feat(phase-09): complete frontend design-system refactor
```

---

## Post-Phase Checklist

- [ ] All Scope checkboxes checked (or deferred in Architect Review Notes)
- [ ] `FT1` checked — `frontend/tests/e2e/phase-09-smoke.spec.ts` exists, or deferral documented in Architect Review Notes
- [ ] `docs/PHASE_09_NOTES.md` complete — Implementation Plans filled, key decisions recorded
- [ ] `docs/PHASE_09_DESIGN_AUDIT.md` complete
- [ ] All automated gate checks green
- [ ] All architect review notes resolved
- [ ] `docs/CONTEXT.md` updated — run `/context-update 09`
- [ ] `docs/STATE.md` phase row updated to `✅ done`
- [ ] `docs/CHANGELOG.md` entry added (if contracts changed)
- [ ] Committed atomically on `feat/phase-09` branch
- [ ] Tag created after merge to develop: `git tag -a v0.09.0 -m "Phase 09: Frontend Design-System Completion & UX Refactor"`
