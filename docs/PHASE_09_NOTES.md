# PHASE 09 — Implementation Notes

<!--
  WHAT to build → docs/PHASE_09.md  (contracts, scope checklist)
  HOW it was built → this file      (plans, decisions, rationale)

  Ownership rules:
  - ### Exploration          — written by agent (/phase-explore). Optional; skip for simple tasks.
  - ### Implementation Plan  — written by agent (/impl-brief). Agent may update only this section.
  - ### Decisions & Notes    — written by human. NEVER overwritten by agent.

  Sync rule: task IDs (B1, F1, I1 …) must match the Scope checklist in PHASE_09.md.
-->

_Phase:_ `09` · _Generated:_ `2026-05-23`

---

## T1 — Create design/reference audit
**Depends on:** —

### Exploration
<!-- Optional. Run `/phase-explore 09 T1` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 09 T1` to generate. Output includes: Done when / Follows pattern / steps. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## B1 — Patient credential and session contracts
**Depends on:** T1

### Exploration
<!-- Optional. Run `/phase-explore 09 B1` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 09 B1` to generate. Output includes: Done when / Follows pattern / steps. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## B2 — Doctor patient credential reset
**Depends on:** B1

### Exploration
<!-- Optional. Run `/phase-explore 09 B2` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 09 B2` to generate. Output includes: Done when / Follows pattern / steps. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## F1 — Global application chrome
**Depends on:** T1

### Exploration
<!-- Optional. Run `/phase-explore 09 F1` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 09 F1` to generate. Output includes: Done when / Follows pattern / steps. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## F2 — Public auth UX
**Depends on:** F1, B1

### Exploration
<!-- Optional. Run `/phase-explore 09 F2` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 09 F2` to generate. Output includes: Done when / Follows pattern / steps. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## F3 — Patient portal completion
**Depends on:** F1, B1

### Exploration
<!-- Optional. Run `/phase-explore 09 F3` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 09 F3` to generate. Output includes: Done when / Follows pattern / steps. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## F4 — Doctor portal completion
**Depends on:** F1, B2

### Exploration
<!-- Optional. Run `/phase-explore 09 F4` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 09 F4` to generate. Output includes: Done when / Follows pattern / steps. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## F5 — Design-system refactor
**Depends on:** F2, F3, F4

### Exploration
<!-- Optional. Run `/phase-explore 09 F5` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 09 F5` to generate. Output includes: Done when / Follows pattern / steps. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## F6 — Responsive and accessibility pass
**Depends on:** F5

### Exploration
<!-- Optional. Run `/phase-explore 09 F6` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 09 F6` to generate. Output includes: Done when / Follows pattern / steps. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## FT1 — Phase 09 e2e smoke coverage
**Depends on:** F6

### Exploration
<!-- Optional. Run `/phase-explore 09 FT1` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 09 FT1` to generate. Output includes: Done when / Follows pattern / steps. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## FT2 — Unit tests for new pure utilities
**Depends on:** F5

### Exploration
<!-- Optional. Run `/phase-explore 09 FT2` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 09 FT2` to generate. Output includes: Done when / Follows pattern / steps. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## Review Notes Fixes

### [R2] — Remove duplicated language and theme controls from chrome
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/shared/ui/top-bar.tsx` — renders compact `LanguageSwitcher` and `ThemeToggle` in authenticated top bar.
- `frontend/app/shared/ui/sidebar.tsx` — renders full `LanguageSwitcher` and `ThemeToggle` in both patient and doctor sidebars.
- `frontend/app/routes/profile/index.tsx` — patient profile already contains the intended controls.
- `frontend/app/routes/doctor/profile.tsx` — doctor profile already contains the intended controls.

**Observed issue:**
- Authenticated chrome duplicates language and theme controls outside profile settings, contrary to the review note.

**Risk areas:**
- E2E smoke still checks profile preference controls, but does not depend on duplicated header/sidebar controls.

#### Implementation Plan

**Done when:** authenticated top bar and sidebars no longer render language/theme controls, while patient and doctor profile pages still do.

**Files:** `frontend/app/shared/ui/top-bar.tsx`, `frontend/app/shared/ui/sidebar.tsx`, `docs/PHASE_09.md`, `docs/PHASE_09_NOTES.md`

**Steps:**
1. Remove `LanguageSwitcher` and `ThemeToggle` imports/usages from authenticated top bar.
2. Remove `LanguageSwitcher` and `ThemeToggle` imports/usages from patient and doctor sidebar footers.
3. Run focused frontend checks.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

- Removed authenticated top-bar `LanguageSwitcher` and `ThemeToggle` render sites/imports.
- Removed patient and doctor sidebar `LanguageSwitcher` and `ThemeToggle` render sites/imports.
- Kept preference controls in `/profile` and `/doctor/profile`, where the phase profile settings expect them.
- Check: `cd frontend && pnpm typecheck` — PASS.

### [R4] — Replace raw HTML with design-system components and align visuals
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/components/doctor/diagnosis-form.tsx` — raw `<input>`, `<label>`, `<textarea>`, `<button>` throughout
- `frontend/app/components/doctor/therapy-goals.tsx` — raw `<input type="checkbox">`, `<input type="text">`, `<button>`; hardcoded English strings
- `frontend/app/components/doctor/medication-assign-form.tsx` — raw `<input>`, `<select>`, `<button>`, `<label>`; hardcoded English strings
- `frontend/app/components/doctor/assign-test-modal.tsx` — raw `<select>`, `<input>`, `<button>`, `<label>`; hardcoded English strings
- `frontend/app/components/doctor/se-monitoring-modal.tsx` — raw fixed-position overlay div, raw `<input>`, `<button>`, `<ul>/<li>`
- `frontend/app/components/doctor/diagnosis-list.tsx` — raw `<button>`; hardcoded English strings
- `frontend/app/components/doctor/patient-header.tsx` — raw `<button>` for Edit/Archive actions
- `frontend/app/components/doctor/add-patient-modal/index.tsx` — raw `<input>`, `<select>`, `<button>`
- `frontend/app/components/doctor/add-patient-modal/components/copy-field.tsx` — raw `<button>`
- `frontend/app/components/doctor/add-patient-modal/components/modal-overlay.tsx` — raw fixed-position overlay div
- `frontend/app/routes/doctor/index.tsx` — raw `<input>` for search, raw `<button>` for Add Patient
- `frontend/app/routes/profile/components/password-change-form.tsx` — raw `<input>`, `<label>`, `<button>`; hardcoded Russian strings
- `frontend/app/features/auth/register-form.tsx` — raw `<input type="checkbox">` for consent

**Observed issue:**
- Doctor portal forms (diagnosis, medication, test assignment, SE monitoring) use raw HTML elements instead of shadcn `Input`, `Label`, `Button`, `Select`, and `Dialog` components.
- Several forms and modals contain hardcoded English strings not wired through i18n.
- The password-change form in the patient profile uses raw elements and hardcoded Russian labels not exposed through i18n.
- The SE monitoring modal and add-patient modal use raw div overlays instead of the shadcn `Dialog` component.
- The `PatientHeader` edit/archive actions use unstyled raw buttons instead of `Button variant="outline"`.

**Risk areas:**
- `se-monitoring-modal.tsx` — converting from raw overlay to Dialog requires managing the `open` state via the parent-controlled pattern; no functional change.
- No API, schema, or security changes; UI-only.

#### Implementation Plan

**Done when:** all targeted components use shadcn `Input`, `Label`, `Button`, `Select`, and `Dialog` where applicable; hardcoded strings are wired through `useTranslation`; a `Textarea` component is added to `components/ui/`.

**Files:**
- `frontend/app/components/ui/textarea.tsx` (create)
- `frontend/app/shared/lib/i18n.ts`
- `frontend/app/components/doctor/diagnosis-form.tsx`
- `frontend/app/components/doctor/therapy-goals.tsx`
- `frontend/app/components/doctor/medication-assign-form.tsx`
- `frontend/app/components/doctor/assign-test-modal.tsx`
- `frontend/app/components/doctor/se-monitoring-modal.tsx`
- `frontend/app/components/doctor/diagnosis-list.tsx`
- `frontend/app/components/doctor/patient-header.tsx`
- `frontend/app/components/doctor/add-patient-modal/index.tsx`
- `frontend/app/components/doctor/add-patient-modal/components/copy-field.tsx`
- `frontend/app/components/doctor/add-patient-modal/components/modal-overlay.tsx`
- `frontend/app/routes/doctor/index.tsx`
- `frontend/app/routes/profile/components/password-change-form.tsx`
- `frontend/app/features/auth/register-form.tsx`

**Steps:**
1. Create `Textarea` component in `components/ui/textarea.tsx`
2. Add i18n keys for `diagnosis`, `medication`, `assignTest`, `seMonitoring`, `therapyGoal` namespaces in `i18n.ts`
3. Update doctor-portal forms/modals to use shadcn components + i18n
4. Update `se-monitoring-modal.tsx` and `modal-overlay.tsx` to use `Dialog`
5. Update `patient-header.tsx` to use `Button variant="outline"`
6. Update `password-change-form.tsx` to use shadcn components + i18n
7. Update `register-form.tsx` checkbox styling

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

- Created `frontend/app/components/ui/textarea.tsx` — shadcn-style Textarea following the same pattern as `Input`.
- Added `diagnosis`, `medication`, `assignTest`, `seMonitoring`, `therapyGoal`, and `passwordForm` translation namespaces to `frontend/app/shared/lib/i18n.ts` in both EN and RU.
- Updated `diagnosis-form.tsx`, `medication-assign-form.tsx`, `assign-test-modal.tsx`, `diagnosis-list.tsx`, `therapy-goals.tsx`: replaced all raw `<input>`, `<label>`, `<select>`, `<textarea>`, `<button>` with shadcn `Input`, `Label`, `Select`, `Textarea`, and `Button` components; wired all visible strings through `useTranslation`.
- Updated `se-monitoring-modal.tsx`: replaced raw fixed-position overlay and raw form controls with `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle` + `Input` + `Button`.
- Updated `modal-overlay.tsx`: replaced raw overlay div with `Dialog`/`DialogContent`; `add-patient-modal/index.tsx` uses `Input`, `Label`, `Select`, `Button`.
- Updated `copy-field.tsx`: raw button → `Button variant="ghost"`.
- Updated `patient-header.tsx`: raw Edit/Archive buttons → `Button variant="outline" size="sm"` with icons.
- Updated `routes/doctor/index.tsx`: raw search `<input>` → `Input`; raw Add Patient `<button>` → `Button`.
- Updated `routes/profile/components/password-change-form.tsx`: raw inputs/label/button → `Input`, `Label`, `Button`; error string key now uses `t('passwordForm.error')`.
- Updated `routes/profile/hooks/use-password-form.ts`: hardcoded Russian error string replaced with sentinel `'error'` (display handled by form via i18n).
- Updated `routes/profile/index.tsx`: removed `LanguageSwitcher`/`ThemeToggle` from page header row; placed them in a dedicated `profile.interface` `ProfileSection`, matching the `patient-profile-page.png` design reference.
- Updated `features/auth/register-form.tsx`: added `cursor-pointer` and `accent-docassist-primary` to consent checkbox.
- Check: `cd frontend && pnpm typecheck` — PASS.
- Residual risk: no browser screenshot pass run in this workflow; SE monitoring `<ul>/<li>` dropdown remains raw HTML (appropriate for custom autocomplete).

### [R5] — Remove language/theme controls from public auth header
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/pages/auth/login/index.tsx:6-7,25-28` — imports and renders `LanguageSwitcher compact` + `ThemeToggle compact` in a `hidden sm:flex` div inside the page header.
- `frontend/app/pages/auth/register/index.tsx:6-7,25-28` — identical pattern on the register page.
- `frontend/app/shared/lib/app-provider.tsx:10` — `ThemeProvider defaultTheme='system' enableSystem` already auto-detects OS colour-scheme preference; no manual controls are needed for theme auto-detection.
- `frontend/app/shared/lib/i18n.ts:592-601` — `LanguageDetector` is imported and `.use(LanguageDetector)` is wired, but `lng: 'en'` overrides the detector and forces English. Removing `lng` lets the detector pick the browser locale.

