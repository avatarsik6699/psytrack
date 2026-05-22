# PHASE 07 — Implementation Notes

<!--
  WHAT to build → docs/PHASE_07.md  (contracts, scope checklist)
  HOW it was built → this file       (plans, decisions, rationale)

  Ownership rules:
  - ### Exploration          — written by agent (/phase-explore). Optional; skip for simple tasks.
  - ### Implementation Plan  — written by agent (/impl-brief). Agent may update only this section.
  - ### Decisions & Notes    — written by human. NEVER overwritten by agent.

  Sync rule: task IDs (D1, B1, F1 …) must match the Scope checklist in PHASE_07.md.
  To add an unplanned task discovered mid-phase, run /phase-add-task 07 "description" — it
  assigns the next ID, derives contracts, and generates explore + impl-brief automatically.
  To mark a removed task: prefix its heading with ~~, e.g. ## ~~B3~~ (removed). Do not delete.
-->

_Phase:_ `07` · _Generated:_ `2026-05-18`

---

## [D1] — TherapyGoal ORM model + Alembic migration 0009_therapy_goals
**Depends on:** —

### Exploration
<!-- Optional. Run `/phase-explore 07 D1` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 07 D1` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B1] — Score chart endpoint GET /doctor/patients/{id}/charts/scores
**Depends on:** —

### Exploration
<!-- Optional. Run `/phase-explore 07 B1` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 07 B1` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B2] — Therapy goals CRUD GET/POST/PATCH /doctor/patients/{id}/goals
**Depends on:** D1

### Exploration
<!-- Optional. Run `/phase-explore 07 B2` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 07 B2` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B3] — Extend PatientOut with adherence_percent, latest_scores, active_medications_summary
**Depends on:** —

### Exploration
<!-- Optional. Run `/phase-explore 07 B3` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 07 B3` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [F1] — PatientHeader component
**Depends on:** B3

### Exploration
<!-- Optional. Run `/phase-explore 07 F1` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 07 F1` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [F2] — DiagnosisTabSwitcher component
**Depends on:** —

### Exploration
<!-- Optional. Run `/phase-explore 07 F2` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 07 F2` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [F3] — ScoreChart component (+ AssessmentResultsTable)
**Depends on:** B1

### Exploration
<!-- Optional. Run `/phase-explore 07 F3` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 07 F3` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [F4] — MedicationChart component
**Depends on:** —

### Exploration
<!-- Optional. Run `/phase-explore 07 F4` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 07 F4` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [F5] — SEChart component
**Depends on:** —

### Exploration
<!-- Optional. Run `/phase-explore 07 F5` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 07 F5` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [F6] — TherapyGoals component
**Depends on:** B2

### Exploration
<!-- Optional. Run `/phase-explore 07 F6` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 07 F6` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [F7] — Full /doctor/patients/:id detail page
**Depends on:** F1, F2, F3, F4, F5, F6

### Exploration
<!-- Optional. Run `/phase-explore 07 F7` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 07 F7` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [F8] — PatientCard roster enhancements
**Depends on:** B3

### Exploration
<!-- Optional. Run `/phase-explore 07 F8` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 07 F8` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [FT1] — frontend/tests/e2e/phase-07-smoke.spec.ts
**Depends on:** F7

### Exploration
<!-- Optional. Run `/phase-explore 07 FT1` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 07 FT1` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [FT2] — Unit tests for score utilities (severity label, delta, week-label formatter)
**Depends on:** F3

### Exploration
<!-- Optional. Run `/phase-explore 07 FT2` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 07 FT2` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->
