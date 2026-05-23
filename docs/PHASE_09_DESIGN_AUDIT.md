# PHASE 09 Design Audit

Captured: 2026-05-23

This audit maps the current MVP frontend to the Phase 09 Docassist design references in
`docs/assets/`. It is the working checklist for removing generated/demo artifacts and closing
route-level UX gaps before the phase gate.

## Route Inventory

| Route | Current implementation | Target reference | Gap / action |
|-------|------------------------|------------------|--------------|
| `/login` | Public route uses a compact shared login form with doctor/patient mode buttons and visible dev credential helper in development. | Derived from Docassist chrome; no screenshot supplied. | Redesign as production auth surface with doctor email/password mode and patient login/password mode only. Keep role switching inside the form, not as app impersonation. Demo helper must stay dev-only and visually separate from production state. |
| `/register` | Closed for MVP by architect decision; route redirects to `/login`. Doctor accounts are created manually during real-world testing. | n/a | No public registration UI or registration link should be exposed in the MVP. |
| `/` | Patient-protected index route exists. | `patient-profile-main-page.png` derived home/dashboard pattern. | Confirm redirect/content behavior after chrome refactor. Avoid duplicate home/dashboard mismatch. |
| `/dashboard` | Patient dashboard route exists from Phase 08. | `patient-profile-main-page.png`. | Align cards, task state, notification placeholder, spacing, and mobile layout with patient reference. |
| `/history` | Route exists and calls `useTestHistory`; UI is a minimal English list. | Derived from patient profile/tests design; no screenshot supplied. | Localize copy, align with patient portal card/table patterns, expose empty/loading/error states, and verify it uses real `GET /patient/history` data. |
| `/profile` | Patient profile has email binding, password form, and a "Push notifications soon" card. | `patient-profile-page.png`. | Replace email-focused MVP language with patient login/password credential controls, preferences, current-session panel, end-session action, identity card, and patient footer/nav badges. Browser/push notification product work remains out of scope; keep placeholder honest. |
| `/tests` | Patient tests route exists from Phase 08. | `patient-profile-tests-page.png`. | Align active/completed/empty states, cards, button hierarchy, and responsive wrapping. |
| `/drugs` | Patient medications route exists from Phase 08. | `patient-profile-drugs-page.png`. | Align medication list/log controls, empty states, spacing, and mobile layout. |
| `/side-effects` | Patient side effects route and wizard exist. | `patient-profile-side-effects-page.png` and `patient-profile-add-side-effect-*.png`. | Align page shell and wizard step layouts; preserve existing real side-effect contracts. |
| `/assessment/:patientScaleId` | Assessment wizard and success screen exist. | `patient-profile-test-steps-form-page.png`, `patient-profile-test-success-page.png`. | Align wizard progress, answer controls, success state, and mobile behavior with references. |
| `/doctor` | Doctor roster route exists with summary badges, filters, search, patient cards, add-patient modal. | `patients-list-page.png`, `patients-list-empty-page.png`, `add-patient-form-*.png`. | Align roster density, empty state, add flow, search/filter controls, and loading/error states. |
| `/doctor/patients/:id` | Doctor detail route exists with overview, medications, dynamics, side effects, and events tabs. | `patient-detail-*-tab-page.png`. | Align tab chrome and panels. Add credential reset action/modal from Phase 09. Confirm all clickable commands are backed by existing contracts. |
| `/doctor/profile` | Not routed. | `doctor-profile-page.png`, `doctor-profile-page-dark.png`. | Add doctor profile route with identity card, language/theme controls, current-session table, access-token panel if backed by session contract, and real authenticated doctor identity. |

## Production Artifacts To Remove

| Artifact | Current location | Required action |
|----------|------------------|-----------------|
| Top-bar role switch links `Врач` / `Пациент` navigating between `/doctor` and `/dashboard`. | `frontend/app/shared/ui/top-bar.tsx` | Remove from authenticated chrome. Authenticated role must come from JWT/backend, not UI impersonation. |
| Out-of-scope `/doctor/settings` navigation. | `frontend/app/shared/ui/sidebar.tsx` | Remove nav item and icon import. Do not add settings/schedule routes in Phase 09. |
| Hardcoded doctor identity `Волков А.Н.` / `Психиатр`. | `frontend/app/shared/ui/sidebar.tsx` | Replace with real authenticated doctor profile data or loading/empty state. |
| Visible demo credential helper and hardcoded seed credentials. | `frontend/app/features/auth/login-form.tsx` | Keep strictly development-only if retained; ensure production builds never show helper or seed values. |
| Patient email/password MVP language. | `frontend/app/routes/profile/index.tsx`, `frontend/app/routes/profile/components/email-bind-form.tsx` | Replace patient profile credential UX with login/password update flow backed by Phase 09 API. |

## Contract Gaps

- `GET /api/v1/public/auth/session` is not implemented in the active endpoint contract yet.
- `PATCH /api/v1/patient/me/credentials` is not implemented yet.
- `POST /api/v1/doctor/patients/{patient_id}/credentials/reset` is not implemented yet.
- Generated frontend OpenAPI types will need regeneration after the backend endpoints and schemas are added.
- Doctor profile data is not currently available in authenticated chrome through a dedicated frontend query.

## Screenshot Gaps For Future Design Input

- `/login` doctor mode, patient mode, validation, loading, and error states.
- Future `/register` form states, if public doctor onboarding is restored after MVP testing.
- `/history` completed-assessment list and empty state.
- Responsive mobile/tablet states for authenticated doctor and patient chrome.
- Keyboard focus and high-contrast states for dialogs, tabs, segmented controls, and wizard steps.

## Derived Design Rules

- Use the supplied patient and doctor profile screenshots as the canonical token, spacing, border,
  typography, and sidebar/footer reference for missing screens.
- Keep operational pages dense and scannable; cards are for repeated items, modals, and framed tools.
- Keep role-aware language/theme controls visible in account/navigation chrome.
- Preserve API-derived TypeScript types from `frontend/app/shared/types/schema.ts`; do not hand-write
  API response shapes or use raw API escape hatches.