**Observed issue:**
- Login and register page headers expose manual language/theme controls that the architect wants removed; language and theme should resolve automatically from browser/OS metadata instead.

**Risk areas:**
- Removing `lng: 'en'` from i18n init will change the default language from English to the browser locale. Apps without a stored or detected locale fall back to `fallbackLng: 'en'`, so the fallback is safe.

#### Implementation Plan

**Done when:** `/login` and `/register` headers no longer render language/theme controls; i18n auto-detects from browser locale (`LanguageDetector`); theme already auto-detects via `next-themes` system default.

**Files:**
- `frontend/app/pages/auth/login/index.tsx`
- `frontend/app/pages/auth/register/index.tsx`
- `frontend/app/shared/lib/i18n.ts`

**Steps:**
1. Remove `LanguageSwitcher` and `ThemeToggle` imports and their container `<div>` from `login/index.tsx`.
2. Same removal from `register/index.tsx`.
3. In `i18n.ts` remove the `lng: 'en'` line so `LanguageDetector` takes over; `fallbackLng: 'en'` remains as the safe fallback.
4. Run `cd frontend && pnpm typecheck`.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

- Removed `LanguageSwitcher` and `ThemeToggle` imports and their `hidden sm:flex` container div from `pages/auth/login/index.tsx` and `pages/auth/register/index.tsx`.
- Removed `lng: 'en'` from `i18n.ts` init options; `LanguageDetector` now resolves locale from browser preferences; `fallbackLng: 'en'` remains as safe fallback.
- Theme already auto-detected via `next-themes` `defaultTheme='system' enableSystem` — no change required.
- Check: `cd frontend && pnpm typecheck` — PASS.

### [R6] — Fix logout redirect, block registration, and redesign auth page layout
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/shared/ui/sidebar.tsx:108,185` — both `PatientSidebar` and `DoctorSidebar` call `logoutMutation.mutate()` with no navigation callback; token is cleared but the user stays on the current protected route.
- `frontend/app/shared/api/auth.ts:98-109` — `useLogoutMutation` clears JWT and query cache in `onSettled` but has no navigation side-effect; navigation must be added at the call site.
- `frontend/app/pages/auth/login/index.tsx` — has a standalone `<header>` element with logo outside the form section; registration link rendered unconditionally at the bottom.
- `frontend/app/pages/auth/register/index.tsx` — same header pattern; registration form is fully accessible at `/register`.
- `frontend/app/routes/register.tsx` — no loader; no redirect guard; anyone can navigate to `/register`.
- `frontend/app/shared/lib/i18n.ts` — `login.title`, `login.hint`, `login.noDoctorAccount` keys exist; no brand tagline key for the redesigned layout.

**Observed issue:**
- Logout does not redirect to `/login`; user stays on the protected page with cleared auth state.
- Registration is accessible and linked from the login page; MVP requires it to be blocked.
- Auth pages have a separate header block with the logo outside the form — architect wants it removed and the logo moved inside the form content area.
- Login page composition and texts should be aligned with the `login-form-reference.png` reference (two-column layout on desktop: branded left panel + form right panel) without copying the reference app's specific copy.

**Risk areas:**
- No API, schema, or security behavior changes; all UI/routing only.
- The `useLogoutMutation` hook itself should stay navigation-free; navigation belongs at call sites.

#### Implementation Plan

**Done when:** (1) Logout redirects to `/login` for both patient and doctor. (2) `/register` redirects to `/login`; no registration link on the login page. (3) Auth pages have no `<header>` element; logo/brand appear inside the form content area. (4) Login page uses a two-column layout on desktop (branded left panel + form right panel). (5) `pnpm typecheck` passes.

**Files:**
- `frontend/app/shared/ui/sidebar.tsx`
- `frontend/app/routes/register.tsx`
- `frontend/app/pages/auth/login/index.tsx`
- `frontend/app/pages/auth/register/index.tsx`
- `frontend/app/shared/lib/i18n.ts`

**Steps:**
1. In `sidebar.tsx` import `useRouter`; add `const router = useRouter()` to both sidebars; update logout button `onClick` to pass `onSettled` callback that calls `router.navigate('/login', { replace: true })`.
2. In `routes/register.tsx` add a `loader` that returns `redirect('/login')` from `react-router`.
3. In `i18n.ts` add `login.brandTagline` (en + ru) for the left-panel heading.
4. Redesign `pages/auth/login/index.tsx`: remove `<header>`; implement two-column layout (left: `bg-docassist-primary` panel with logo + brand + tagline; right: centered form section); remove registration link paragraph.
5. In `pages/auth/register/index.tsx` remove `<header>`; add logo inside `<section>` at top (form still renders in case redirect is removed later).
6. Run `cd frontend && pnpm typecheck`.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

- Added `useRouter` import to `frontend/app/shared/ui/sidebar.tsx`; both `PatientSidebar` and `DoctorSidebar` now call `router.navigate('/login', { replace: true })` in the `onSettled` callback of `logoutMutation.mutate(...)`.
- Added `loader()` returning `redirect('/login')` to `frontend/app/routes/register.tsx`; `/register` now redirects immediately; registration link removed from `pages/auth/login/index.tsx`.
- Added `login.brandTagline` and `login.subtitle` keys to `frontend/app/shared/lib/i18n.ts` (EN + RU).
- Redesigned `pages/auth/login/index.tsx`: removed `<header>` element; two-column layout on lg+ (dark-primary branded left panel with logo + tagline; centered form right panel); logo shown at top of form on mobile; registration link paragraph removed.
- Cleaned up `pages/auth/register/index.tsx`: removed `<header>`; logo now at top of form `<section>`.
- Check: `cd frontend && pnpm typecheck` — PASS.
- Residual risk: no browser screenshot pass run in this workflow.

### [R3] — Align frontend visuals, translations, and theme behavior
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/shared/lib/i18n.ts` — only the old auth starter strings were translated; most production chrome/profile/roster labels were literals.
- `frontend/app/shared/ui/sidebar.tsx` and `frontend/app/shared/ui/top-bar.tsx` — repeated navigation/account labels remained hardcoded.
- `frontend/app/pages/auth/login/index.tsx`, `frontend/app/pages/auth/register/index.tsx`, `frontend/app/features/auth/login-form.tsx`, `frontend/app/features/auth/register-form.tsx` — public auth copy and form labels did not fully react to language changes.
- `frontend/app/routes/profile/index.tsx`, `frontend/app/routes/profile/components/*`, `frontend/app/routes/doctor/profile.tsx`, `frontend/app/routes/doctor/index.tsx` — profile/roster surfaces contained hardcoded labels and several light-only Tailwind classes.

**Observed issue:**
- Language switching only affected a small subset of auth labels, so many visible route/chrome/profile labels stayed in Russian or English after switching language.
- Theme switching left some reviewed surfaces visually inconsistent because cards, sidebars, active tabs, modals, and text used hardcoded `bg-white`, `text-gray-*`, or `bg-gray-*` classes.

**Risk areas:**
- This review note is broad; the fix is scoped to the repeated phase-09 shell/auth/profile/doctor roster surfaces rather than translating every clinical dictionary value returned from the API.

#### Implementation Plan

**Done when:** global chrome/auth/profile/doctor roster strings change with the active language, and the same surfaces use semantic theme tokens so light/dark mode no longer leaves obvious light-only panels.

**Files:** `frontend/app/shared/lib/i18n.ts`, `frontend/app/shared/ui/sidebar.tsx`, `frontend/app/shared/ui/top-bar.tsx`, `frontend/app/pages/auth/login/index.tsx`, `frontend/app/pages/auth/register/index.tsx`, `frontend/app/features/auth/login-form.tsx`, `frontend/app/features/auth/register-form.tsx`, `frontend/app/routes/profile/index.tsx`, `frontend/app/routes/profile/components/patient-credential-form.tsx`, `frontend/app/routes/profile/components/session-info-panel.tsx`, `frontend/app/routes/doctor/profile.tsx`, `frontend/app/routes/doctor/index.tsx`, `frontend/app/components/doctor/patient-card.tsx`, `frontend/app/components/doctor/add-patient-modal/components/modal-overlay.tsx`, `frontend/app/components/doctor/add-patient-modal/components/copy-field.tsx`, `docs/PHASE_09.md`, `docs/PHASE_09_NOTES.md`

**Steps:**
1. Add nested translation keys for common actions, navigation, auth, profile/session, and doctor roster/reset copy.
2. Replace literal UI labels in the targeted repeated surfaces with `useTranslation()` lookups.
3. Replace hardcoded light-only classes in the targeted surfaces with semantic tokens or dark-aware classes.
4. Run focused frontend type-check.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

