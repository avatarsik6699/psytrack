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

- [x] В профиле врача на странице /doctor/patients/{patient_id} на табе "Лента событий" отображаются логи в сыром виде, которые будут непонятны для врача. Необходимо реализовать отображение, соответствующее референсу patient-detail-events-log-tab-page.png с фильтрацией логов, системой иконок и другой полезной метаинформацией, необходимой для врача. 

- [x] В профиле пациента на странице /drugs отображается список назначенных препаратов. Необходимо отображать названия препаратов с учетом локализации пользователя. В карточке препарата есть кнопки "Принял" и "Пропустил". Сейчас, при клике на эти кнопки визуально ничего не происходит. Можно предположить, что система не работает и, таким образом, несколько раз нажать кнопки, создав ложные события в системе, как будто пациент несколько раз принял или пропустил препарат. Нужно доработать эту логику, чтобы избежать подобных проблем, должен быть визуальный отклик и, возможно, доработки со стороны бизнес-правил, пользовательского опыта.

- [x] В профиле пациента на странице /assessment/{test_id} предлагаю доработать пользовательский опыт UX при прохождении теста и улучшить визуальный отклик при выборе ответа. Сейчас при выборе ответа происходит быстрый переход к следующему вопросу, можно случайно нажать не туда и не заметить, что я выбрал не тот пункт. После прохождения теста на странице со списком тестов /tests, нет никакой информации какой тест я только что прошел, из-за чего по ошибке я могу предположить, что тест не был пройден и нужно пройти его снова. Нужно доработать эту логику и пользовательский опыт.

- [x] В профиле пациента на странице /side-effects предлагаю доработать пользовательский опыт UX при пометке симптома как "прошёл". Сейчас, когда я нажимаю кнопку "Прошёл", то визуально элемент перемещается в список "Прошедшие", но кажется, что этого недостаточно, мне, как пациенту, непонятно что вообще произошло. Возможно стоит добавить на странице сноску с информацией о том, что происходит на этой странице, что означает кнопка "Прошёл" и т.д. Также сейчас можно добавить новые симптомы при клике на кнопку "+ добавить" на странице /side-effects. Открывается модальное окно с формой, где можно выбрать область, которая меня беспокоит. Но сейчас фильтрация не работает, список симптомов отображается только для бейджа "Все", а для всех остальных бейджей ничего не отображается. Необходимо исправить этот баг.

- [x] Мне не нравится то, как сейчас загружаются некоторые страницы. Я бы хотел системно доработать загрузку всех страниц в виде skeleton загрузки, как это сделано в продвинутых системах. Выполни исследование, составь план и разработай Skeleton загрузку для всех страниц и компонентов, где это необходимо. При этом соблюдай нашу дизайн систему. 

- [x] Мне не нравится то, как отображаются элементы в рамках лейаута и страниц. Где-то элементы растягиваются на всю страницу, где-то элементы прижаты к левому краю (к сайдбару), а где-то по центру. Я бы хотел унифицировать верстку и адаптив всех страниц и компонентов. Однако я затрудняюсь сказать, как сделать грамотно с позиции адаптивной, резиновой верстки, чтобы соответствовать mobile-first подходу и лучшим практикам в контексте ui/ux. Детально проанализируй текущее состояние кода, текущее состояние верстки, сделай проработанный план изменений, а затем имплементируй его.

- [x] Наблюдается баг при котором, если зайти в профиль врача, а затем принудительно перейти на главную страницу domain/, то откроется страница /dashboard и весь профиль поменяется на вариант, как будто я авторизовался за пациента, а не за врача. Не должно быть такой ситуации, когда авторизовавшись за врача я как-либо попадаю в интерфейс пациента, это нарушение границ и работы интерфейса в целом. Найди причину такого поведения и исправь.

- [x] Если я уже авторизовался за врача/пацента, а затем нажимаю кнопку "Выйти", то периодически не происходит переброс на страницу с логином, остается открыта текущая страница и возникают проблемы с интерфейсом, т.к. я уже не авторизован, но всё ещё нахожусь на странице, которая доступна только авторизованным пользователям. 

- [x] При входе в систему по адресу domain/, если я ещё не авторизован, то в какой-то момент "мелькает" страница с профилем пациента, а затем происходит редирект на /login. Такого не должно происходить, это портит впечатление и UX. Разберись в чем причина такого поведения и сделай необходимые правки. Если это системная проблема, то зафиксируй общее решение, для предовтращения подобных проблем.

