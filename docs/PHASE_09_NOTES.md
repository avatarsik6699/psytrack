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