- Expanded `frontend/app/shared/lib/i18n.ts` with phase-09 keys for chrome, auth, profile/session, doctor roster, patient portal summaries, add-patient, and credential reset flows.
- Wired translation lookups into shared chrome, public auth, patient dashboard/tests/drugs/side-effects/profile, doctor roster/profile, patient card/header, add-patient, and credential reset surfaces.
- Replaced hardcoded light-only styling across reviewed route surfaces with semantic theme classes (`bg-card`, `text-card-foreground`, `bg-background`, `bg-muted`, `bg-popover`) and restored the dark-theme primary token to Docassist primary.
- Updated doctor detail, history, assessment, side-effect wizard, chart chips, and dashboard cards to avoid white panels persisting in dark mode.
- Check: `cd frontend && pnpm typecheck` — PASS.
- Residual risk: no browser screenshot pass was run in this workflow; clinical/API-provided labels and date formatting remain source-data/utility driven.

### [R7] — Enrich login page with feature panel, testimonials, disclaimer, and UX polish
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/pages/auth/login/index.tsx:11-28` — left branding panel has logo + tagline + footer only; missing feature description, bullet list, and testimonials carousel.
- `frontend/app/features/auth/login-form.tsx:131-141` — password `<Input>` uses `type='password'` with no show/hide toggle and no placeholders on any input.
- `frontend/app/shared/lib/i18n.ts:64-72` — `login.*` keys exist but lack feature list, testimonials, disclaimer, and placeholder strings.
- `frontend/app/styles/app.css:44-47` — `--docassist-primary: oklch(0.62 0.14 165)` — medium green; architect requests a more pleasant darker teal matching the reference.
- `docs/assets/login-form-reference.png` — reference showing dark teal panel, feature bullets, testimonial card with carousel, password eye toggle, and disclaimer text.

**Observed issue:**
- Left panel contains only logo + single tagline line + copyright footer; reference shows a rich feature panel with description, 4 bullet points, and a testimonials carousel card.
- Password field has no show/hide toggle.
- No input placeholders on email, patient login, or password fields.
- No disclaimer text below the sign-in button.
- Primary color is a bright green rather than the dark teal used in the reference.

**Risk areas:**
- Color change affects every `bg-docassist-primary` usage across the app — intentional per architect instruction.
- Carousel uses `setInterval`; must clear on unmount to avoid memory leaks.
- No API, schema, or security changes; UI only.

#### Implementation Plan

**Done when:** (1) Left panel shows headline + description + 4 feature bullets + auto-rotating testimonials carousel with dots. (2) Password field has show/hide eye toggle. (3) All inputs have placeholder text. (4) Disclaimer text appears below the sign-in form. (5) Primary color is updated to dark teal across the design system. (6) `pnpm typecheck` passes.

**Files:**
- `frontend/app/styles/app.css`
- `frontend/app/shared/lib/i18n.ts`
- `frontend/app/pages/auth/login/index.tsx`
- `frontend/app/features/auth/login-form.tsx`

**Steps:**
1. Update `--docassist-primary` and related tokens in `app.css` to dark teal (`oklch(0.46 0.09 185)` family).
2. Add `login.brandHeadline`, `login.featureDescription`, `login.feature{1-4}`, `login.testimonial{0-2}{Text,Name,Role,Initials}`, `login.disclaimer`, `login.emailPlaceholder`, `login.loginPlaceholder`, `login.passwordPlaceholder` keys in both EN and RU.
3. Redesign left panel in `login/index.tsx`: logo → headline+description+bullets → testimonials carousel with dots.
4. In `login-form.tsx`: add `showPassword` state + Eye/EyeOff toggle on password input; add placeholder props to all inputs.
5. Add disclaimer `<p>` below `<LoginForm />` in `login/index.tsx`.
6. Run `cd frontend && pnpm typecheck`.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

- Updated `--docassist-primary` in `frontend/app/styles/app.css` from green `oklch(0.62 0.14 165)` to dark teal `oklch(0.46 0.09 185)` with matching hover/light/subtle variants; affects all `bg-docassist-primary` usages app-wide per architect instruction.
- Added 23 new `login.*` keys to `frontend/app/shared/lib/i18n.ts` (both EN and RU): `brandHeadline`, `featureDescription`, `feature{1-4}`, `testimonial{0-2}{Text,Name,Role,Initials}`, `disclaimer`, `emailPlaceholder`, `loginPlaceholder`, `passwordPlaceholder`.
- Redesigned `frontend/app/pages/auth/login/index.tsx`: left panel now contains logo → feature section (headline + description + 4 CheckCircle2 bullets, flex-1) → testimonials carousel (3 cards, grid stacking with opacity fade, 5-second auto-rotation, dot navigation, cleared on unmount). Right panel unchanged except disclaimer `<p>` added below `<LoginForm />`.
- Updated `frontend/app/features/auth/login-form.tsx`: added `showPassword` state; password `<Input>` wrapped in `relative` div with Eye/EyeOff toggle button (`tabIndex={-1}`, `pr-10` on input); added `placeholder` prop to email, patient login, and password inputs via new i18n keys; imported `Eye`/`EyeOff` from lucide-react.
- Check: `cd frontend && pnpm typecheck` — PASS.

---

<!-- ═══════════════════════════════════════════════════════
     BATCH 1 — added 2026-05-23
     IDs R1-R15 (old numbering, assigned before notes were extended)
     ═══════════════════════════════════════════════════════ -->

### [R19] — Minimalist application scrollbar styling
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/styles/app.css` — defines global base styles and already reserves scrollbar gutter to prevent layout shift.
- `frontend/app/components/ui/scroll-area.tsx` — shadcn/Radix scroll area wrapper with a visible thumb used by local scrollable widgets.

**Observed issue:**
- The app uses browser-default scrollbar visuals globally, while `ScrollArea` uses the default `bg-border` thumb. This leaves scrollbars visually heavier than the current minimal Docassist chrome.

**Risk areas:**
- Browser scrollbar styling is partially vendor-specific; Firefox and WebKit need separate CSS paths.

#### Implementation Plan

**Done when:** global page scrollbars and shadcn `ScrollArea` thumbs use subtle theme-aware minimalist styling, preserve reserved scrollbar gutter, and do not affect layout dimensions unexpectedly.

**Files:** `frontend/app/styles/app.css`, `frontend/app/components/ui/scroll-area.tsx`, `docs/PHASE_09.md`, `docs/PHASE_09_NOTES.md`

**Steps:**
1. Add theme-aware scrollbar color tokens to `app.css` for light and dark mode.
2. Add global scrollbar styling for Firefox (`scrollbar-width/color`) and WebKit (`::-webkit-scrollbar*`).
3. Update `ScrollArea` scrollbar/thumb classes to match the same minimal visual language.
4. Run focused frontend type-check.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

- Added theme-aware scrollbar tokens and global minimalist scrollbar styling in `frontend/app/styles/app.css`, covering Firefox and WebKit scrollbars while preserving `scrollbar-gutter: stable`.
- Updated `frontend/app/components/ui/scroll-area.tsx` to use slimmer 8px Radix scrollbars and the same theme-aware thumb colors.
- Check: `cd frontend && pnpm typecheck` — PASS.

### [R20] — Add React Router NavigationProgress
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/root.tsx` — root HTML/body shell wraps all routes in `AppProvider` and renders `<Outlet />`.
- `frontend/app/components/ui/` — local shadcn-style components live here; no Progress component exists yet.
- `frontend/app/styles/app.css` — defines top-bar height, z-index context, and global animation/design tokens.

**Observed issue:**
- Route transitions rely on per-page skeletons, but there is no global navigation-progress feedback for React Router loader/action navigation.

**Docs consulted:**
- Context7 `/remix-run/react-router` — `useNavigation()` returns `idle`, `loading`, and `submitting` states and is intended for global pending UI.
- Context7 `/shadcn-ui/ui` — Progress is installed as a local component and imported from the app's component directory.

**Risk areas:**
- The progress indicator must avoid flicker on very fast navigations and must not block pointer interaction or overlay top-bar controls.

#### Implementation Plan

**Done when:** route loader/action navigations show a slim fixed progress bar at the top of the viewport; it animates only while navigation is pending, uses a shadcn-style Progress primitive, respects reduced motion, and does not alter route layout.

**Files:** `frontend/app/components/ui/progress.tsx`, `frontend/app/shared/ui/navigation-progress.tsx`, `frontend/app/root.tsx`, `frontend/app/styles/app.css`, `docs/PHASE_09.md`, `docs/PHASE_09_NOTES.md`

**Steps:**
1. Add a local shadcn-style `Progress` component using the Radix Progress primitive already available through the `radix-ui` package.
2. Add `NavigationProgress` that reads `useNavigation()`, delays visibility briefly to avoid flicker, and drives determinate progress values for loading/submitting states.
3. Mount `NavigationProgress` once in `root.tsx` inside `AppProvider` before `<Outlet />`.
4. Add lightweight CSS keyframes/classes for the progress sheen and reduced-motion behavior.
5. Run focused frontend type-check.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

- Added `frontend/app/components/ui/progress.tsx`, a local shadcn-style Progress component backed by the Radix Progress primitive.
- Added `frontend/app/shared/ui/navigation-progress.tsx`, which uses React Router `useNavigation()` pending state, delays display by 120ms to avoid flicker, completes to 100%, then hides without affecting page layout.
- Mounted `<NavigationProgress />` once in `frontend/app/root.tsx` inside `AppProvider` before route content.
- Added a subtle top-bar sheen animation and reduced-motion override in `frontend/app/styles/app.css`.
- Check: `cd frontend && pnpm typecheck` — PASS.

### [R1] — Reset login form fields on mode switch; fix patient login label
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** open

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/features/auth/login-form.tsx:27-31` — `email`, `tempLogin`, `password` are independent state; switching `mode` does not reset them.
- `frontend/app/features/auth/login-form.tsx:122` — patient login label uses `tCommon('login.patientLogin')`.

**Observed issue:**
- Password (and email/login) entered in doctor mode persist when switching to patient mode and vice versa.
- Label "Логин пациента" is redundant; the form already contextualises the role via the tab switcher.

**Risk areas:**
- No API, schema, or security change; UI-only.

#### Implementation Plan

**Done when:** switching mode clears all fields; patient login label shows just `t('common.login')` or a shorter key.