- [x] В профиле врача на главной странице /doctor есть предположение сделать карточки в полностью цветными, но не слишком контрастно. То есть цветная карточка + цветная рамка, но сделать цвета менее контрастными в зависимости от того, каково состояние пациента.

- [x] В профиле врача, при добавлении пациента на последнем шаге, когда появляются данные для входа: логин и пароль, я бы хотел, чтобы они были объеденены в один блок и их можно было скопировать вместе в буфер как login: somelogin password: somepass. На данный момент приходится копировать в буфер отдельно логин, затем отдельно пароль, что неудобно.

- [x] В профиле врача на странице /doctor/patients/{patient_id} на табе "Препараты" в поле поиска препаратов поддерживаются названия только на английском, что создает проблемы. Если я не помню название препарата, то не смогу добавить его. Предлагаю переделать компонент на выпадающий список + поиск, чтобы можно было выбрать из выпадающего списка препарат, если я не помню его названия. Также нужна локализация на русский язык для названия препаратов. Также дозировки отображаются только на английском mg, mcg, ml, g, необходимо также добавить переводы на русский язык и отображать на русском, если выбрана локализация на русском мг, мкг, мл, г.

- [x] В профиле врача на странице /doctor/patients/{patient_id} на табе "Побочные эффекты" присутствует кнопка "Настроить". При клике на кнопку открывается модалное окно с мониторингом побочных эффектов. Сейчас поле с поиском побочного эффекта работает некорректно. На данный момент при фоксу на поле ничего не происходит. Чтобы получить какую-то информацию из выпадающего списка, мне нужно что-то ввести в поиск. Но я бы хотел сразу получить выпадающий список со всеми вариантами, и только при необходимости я могу ввести что-то в поиск и сузить кол-во вариантов в выпадающем списке в зависимости от поиска. Исследуй эту проблему и скорректируй код.

- [x] Сейчас при прохождении тестов в профиле пациента я обнаружил, что все тесты только на английском, переводы на русский полностью отсутствуют. Необходимо добавить переводы на русский язык. Вообще, аудитория будет в первую очередь российская, необходимо сделать переводы для всего функционала первично на русском, а английский будет вторичным, только если его включили явно в профиле.

- [x] Находясь в профиле пациента, я прошел тест, но вернувшись к списку тестов их состояние никак не изменилось. Тест был в статусе "Ожидает", и продолжает находиться в статусе "Ожидает" после его прохождения.

- [x] В профиле пациента есть кнопка "Завершить сессию" при клике на которую происходит завершение сессии, но если это была текущая сессия, то пользователь продолжает находиться на текущей странице неавторизованным. Трудно сказать корректно это или нет, нужно выяснить и внести доработки при необходимости.

- [x] Есть проблема с отображением округлых бейджей со счетчиком уведомлений frontend/app/shared/ui/top-bar.tsx. На данный момент они отображаются в обрезанном виде в шапке. Видимо это как-то связано с абсолютным позиционированием и размером контейнера. Выясни в чем проблема и исправь эту проблему. Счетчик не должен обрезаться. Также существует проблема с размерами счетчика-бейджа, где-то он овальный, где-то округлый. Я хочу зафиксировать его как округлый всегда. В случае, если уведомлений слишком много, то они просто обрезаются как, например, 9+, что означает - 9 и более.

- [x] В верстке глобально присутствует проблема, связанная с тем, что происходят layout shifting, т.к. в разных местах скролл в рамках страницы может появляться и исчезать, что приводит к "скачкам" блоков в рамках всего интерфейса. Это негативно влияет на различные метрики и создает негативный пользовательский опыт. Предлагаю исследовать этот вопрос и разработать план по исправлению данной проблемы.

- [x] Находясь в профиле пациента, я прошел тест, но вернувшись к списку тестов их состояние никак не изменилось. Тест был в статусе "Ожидает", и продолжает находиться в статусе "Ожидает" после его прохождения. Хотя я ожидал, что после завршения статус теста меняется и он считается пройденным. Далее он снова перейдет в статус "Ожидает", когда пройдет заданное время.

- [x] Я бы хотел улучшить стилизацию и UI/UX для скроллбара в рамках приложения. А также сделать его более стилизованным в стиле минимализма. 

- [x] Я бы хотел добавтить такой элемент как NavigationProgress. Изучи как реализовать NavigationProgress в связке с shadcn + react-router v7, сделай план разработки, а затем имплементируй его. 
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