**Files:** `frontend/app/features/auth/login-form.tsx`, `frontend/app/shared/lib/i18n.ts`

**Steps:**
1. In `login-form.tsx` update both tab-switcher `onClick` handlers to call `setEmail('')`, `setTempLogin('')`, `setPassword('')`, `loginMutation.reset()`, `patientLoginMutation.reset()` after setting mode.
2. Change the patient label to use a simpler key (`tCommon('login')` or repurpose `tCommon('login.patientLoginShort')`).
3. Ensure `login.patientLoginShort` key exists in `i18n.ts` with value `"Логин"` / `"Login"`.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. Both mode-switch `onClick` handlers in `login-form.tsx` now reset `email`, `tempLogin`, `password` and call `.reset()` on both mutations. Patient login label key changed to `tCommon('login.patientLogin')` with value `'Логин'` / `'Login'` (shortened). Typecheck passes.

### [R2] — Replace sidebar with top-bar navigation; remove black chrome header
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready` (architect confirmed in-phase on 2026-05-23)

**Relevant code:**
- `frontend/app/shared/ui/sidebar.tsx` — `PatientSidebar` + `DoctorSidebar` (full lateral navigation).
- `frontend/app/layouts/patient-layout.tsx`, `frontend/app/layouts/doctor-layout.tsx` — `<Sidebar>` wired with fixed left offset.
- `frontend/app/shared/ui/top-bar.tsx` — narrow top bar existed; held logo only on desktop (nav was `md:hidden`); hardcoded black `oklch(0.13 0.01 240)` background.

**Observed issue:**
- Header background hardcoded to dark/black regardless of user theme. Sidebar holds all desktop navigation; top bar was desktop-invisible nav-only.

**Risk areas:**
- Cross-phase layout change; confirmed in-phase by architect.

#### Implementation Plan

**Done when:** sidebar is gone from both layouts; top bar shows full nav on all screen sizes with theme-aware background; no sidebar offset on `<main>`.

**Files:**
- `frontend/app/shared/ui/top-bar.tsx`
- `frontend/app/layouts/doctor-layout.tsx`
- `frontend/app/layouts/patient-layout.tsx`

**Steps:**
1. Rewrite `TopBar` into `PatientTopBar` + `DoctorTopBar` components with role-specific nav, user avatar, and logout. Background → `bg-card border-b border-border`. Nav visible on all screen sizes (remove `md:hidden`).
2. Remove `<Sidebar>` import and usage from both layout files. Remove `md:ml-(--docassist-sidebar-width,180px)` from `<main>`.

**Checks:** `pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`.
- `frontend/app/shared/ui/top-bar.tsx` — rewritten as `PatientTopBar` + `DoctorTopBar` + `TopBar` dispatcher. Background now `bg-card border-b border-border`. Nav visible at all breakpoints with `overflow-x-auto` for mobile. User avatar + name + logout on right. Patient nav includes test/SE notification badges.
- `frontend/app/layouts/doctor-layout.tsx` — `<Sidebar>` removed; `md:ml-...` removed from `<main>`.
- `frontend/app/layouts/patient-layout.tsx` — same.
- `pnpm typecheck` — PASS (0 errors).

### [R3] — Fix wrong default patient route (/ shows "My Medications" not dashboard)
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** open

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/routes.ts:9` — `index('./routes/index.tsx')` under patient layout renders `<HomePage />`.
- `frontend/app/pages/home/index.tsx` — old scaffold page showing "My Medications" and "My Assessments" sections; entirely superseded by `/dashboard` and `/tests`.

**Observed issue:**
- Navigating to `/` (or after login) lands on the stale `HomePage` scaffold instead of the patient `/dashboard`.

**Risk areas:**
- `patients-layout` index route becomes a redirect; `HomePage` can be left in place or removed.

#### Implementation Plan

**Done when:** authenticated patients land on `/dashboard` when they navigate to `/`; the redirect works client-side without a server round-trip.

**Files:** `frontend/app/routes/index.tsx`

**Steps:**
1. Replace `HomeRoute` with a loader-based redirect: import `redirect` from `react-router` and return `redirect('/dashboard')` from a `loader`.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. `routes/index.tsx` rewritten as a loader-only redirect: exports a `loader()` returning `redirect('/dashboard')` and a no-op default export. Typecheck passes.

### [R4] — Doctor patient cards: grid layout, border indicator, archive filter
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** open

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/components/doctor/patient-card.tsx` — horizontal row with left colour strip (`w-1 shrink-0`); rendered in `flex flex-col gap-3` list.
- `frontend/app/routes/doctor/index.tsx:138` — `flex flex-col gap-3` wrapping list; filter only has 'all' | 'attention'.
- Schema `PatientOut` has `archived_at: string | null` field (verified via component: `props.patient.archived_at` check in `patient-header.tsx:103`).

**Observed issue:**
- Cards are horizontal rows, not square/near-square grid tiles.
- No multi-column grid when space is available.
- Border colour strip on the left instead of full-card colour border.
- No "Archive" filter tab; archived patients not accessible at all.

**Risk areas:**
- Grid card needs a minimum width so small cards don't appear on too-wide grids.
- Archive filter requires `patients` API to return archived patients (they may be excluded by default).

#### Implementation Plan

**Done when:** patient roster displays cards in a responsive CSS grid (min ~240 px per card, 2-3 cols on desktop), each card has a coloured border (not strip), displays key meta-info (name, age, diagnosis badge, score, last seen), and an "Архивные" filter tab reveals archived patients.

**Files:** `frontend/app/components/doctor/patient-card.tsx`, `frontend/app/routes/doctor/index.tsx`

**Steps:**
1. Rewrite `PatientCard` to a square-ish card: full-border coloured by status, avatar/initials block, name + age, diagnosis snippet, score chips, medication count.
2. In `DoctorIndexRoute` change list container to `grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4`.
3. Add `'archive'` to `Filter` type; add "Архивные" tab; filter list to `p.archived_at != null` when archive filter active; default filter hides archived patients.
4. Check if `usePatients` returns archived patients by default or needs a param; adjust filter logic accordingly.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. `patient-card.tsx` rewritten as a square-ish grid card with `border-2` status border, initials avatar block, name/age, status badge, score/medication chips. `routes/doctor/index.tsx` layout changed to `grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4`; archive filter added. Note: backend `get_patients_for_doctor` filters out archived patients at the DB level, so the archive tab always shows empty — documented as a backend gap. i18n keys `doctorRoster.archive` and `doctorRoster.noArchive` added.

### [R5] — Add-patient form: multi-step wizard matching design references
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** open

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/components/doctor/add-patient-modal/index.tsx` — single-step form with basic fields; uses shadcn `Dialog`.
- Design refs: `add-patient-form-first-step.png`, `add-patient-form-second-step.png`, `add-patient-form-third-step.png`.

**Observed issue:**
- Current form is a single-step dialog with all fields at once; design reference shows a 3-step wizard (personal info → contact/credentials → confirmation with generated credentials).

**Risk areas:**
- Multi-step state management within the modal; no API change needed if the same `POST /api/v1/doctor/patients` endpoint accepts the full payload.

#### Implementation Plan

**Done when:** add-patient modal is a 3-step wizard: step 1 (personal: name, birth date, gender, diagnosis), step 2 (optional contact info + credential options), step 3 (confirmation with generated login/password); navigates back/forward; submits on step 3.

**Files:** `frontend/app/components/doctor/add-patient-modal/index.tsx`, `frontend/app/shared/lib/i18n.ts`

**Steps:**
1. Introduce local `step` state (1–3) and collect partial form state across steps.
2. Step 1: name, birth_date, gender (select), ICD diagnosis (optional text).
3. Step 2: optional phone/notes + show generated temp_login preview (readonly) and allow custom or auto-generate.
4. Step 3: review summary + submit button; on success show credential copy-field (reuse existing `copy-field.tsx`).
5. Add progress indicator (dots or "1 / 3").
6. Add i18n keys for all step labels and field labels.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. `add-patient-modal/index.tsx` rewritten as 3-step wizard (name → demographics → review) plus existing credentials step. `StepDots` helper renders dot indicators. i18n keys `addPatient.{step1Title, step1Hint, step2Title, step2Hint, step3Title, step3Hint, fullNamePlaceholder, next, back}` added in EN + RU. Typecheck passes.

### [R6] — Patient detail: remove Edit button, reposition Reset Password, fix tab style
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** open

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/components/doctor/patient-header.tsx:99-101` — `Button variant='outline'` Edit button with `Pencil` icon; `onEdit` prop is always `() => {}` (no-op).
- `frontend/app/routes/doctor/patient-detail.tsx:129-133` — `PatientHeader` + `PatientCredentialResetAction` rendered in separate div with `border-t` and `flex justify-end`.
- `frontend/app/components/ui/tabs.tsx` — `variant='line'` tab list; black underline from `border-b-2 border-foreground` on active trigger.

**Observed issue:**
- Edit button has no spec-defined functionality; creates visual noise.
- Reset Password is in a separate bordered div below PatientHeader instead of inline with Archive.
- Active tab has a bold black `border-b-2 border-foreground` underline that feels heavy/dated.

**Risk areas:**
- Removing `onEdit` prop from `PatientHeader` requires removing it from the call site too.

#### Implementation Plan

**Done when:** (1) Edit button absent from PatientHeader. (2) Reset Password appears in the same button row as Archive. (3) Active tab indicator uses primary colour instead of `foreground`.

**Files:** `frontend/app/components/doctor/patient-header.tsx`, `frontend/app/routes/doctor/patient-detail.tsx`, `frontend/app/components/ui/tabs.tsx`

**Steps:**
1. Remove `onEdit` prop and the Edit button from `PatientHeader`; remove from Props type.
2. Move `PatientCredentialResetAction` into the `flex gap-2 shrink-0` button cluster in `PatientHeader`, or restructure the detail page layout to inline it.
3. In `tabs.tsx` update the `line` variant active trigger class: replace `border-foreground` with `border-docassist-primary text-docassist-primary`.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. `patient-header.tsx`: removed `Pencil` import and `onEdit` prop; added `credentialResetSlot?: React.ReactNode` prop. `patient-detail.tsx`: removed `DiagnosisTabSwitcher` block; changed PatientHeader call site to pass `credentialResetSlot`; removed standalone credential reset div. `tabs.tsx`: added `group-data-[variant=line]/tabs-list:after:bg-docassist-primary` and `data-active:text-docassist-primary` to TabsTrigger. Typecheck passes.

### [R7] — Medications tab: translate chart title and empty states
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** open

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/components/doctor/medication-chart.tsx:43` — `"Medication Dose History"` hardcoded EN string.
- `frontend/app/components/doctor/medication-chart.tsx:27-28` — `"Loading chart…"` and `"No medication data."` hardcoded EN.

**Observed issue:**
- Chart heading and empty/loading states are always in English regardless of language setting.

**Risk areas:**
- `useTranslation` must be imported; otherwise no changes.

#### Implementation Plan

**Done when:** chart heading, loading text, and empty state strings in `medication-chart.tsx` are i18n keys resolved at runtime.

**Files:** `frontend/app/components/doctor/medication-chart.tsx`, `frontend/app/shared/lib/i18n.ts`

**Steps:**
1. Add `medicationChart.title`, `medicationChart.loading`, `medicationChart.empty` keys in `i18n.ts` (EN + RU).
2. In `medication-chart.tsx` import `useTranslation`; replace 3 hardcoded strings with `t()` calls.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. `medication-chart.tsx`: `useTranslation` added; title, loading, and empty strings translated via `medicationChart.*` keys. i18n keys `medicationChart.{title, loading, empty}` added in EN + RU. Typecheck passes.

### [R8] — Dynamics tab: remove non-functional diagnosis filter; add translations
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** open

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/routes/doctor/patient-detail.tsx:278-283` — `DiagnosisTabSwitcher` sets `activeDiagId` state, but `ScoreChart` receives only `patientId` and ignores diagnosis.
- `frontend/app/components/charts/score-chart.tsx:51` — `"Score Trends"` hardcoded EN heading.
- `frontend/app/components/charts/assessment-results-table.tsx:52-56` — `DATE`, `TEST`, `SCORE`, `INTERPRETATION`, `Δ` hardcoded EN column headers.

**Observed issue:**
- Clicking diagnosis badges does nothing (no backend API to filter scores by diagnosis; `activeDiagId` is unused).
- "Score Trends" is always English.
- Table column headers are always English; `Δ` has no tooltip explaining what it means.

**Risk areas:**
- Removing the diagnosis switcher section simplifies the tab; no API/schema change.

#### Implementation Plan

**Done when:** (1) Diagnosis tab switcher removed from dynamics tab (no non-functional UI). (2) `ScoreChart` heading uses i18n. (3) Table headers use i18n. (4) Δ column header has a `title` attribute tooltip.

**Files:** `frontend/app/routes/doctor/patient-detail.tsx`, `frontend/app/components/charts/score-chart.tsx`, `frontend/app/components/charts/assessment-results-table.tsx`, `frontend/app/shared/lib/i18n.ts`

**Steps:**
1. Remove `DiagnosisTabSwitcher` block (lines 275–284) and `activeDiagId`/`setActiveDiagId` state from patient detail.
2. Add `scoreChart.title`, `scoreChart.loading`, `scoreChart.noData`, `scoreChart.col{Date,Test,Score,Interpretation,Delta}`, `scoreChart.deltaTooltip` keys in `i18n.ts`.
3. Update `score-chart.tsx` to use `useTranslation` + `t('scoreChart.title')`.
4. Update `assessment-results-table.tsx` to use `useTranslation` + translated headers; add `title={t('scoreChart.deltaTooltip')}` on Δ `<th>`.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. `DiagnosisTabSwitcher` removed from dynamics tab (feature never connected to ScoreChart — filtering was a no-op). `score-chart.tsx` and `assessment-results-table.tsx` translated via `scoreChart.*` keys; Δ header gets `title` tooltip. i18n keys `scoreChart.{title, loading, noData, colDate, colTest, colScore, colInterpretation, colDelta, deltaTooltip}` added in EN + RU. Typecheck passes.

### [R9] — SE monitoring modal: add description, fix dropdown close, mark optional period
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** open

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/components/doctor/se-monitoring-modal.tsx:79` — `DialogTitle` has no subtitle/description.
- `frontend/app/components/doctor/se-monitoring-modal.tsx:121-136` — dropdown `ul` is visible whenever `dictItems.length > 0`; clicking an item sets `selectedSeId` + `searchQ` but the query still returns results for `searchQ`, keeping dropdown open.
- `frontend/app/components/doctor/se-monitoring-modal.tsx:139-147` — period `Input` has no label marking it as optional.

**Observed issue:**
- No description under the modal title explaining its purpose.
- After selecting a side effect from the dropdown, the dropdown stays open because the query refetches with the selected name and still returns matches.
- Period field has no "(опционально)" cue; unclear whether it is required.

**Risk areas:**
- Dropdown close state must be reset when search text is changed again.

#### Implementation Plan

**Done when:** (1) A short descriptive subtitle appears under the modal title. (2) Selecting a dropdown item closes it; re-typing in the search field reopens it. (3) Period field label shows "(опционально)".

**Files:** `frontend/app/components/doctor/se-monitoring-modal.tsx`, `frontend/app/shared/lib/i18n.ts`

**Steps:**
1. Add `seMonitoring.description`, `seMonitoring.periodOptional` keys in `i18n.ts`.
2. Add `<p className='text-xs text-muted-foreground'>` subtitle after `DialogTitle` using the new key.
3. Add `showDropdown` boolean state (default `false`); set `true` on `onChange`; set `false` on item click; gate the `<ul>` on `showDropdown && dictItems.length > 0`.
4. In the period `Input` container add a `<span className='text-xs text-muted-foreground'>` optional label next to the input.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. `se-monitoring-modal.tsx`: description paragraph added below DialogTitle; `showDropdown` state gates the autocomplete `<ul>`; item click and mutation success both set `showDropdown(false)`; search onChange sets `showDropdown(true)` and clears `selectedSeId`. Optional period label `seMonitoring.periodOptional` added below input. i18n keys `seMonitoring.{description, periodOptional}` added in EN + RU. Typecheck passes.

### [R10] — Event log tab: redesign with icons and human-readable labels
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** open

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/components/doctor/event-timeline.tsx` — renders raw `event_type` string + `JSON.stringify(e.payload)` without icon, colour, or readable formatting.
- Reference: `docs/assets/patient-detail-events-log-tab-page.png`.

**Observed issue:**
- Payload is shown as raw JSON; event_type is a code string. Doctors see unreadable technical data.

**Risk areas:**
- Event types are strings from the backend; unknown types should fall back gracefully.

#### Implementation Plan

**Done when:** each event row renders an icon + human-readable label (mapped from `event_type`); payload fields are formatted as key-value readable text; unknown event types fall back to a generic icon + the raw type string.

**Files:** `frontend/app/components/doctor/event-timeline.tsx`, `frontend/app/shared/lib/i18n.ts`

**Steps:**
1. Create a static `EVENT_META` map: `event_type → { icon: LucideIcon, labelKey: string }`.
2. Add `events.*` i18n keys for each known event type in `i18n.ts`.
3. Update `EventTimeline` to render icon + `t(meta.labelKey)` label; format payload as readable key-value pairs using a `formatPayload` helper instead of `JSON.stringify`.
4. Add filter by category (optional — if event types are discoverable from data).

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. `event-timeline.tsx` completely rewritten. `EVENT_META` map provides icon, colour class, and i18n label key for 7 known event types; FALLBACK_META handles unknowns. `formatPayload` helper renders `payload` object as readable "key: value" string. Rows show coloured icon badge, label, detail, and timestamp. Pagination uses translated prev/next labels. i18n keys `events.{loading, empty, prev, next, unknown, assessmentCompleted, medicationTaken, medicationMissed, sideEffectReported, sideEffectResolved, patientCreated, profileUpdated}` added. Typecheck passes.

### [R11] — Patient drugs: prevent duplicate dose log actions with visual feedback
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** open

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/routes/drugs/components/med-log-card.tsx:19-22` — `handleLog` calls `logMutation.mutate()` without tracking whether today's dose was already logged; `disabled` only during pending state.
- No local state tracks whether today's dose was already logged; re-clicking "Принял" after mutation completes creates duplicate events.

**Observed issue:**
- After a successful "Принял" click the button re-enables immediately; clicking again logs the dose twice with no visual feedback that the first action was recorded.

**Risk areas:**
- Medication localization: `.medication.inn` is an international name; may not have a separate `name_ru`. The note requests localization but the data model may not support it — keeping `inn` display as-is and noting the gap.

#### Implementation Plan

**Done when:** after a successful "Принял" or "Пропустил" action the card shows a confirmed state badge and the action buttons are replaced/greyed; the card resets on the next calendar day.

**Files:** `frontend/app/routes/drugs/components/med-log-card.tsx`

**Steps:**
1. Add local `logged` state (`null | 'taken' | 'missed'`) to `MedLogCard`.
2. On mutation `onSuccess`, set `logged` to the action taken.
3. When `logged` is set, replace buttons with a confirmation badge (e.g., "✓ Принято" or "Пропущено") styled with muted/success colours.
4. Medication name localization: `medication.inn` has no `name_ru` in current schema — document as out-of-scope gap.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. `med-log-card.tsx` rewritten: `logged: 'taken' | 'missed' | null` state replaces the old disable-only guard. After `onSuccess`, `setLogged(status)` replaces both buttons with a confirmation badge (CheckCircle2/XCircle). Medication name localization gap documented: `medication.inn` is English-only in current schema — out of scope for this phase.

### [R12] — Assessment UX: explicit Next step, show completion on tests list
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** open

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/routes/assessment/hooks/use-assessment-wizard.ts:32-57` — `handleAnswer` immediately advances to next step on selection; no explicit confirmation step.
- `frontend/app/routes/assessment/index.tsx:58-76` — answer buttons directly call `wizard.handleAnswer(opt.value)` with no intermediate "review selected answer" state.
- `frontend/app/routes/tests/components/test-card.tsx` — needs to visually distinguish recently-completed tests.

**Observed issue:**
- Clicking an answer option immediately jumps to the next question; accidental taps are not recoverable without going back.
- After completing a test, the tests list shows all tests with no indication of which was just submitted.

**Risk areas:**
- Slowing answer advance requires local "selected-but-not-confirmed" state; must not break the existing "Next" / "Finish" button flow.

#### Implementation Plan

**Done when:** (1) Clicking an answer highlights the option and updates the "Next →" / "Завершить" button to active — but does NOT auto-advance. (2) The explicit "Next" button is required to advance. (3) Tests list shows a "completed" badge on scales whose `status !== 'pending'` in the tasks list.

**Files:** `frontend/app/routes/assessment/hooks/use-assessment-wizard.ts`, `frontend/app/routes/assessment/index.tsx`, `frontend/app/routes/tests/components/test-card.tsx`

**Steps:**
1. In `use-assessment-wizard.ts` split `handleAnswer` into `selectAnswer(value)` (sets answer only) and `advance()` (moves step forward or submits); remove auto-advance from `selectAnswer`.
2. In `assessment/index.tsx` wire answer button `onClick` to `wizard.selectAnswer`; wire "Далее →" / "Завершить" button to `wizard.advance` (enabled when `wizard.currentAnswer` is set).
3. In `test-card.tsx` add a `"Пройден"` badge when the scale is not in `pendingScaleIds`.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. `use-assessment-wizard.ts` refactored: `handleAnswer` split into `selectAnswer(value)` (sets answer only, no step advance) and `advance()` (advances or submits). `assessment/index.tsx` wired: answer button → `selectAnswer`, Next/Finish button → `advance` (enabled only when `currentAnswer` set). `test-card.tsx` updated: shows green CheckCircle2 "Пройден" badge when `!isPending`; icon tint and card icon colour switch to green for completed scales. i18n key `patientPortal.completed` added. Typecheck passes.

### [R13] — SE wizard filter bug: body-system keys don't match backend values
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** open

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/components/patient/se-wizard/constants/body-systems.ts` — keys: `''`, `'Психические'`, `'ЦНС'`, `'Вегетативные'`, `'ЖКТ'`, `'Кожные'`, `'Другое'`.
- `app/seeders/side_effects.py` — backend stores: `psychic`, `neurological`, `autonomic`, `other`. No `ЖКТ` or `Кожные` categories exist separately — GI effects are under `autonomic`; skin effects are under `other`.

**Observed issue:**
- Filtering by any body system badge other than "Все" sends Russian labels to the API, which stores English snake_case values → 0 results returned.

**Risk areas:**
- `'ЖКТ'` and `'Кожные'` badges don't correspond to real backend categories and should be removed or mapped.

#### Implementation Plan

**Done when:** body system filter badges send the correct English backend values (`psychic`, `neurological`, `autonomic`, `other`); the Russian labels remain unchanged for display; "Все" still returns all items.

**Files:** `frontend/app/components/patient/se-wizard/constants/body-systems.ts`

**Steps:**
1. Replace BODY_SYSTEMS keys with English backend values: `''`, `'psychic'`, `'neurological'`, `'autonomic'`, `'other'`.
2. Update labels to descriptive Russian that matches the actual UKU categories: `'Все'`, `'Психические'`, `'Неврологические'`, `'Вегетативные'`, `'Другое'`. Remove the non-existent `'ЖКТ'` and `'Кожные'` separate entries.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. `body-systems.ts` BODY_SYSTEMS keys updated from Russian display strings to English backend values (`psychic`, `neurological`, `autonomic`, `global`, `tardive`, `other`). Russian display labels updated/corrected. Non-existent categories `ЖКТ` and `Кожные` removed; `global` and `tardive` categories discovered in seeder and added. Typecheck passes.

### [R14] — Add skeleton loading to all major pages and components
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** open

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- All pages currently use plain `<div className='p-6 text-sm text-muted-foreground'>{t('loading')}</div>` text placeholders.
- `frontend/app/shared/ui/page-skeleton.tsx`, `frontend/app/shared/ui/section-skeleton.tsx` — skeleton primitives already scaffolded in the phase file list.

**Observed issue:**
- Page loads display a spinner/text fallback; no structural skeleton that preserves the page layout during data fetch.

**Risk areas:**
- Skeleton structure must match each page's actual card/list structure; otherwise it introduces layout shift.

#### Implementation Plan

**Done when:** major patient and doctor pages show skeleton card/row placeholders instead of plain text during the initial `isLoading` state.

**Files:** `frontend/app/shared/ui/page-skeleton.tsx` (create), `frontend/app/shared/ui/section-skeleton.tsx` (create), major page routes.

**Steps:**
1. Create reusable `Skeleton` base component (animated shimmer `div`) in `frontend/app/components/ui/skeleton.tsx` if not already present.
2. Create `PageSkeleton` (full-page card grid placeholder) and `SectionSkeleton` (list/card block placeholder).
3. Replace text loading states in: `routes/doctor/index.tsx`, `routes/doctor/patient-detail.tsx`, `routes/tests/index.tsx`, `routes/drugs/index.tsx`, `routes/side-effects/index.tsx`, `routes/profile/index.tsx`.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. `components/ui/skeleton.tsx` created — minimal `animate-pulse rounded-md bg-muted` component. All 6 target pages updated: `doctor/index.tsx` shows 6 skeleton cards in the same grid layout; `patient-detail.tsx` shows header + tab + content block skeletons (inline scales loading also upgraded); `tests/index.tsx`, `drugs/index.tsx`, `side-effects/index.tsx` each show 3-4 row skeletons; `profile/index.tsx` shows title + 3 section skeletons. No new PageSkeleton abstraction — structural skeletons inlined at each call site. Typecheck passes.

### [R15] — Unify layout and responsive design across all pages
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready` (implemented together with R2)

**Relevant code:**
- `routes/dashboard.tsx` → `pages/dashboard/ui/dashboard-page.tsx` — `p-6`, no max-width.
- `routes/doctor/index.tsx` — `p-6`, no max-width.
- `routes/doctor/patient-detail.tsx` — `p-6 max-w-5xl`, no `mx-auto` (left-aligned).
- `routes/drugs/index.tsx`, `routes/tests/index.tsx`, `routes/side-effects/index.tsx` — `p-6`, no max-width.
- `routes/doctor/profile.tsx`, `routes/profile/index.tsx` — already had `mx-auto max-w-5xl p-4 md:p-6`.

**Observed issue:**
- Inconsistent centering, max-widths, and padding breakpoints across all authenticated pages.

**Risk areas:**
- Done immediately after R2 sidebar removal; no offset conflicts.

#### Implementation Plan

**Done when:** all content pages use `mx-auto max-w-5xl p-4 sm:p-6` (or `space-y-*` variant). Skeleton states match.

**Files:** 8 page files + 1 component page.

**Steps:**
1. Add `mx-auto max-w-5xl` + change `p-6` → `p-4 sm:p-6` in each page root div and its skeleton sibling.
2. Change `md:p-6` → `sm:p-6` in pages that already had `mx-auto`.

**Checks:** `pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. All 8 page containers and their skeleton loading states updated to `mx-auto max-w-5xl p-4 sm:p-6`:
- `pages/dashboard/ui/dashboard-page.tsx`
- `routes/doctor/index.tsx` (grid stays `auto-fill minmax(240px,1fr)` within 5xl)
- `routes/doctor/patient-detail.tsx` (added `mx-auto` to existing `max-w-5xl`)
- `routes/doctor/profile.tsx` (`md:p-6` → `sm:p-6`)
- `routes/drugs/index.tsx`
- `routes/tests/index.tsx`
- `routes/side-effects/index.tsx`
- `routes/profile/index.tsx` (`md:p-6` → `sm:p-6`)
- `pnpm typecheck` — PASS (0 errors).

---

<!-- ═══════════════════════════════════════════════════════
     BATCH 2 — added 2026-05-23
     R7-R16: second set of architect review notes, ordered by
     checkbox position in PHASE_09.md Architect Review Notes
     ═══════════════════════════════════════════════════════ -->

### [R7] — Role boundary bug: doctor navigating to `/` sees patient interface
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/routes.ts:7-16` — `/` (index) is nested inside `patient-layout`, so any authenticated user navigating to `/` gets patient chrome + redirect to `/dashboard`.
- `frontend/app/layouts/patient-layout.tsx` — calls `useAuthGuard()` which only checks for a token, not the user's role.
- `frontend/app/layouts/doctor-layout.tsx` — same token-only guard.
- `frontend/app/features/auth/use-auth-guard.ts` — `shouldRedirectToLogin` returns true only when there is no access token; role is not checked.
- `frontend/app/shared/api/auth.ts:32-39` — `useCurrentSession()` returns `SessionInfoOut` which includes `role: "doctor" | "patient"`.

**Observed issue:**
- An authenticated doctor navigating to `/` is rendered inside the patient layout (patient top-bar, patient navigation) because the patient-layout auth guard accepts any valid token regardless of role.
- Symmetric problem exists for a patient navigating to `/doctor`.

**Risk areas:**
- `useCurrentSession()` requires an async API fetch; there is a brief loading period before the role is known. Layout must not render `<Outlet />` during this window.
- `router.navigate` must not be called during the render phase; must be in `useEffect`.

#### Implementation Plan

**Done when:** A doctor navigating to `/` is immediately redirected to `/doctor` without seeing patient chrome or dashboard content; a patient navigating to `/doctor` is redirected to `/dashboard`. Both layouts show nothing (not patient/doctor content) while the role is loading.

**Files:** `frontend/app/layouts/patient-layout.tsx`, `frontend/app/layouts/doctor-layout.tsx`

**Steps:**
1. In `patient-layout.tsx` import `useCurrentSession` and `useRouter`; add a `useEffect` that redirects to `/doctor` when `role === 'doctor'`; return `null` when `!isAuthenticated || sessionQuery.isLoading || role === 'doctor'`.
2. In `doctor-layout.tsx` apply the symmetric guard: redirect to `/dashboard` when `role === 'patient'`; return `null` when `!isAuthenticated || sessionQuery.isLoading || role === 'patient'`.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. `patient-layout.tsx` now calls `useCurrentSession()`; a `useEffect` redirects to `/doctor` when `role === 'doctor'`; renders `null` while `!isAuthenticated`, `sessionQuery.isLoading`, or `role === 'doctor'` — eliminating both the role-boundary bug and the unauthenticated flash. `doctor-layout.tsx` has the symmetric guard: redirects to `/dashboard` when `role === 'patient'`.

### [R8] — Logout intermittently fails to redirect to `/login`
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/shared/ui/top-bar.tsx:82,148` — `PatientTopBar` and `DoctorTopBar` both call `logoutMutation.mutate(undefined, { onSettled: () => router.navigate('/login', { replace: true }) })` — navigation is present.
- `frontend/app/routes/profile/components/session-info-panel.tsx:38` — `logoutMutation.mutate()` with NO navigation callback; relies on layout guard to redirect.
- Layout guards currently use only `useEffect` (fires after first render), so there can be a brief window where the cleared-auth state is visible without redirect.

**Observed issue:**
- Intermittent failure to redirect is caused by the race between `useAuthGuard`'s `useEffect` (async) and the cleared JWT state. The R7 layout fix (returning `null` when `!isAuthenticated`) removes this race for all pages inside the layout.

**Risk areas:**
- R7 layout fix resolves this indirectly; no separate code change needed for the top-bar logout buttons.

#### Implementation Plan

**Done when:** After any logout action (top-bar button or session panel), the user is immediately redirected to `/login` without seeing the previously-protected page in a broken state.

**Files:** `frontend/app/layouts/patient-layout.tsx`, `frontend/app/layouts/doctor-layout.tsx` (via R7 fix); `frontend/app/routes/profile/components/session-info-panel.tsx` (explicit navigation)

**Steps:**
1. R7 layout fix eliminates the flash/race for the top-bar logout buttons.
2. In `session-info-panel.tsx` add explicit `useRouter` + navigation callback to the "Завершить сессию" button's `onClick`.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. The R7 layout fix resolves the top-bar logout race (layouts return `null` immediately when `!isAuthenticated`). `session-info-panel.tsx` updated with explicit navigation: `logoutMutation.mutate(undefined, { onSettled: () => router.navigate('/login', { replace: true }) })`.

### [R9] — Flash of patient page before redirect to `/login` when unauthenticated
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/features/auth/use-auth-guard.ts:14-24` — redirect is inside `useEffect`, which fires after the first render paint.
- `frontend/app/layouts/patient-layout.tsx` — renders `<Outlet />` unconditionally (it currently never renders `null`); the first render shows the page shell before the effect fires.
- `frontend/app/shared/api/auth.ts:10-19` — `useAuthToken` uses `initialData: () => jwtService.read()` which resolves synchronously from localStorage; `isAuthenticated` is therefore known on the very first render.

**Observed issue:**
- Because `isAuthenticated` is already `false` on the first render (no token in localStorage), the layout can return `null` immediately rather than render the page shell, eliminating the flash.

**Risk areas:**
- Covered by R7 fix: returning `null` when `!isAuthenticated` prevents any page content from rendering before the redirect effect fires.

#### Implementation Plan

Resolved by the same `if (!isAuthenticated) return null` guard added in the R7 fix.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. Resolved by R7 layout fix: `if (!isAuthenticated) return null` prevents any render before the `useAuthGuard` effect fires. `isAuthenticated` is computed from `initialData` (synchronous localStorage read), so it is already `false` on the very first render when there is no token.

### [R10] — Doctor patient cards: colored background matching status
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/components/doctor/patient-card.tsx:72` — card root uses `bg-card border-2 ${borderClass}`; `borderClass` maps to `border-status-*` tokens.
- `frontend/app/styles/app.css:55-66` — design tokens `--color-status-*-bg` (very light tinted backgrounds) and `--color-status-*` (border/accent color).

**Observed issue:**
- Cards have a neutral `bg-card` background with only a colored `border-2`; architect wants a soft tinted background matching the status color.

**Risk areas:**
- The `*-bg` tokens are already very light (`oklch` lightness ≥ 0.95–0.97), so readability is not a concern. Text uses `text-card-foreground` which remains unchanged.

#### Implementation Plan

**Done when:** Each patient card uses the matching `bg-status-*-bg` background (and keeps `border-status-*` border); text remains readable in light and dark mode.

**Files:** `frontend/app/components/doctor/patient-card.tsx`

**Steps:**
1. Add `CARD_BG` mapping: `red → 'bg-status-critical-bg'`, `yellow → 'bg-status-warning-bg'`, `green → 'bg-status-ok-bg'`, `gray → 'bg-status-none-bg'`.
2. Replace `bg-card` with `${cardBgClass}` in the card root `className`.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. Added `CARD_BG` map in `patient-card.tsx` (`red/yellow/green/gray → bg-status-*-bg`); replaced `bg-card` with `${cardBgClass}` in card root. Fixed accompanying Tailwind canonical class warning (`min-h-[160px]` → `min-h-40`).

### [R11] — Add-patient modal: combined credential copy block
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/components/doctor/add-patient-modal/index.tsx:67-78` — credentials step shows two separate `<CopyField>` components (login, password).
- `frontend/app/components/doctor/add-patient-modal/components/copy-field.tsx` — single-field copy component.

**Observed issue:**
- Doctor must copy login and password separately; architect wants a single block that copies both together in the format `login: <value>\npassword: <value>`.

**Risk areas:**
- No API change; UI-only addition above the two individual copy fields.

#### Implementation Plan

**Done when:** A "Скопировать оба" button in the credentials step copies `login: {temp_login}\npassword: {temp_password}` to clipboard in one click.

**Files:** `frontend/app/components/doctor/add-patient-modal/index.tsx`, `frontend/app/shared/lib/i18n.ts`

**Steps:**
1. In `i18n.ts` add `addPatient.copyBoth` (EN: "Copy both", RU: "Скопировать оба") and `addPatient.copied` (EN: "Copied!", RU: "Скопировано!").
2. In `add-patient-modal/index.tsx` credentials step, add a `<Button variant="outline">` that calls `navigator.clipboard.writeText(...)` with the combined string; show a brief "Скопировано!" feedback using local state.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. Added `addPatient.copyBoth` / `addPatient.copied` i18n keys (EN + RU). In `add-patient-modal/index.tsx` credentials step, added `handleCopyBoth` that writes `login: {temp_login}\npassword: {temp_password}` to clipboard and briefly shows "Скопировано!" feedback via `copiedBoth` state with 2-second timeout.

### [R12] — Medication assign: show dropdown on focus; translate dosage units
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/components/doctor/medication-assign-form.tsx:76` — dropdown `<ul>` only appears when `results.length > 0 && query.length >= 2`.
- `frontend/app/shared/api/medications.ts:17-23` — `useMedicationSearch(q)` is `enabled: q.length >= 2`; API accepts `q?: string | null` and returns results with no minimum length requirement.
- `frontend/app/shared/types/schema.ts:977-988` — `MedicationReferenceOut` has only `id`, `inn`, `brand_names`; **no `name_ru` field exists** — medication name localization to Russian requires a backend schema change and is out of scope for this note.
- `frontend/app/components/doctor/medication-assign-form.tsx:115-119` — `SelectItem` values for units are `'mg'`, `'mcg'`, `'ml'`, `'g'` with hardcoded English labels.

**Observed issue:**
- Dropdown only appears after 2+ characters are typed; architect wants all medications shown on focus.
- Dosage unit labels (`mg`, `mcg`, `ml`, `g`) are English-only; Russian users see no translation.
- Medication name localization: **not implementable without backend schema change** (no `name_ru` field in `MedicationReferenceOut`).

**Risk areas:**
- Adding a new `useMedicationBrowse` hook that fires with `enabled: true` (no minimum length) may fetch a large list; a `size` or `limit` parameter should be passed.

#### Implementation Plan

**Done when:** (1) Focusing the medication search field shows a dropdown with all medications. (2) Dosage unit select shows translated labels (мг/мкг/мл/г) when Russian locale is active. (3) Limitation documented: medication name i18n requires backend `name_ru` field — deferred.

**Files:** `frontend/app/shared/api/medications.ts`, `frontend/app/components/doctor/medication-assign-form.tsx`, `frontend/app/shared/lib/i18n.ts`

**Steps:**
1. Add `useMedicationBrowse(q: string)` hook with `enabled: true` and `q || undefined` passed to API.
2. In `medication-assign-form.tsx` add `showDropdown` state; set `true` on `onFocus` and `onChange`; set `false` on item select; gate dropdown on `showDropdown && results.length > 0`.
3. Switch from `useMedicationSearch` to `useMedicationBrowse` in form component.
4. Add `medication.unit{Mg,Mcg,Ml,G}` i18n keys (EN: `mg/mcg/ml/g`, RU: `мг/мкг/мл/г`); use them in `SelectItem` labels.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. Added `useMedicationBrowse(q)` hook (`enabled: true`, no min-length) to `medications.ts`. `medication-assign-form.tsx` updated: `showDropdown` state, `onFocus`/`onChange` set it true, `onBlur` closes after 150 ms delay (to allow click on item), item select also closes it. Switched from `useMedicationSearch` to `useMedicationBrowse`. Dosage unit `SelectItem` labels now use `t('medication.unitMg/Mcg/Ml/G')` — renders `мг/мкг/мл/г` in Russian. Limitation: medication `inn` names remain in English/Latin; no `name_ru` field in `MedicationReferenceOut` — backend schema change required.

### [R13] — SE monitoring: show all options on input focus
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/components/doctor/se-monitoring-modal.tsx:122` — `onChange` handler sets `showDropdown(true)` and clears `selectedSeId`.
- `frontend/app/components/doctor/se-monitoring-modal.tsx:124` — dropdown gated on `showDropdown && dictItems.length > 0`.
- `frontend/app/shared/api/side-effects.ts:16-24` — `useSeDictionary(q)` passes `q || undefined`; `enabled: true` always; so `dictItems` already has data when `q === ''`.

**Observed issue:**
- `showDropdown` is only set to `true` in `onChange`; focusing the field without typing shows nothing even though `dictItems` has all SE entries.

**Risk areas:**
- None; one-line `onFocus` addition.

#### Implementation Plan

**Done when:** Focusing the SE search field immediately shows the full dictionary list; typing narrows it; selecting an item closes it.

**Files:** `frontend/app/components/doctor/se-monitoring-modal.tsx`

**Steps:**
1. Add `onFocus={() => setShowDropdown(true)}` to the `<Input>` in the search field.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. Added `onFocus={() => setShowDropdown(true)}` to the SE search `<Input>` in `se-monitoring-modal.tsx`. `dictItems` is already populated for empty `q` (API returns all items when no query is given), so the dropdown appears immediately on focus.

### [R14] — Test content: add Russian translations for clinical scale questions
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `fixed: Clinical scale question and option text is stored in JSONB column questions_json in the scales table. No traditional relational migration was required — added text_ru/label_ru as new keys in the JSONB objects. Alembic migration 0010_scale_questions_ru adds name_ru Text column to scales table and updates questions_json for PHQ9/GAD7/YMRS via raw SQL UPDATE. Backend ScaleOut schema extended with name_ru: str | None; ScaleQuestion schema extended with text_ru: str | None. Seeder updated to include all translations and changed from on_conflict_do_nothing to on_conflict_do_update for questions_json/name_ru. Frontend picks locale-appropriate field at render time using i18n.language === "ru" guard in assessment wizard, test card, test success screen, and history page.`

**Risk areas:**
- JSONB data migration: op.get_bind().execute() with parameterized CAST(:qj AS jsonb).

#### Implementation Plan

1. `alembic/versions/0010_scale_questions_ru.py` — add `name_ru` column + UPDATE `questions_json` for PHQ9/GAD7/YMRS with `text_ru`/`label_ru`
2. `app/modules/scales/models.py` — add `name_ru: Mapped[str | None]`
3. `app/modules/scales/schemas.py` — add `name_ru` to `ScaleOut`, `text_ru` to `ScaleQuestion`
4. `app/seeders/scales.py` — add translations; switch to `on_conflict_do_update`
5. Run `uv run alembic upgrade head` in Docker backend
6. Run `pnpm generate:api` to regenerate OpenAPI types
7. `frontend/app/routes/assessment/index.tsx` — `isRu` guard for question `text_ru`/`label_ru` and scale `name_ru`
8. `frontend/app/routes/tests/components/test-card.tsx` — `name_ru` for scale name
9. `frontend/app/routes/assessment/components/test-success-screen.tsx` — `name_ru` for scale name
10. `frontend/app/routes/history.tsx` — `name_ru` for scale name

#### Implementation Notes

_Implemented `2026-05-23`._ Alembic migration `0010_scale_questions_ru` applied. All PHQ-9 (9 questions), GAD-7 (7 questions), YMRS (11 questions) now carry `text_ru` per question and `label_ru` per option. Scale names: PHQ-9 → "Опросник здоровья пациента — 9", GAD-7 → "Шкала генерализованного тревожного расстройства — 7", YMRS → "Шкала мании Янга". Frontend renders Russian text when `i18n.language === 'ru'`, falling back to English if a translation is absent. TypeScript typecheck passes (0 errors).

### [R15] — Tests list: status not updated after completing a test
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/shared/api/scales.ts:80-92` — `useSubmitTestMutation` only invalidates `scalesQueryKeys.history()` on success; does NOT invalidate `['scales', 'my-assigned']` or `taskQueryKeys.myTasks()`.
- `frontend/app/routes/tests/index.tsx:22-27` — `TestsPage` derives `pendingScaleIds` from `usePatientTasks()` (`['tasks', 'my']`); uses `useMyAssignedScales()` (`['scales', 'my-assigned']`) for the scale list.
- After submission, neither query is invalidated, so the tests list still shows the test as pending.

**Observed issue:**
- After completing a test and returning to `/tests`, the completed scale still appears as "Ожидает" because `usePatientTasks` and `useMyAssignedScales` caches are stale.

**Risk areas:**
- None; straightforward cache invalidation addition.

#### Implementation Plan

**Done when:** After completing a test, the tests list immediately shows the updated status (non-pending) for the submitted scale.

**Files:** `frontend/app/shared/api/scales.ts`

**Steps:**
1. In `useSubmitTestMutation.onSuccess`, add `queryClient.invalidateQueries({ queryKey: taskQueryKeys.myTasks() })` and `queryClient.invalidateQueries({ queryKey: ['scales', 'my-assigned'] })`.
2. Import `taskQueryKeys` from `@shared/api/tasks`.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. `useSubmitTestMutation.onSuccess` now additionally invalidates `['scales', 'my-assigned']` and `taskQueryKeys.myTasks()`. Both queries are used by `TestsPage` to derive the `pendingScaleIds` set, so after submission the tests list immediately reflects the updated status.

### [R16] — Session end button: should redirect if ending current session
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/routes/profile/components/session-info-panel.tsx:38` — "Завершить сессию" calls `logoutMutation.mutate()` with no navigation; user stays on `/profile` after JWT is cleared.
- R7 layout fix (`if (!isAuthenticated) return null`) removes the flash, but `useAuthGuard`'s `useEffect` must still fire to navigate; the user briefly sees `null` (blank) before the effect fires.

**Observed issue:**
- Ending the current session from the profile panel leaves the user on the profile page (unauthenticated) until `useAuthGuard` effect fires; adding explicit navigation in `onSettled` makes the redirect immediate and intentional.

**Risk areas:**
- This is semantically correct: ending the session IS a logout; redirecting to `/login` is the right UX response.

#### Implementation Plan

**Done when:** Clicking "Завершить сессию" redirects to `/login` immediately after logout completes.

**Files:** `frontend/app/routes/profile/components/session-info-panel.tsx`

**Steps:**
1. Import `useRouter` from `@shared/hooks/use-router`.
2. Add `const router = useRouter()` to component.
3. Update button `onClick` to `logoutMutation.mutate(undefined, { onSettled: () => router.navigate('/login', { replace: true }) })`.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. `session-info-panel.tsx`: imported `useRouter`; "Завершить сессию" button now calls `logoutMutation.mutate(undefined, { onSettled: () => router.navigate('/login', { replace: true }) })`. Navigation is explicit and immediate rather than relying on the async `useAuthGuard` effect.

### [R17] — Fix clipped top-bar notification badges
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/shared/ui/top-bar.tsx:47-68` — mobile top-bar nav has `overflow-x-auto`; per-link badges are absolutely positioned with negative top/right offsets, so the scroll container can clip them.
- `frontend/app/shared/ui/sidebar.tsx:84-87` — sidebar badge uses a different min-width/padding model, so counters can render oval instead of consistently circular.

**Observed issue:**
- Top-bar counters are outside the link box due to negative absolute offsets and are clipped by the scrolling nav container.
- Badge sizing is duplicated and inconsistent between top bar and sidebar.

**Risk areas:**
- CSS-only UI fix; no API or data risk.

#### Implementation Plan

**Done when:** patient navigation counters render inside their containers without clipping, use one reusable circular style, and display `9+` for counts above 9.

**Files:** `frontend/app/shared/ui/top-bar.tsx`, `frontend/app/shared/ui/sidebar.tsx`

**Steps:**
1. Add a small local `formatBadgeCount` helper and `NotificationBadge` component to each chrome file.
2. Render top-bar badges inline instead of absolutely positioned with negative offsets.
3. Use fixed `size-4`, `aspect-square`, `rounded-full`, and `tabular-nums` badge classes in top bar and sidebar.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. `top-bar.tsx` now renders notification counters inline inside each nav link instead of absolutely positioning them outside the link box, so the mobile `overflow-x-auto` nav no longer clips them. `top-bar.tsx` and `sidebar.tsx` both format large counts as `9+` and use fixed circular `size-4` badge styling.

### [R18] — Prevent layout shift from scrollbar appearance
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/styles/app.css:218-228` — base document styles do not reserve scrollbar gutter space.
- Authenticated layouts use fixed top/sidebar chrome, so viewport width changes from page scrollbar appearance can visibly shift centered page content.

**Observed issue:**
- Pages with short content and pages with long content can alternate between no vertical scrollbar and a vertical scrollbar, changing available inline width and causing content to jump.

**Risk areas:**
- CSS-only baseline change; `scrollbar-gutter` support is progressive, with `overflow-y: scroll` as the stable fallback.

#### Implementation Plan

**Done when:** document-level page width remains stable as route content changes between scrollable and non-scrollable pages.

**Files:** `frontend/app/styles/app.css`

**Steps:**
1. Reserve document scrollbar space with `scrollbar-gutter: stable`.
2. Keep a vertical scrollbar track available on `html` so older engines also avoid width jumps.

**Checks:** `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. `app.css` now reserves document scrollbar space with `scrollbar-gutter: stable` and keeps the vertical scrollbar track available on `html` via `overflow-y: scroll`, preventing route-to-route width jumps when page content crosses the viewport height.

### [R19] — Complete pending test task after assessment submission
**Source:** `docs/PHASE_09.md` § Architect Review Notes
**Status:** fixed

#### Exploration

_Explored:_ `2026-05-23` · _Verdict:_ `ready`

**Relevant code:**
- `frontend/app/shared/api/scales.ts:89-92` — submission success already invalidates history, assigned scales, and patient tasks.
- `frontend/app/routes/tests/index.tsx:23-27` — pending status is derived from pending test tasks by `reference_id`.
- `app/modules/scales/service.py:88-124` — submitting a test creates `TestCompletion` and an event, but does not update the matching pending `Task`.
- `app/modules/tasks/repository.py:25-31` — patient task API returns only pending tasks.

**Observed issue:**
- The frontend cache invalidation is not enough: the backend still returns the completed assessment's pending test task, so `/tests` continues to show `Ожидает` after refetch.

**Risk areas:**
- Behavioral backend fix within existing task status contract; no schema or response shape changes.

#### Implementation Plan

**Done when:** submitting a test marks the matching pending `test` task for the same patient and patient-scale reference as `done`, and `/api/v1/patient/tasks` no longer returns it until the next generated due task.

**Files:** `app/modules/tasks/repository.py`, `app/modules/scales/dependencies.py`, `app/modules/scales/service.py`, `tests/test_scales.py`

**Steps:**
1. Add a task repository method that finds pending tasks by patient/type/reference and marks them `done` with `updated_at`.
2. Inject `TaskRepository` into `TestCompletionService` and call it after successful test completion creation.
3. Add a backend test covering pending test task removal from the patient task list after submit.

**Checks:** `uv run pytest tests/test_scales.py`, `cd frontend && pnpm typecheck`

#### Implementation Notes

Implemented `2026-05-23`. Added `TaskRepository.mark_pending_done(...)` and injected `TaskRepository` into `TestCompletionService`. Successful assessment submission now marks matching pending `test` tasks for the same patient and patient-scale reference as `done`, which removes the completed assessment from `/api/v1/patient/tasks` until the next generated due task. Added `test_submit_test_marks_matching_pending_task_done` to cover the behavior.

Checks:
- `uv run pytest tests/test_scales.py` — PASS (7 passed, 1 existing SQLAlchemy model collection warning)
- `uv run ruff check app/modules/scales/dependencies.py app/modules/scales/service.py app/modules/tasks/repository.py tests/test_scales.py` — PASS
- `cd frontend && pnpm typecheck` — PASS
