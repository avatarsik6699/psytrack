# PHASE 04 — Implementation Notes

<!--
  WHAT to build → docs/PHASE_04.md  (contracts, scope checklist)
  HOW it was built → this file       (plans, decisions, rationale)

  Ownership rules:
  - ### Exploration          — written by agent (/phase-explore). Optional; skip for simple tasks.
  - ### Implementation Plan  — written by agent (/impl-brief). Agent may update only this section.
  - ### Decisions & Notes    — written by human. NEVER overwritten by agent.

  Sync rule: task IDs (B1, F1, I1 …) must match the Scope checklist in PHASE_04.md.
  To add an unplanned task discovered mid-phase, run /phase-add-task 04 "description" — it
  assigns the next ID, derives contracts, and generates explore + impl-brief automatically.
  To mark a removed task: prefix its heading with ~~, e.g. ## ~~B3~~ (removed). Do not delete.
-->

_Phase:_ `04` · _Generated:_ `2026-05-17`

---

## [B1] — GET /patient/medications — patient's own current medication list
**Depends on:** —

### Exploration
<!-- Optional. Run `/phase-explore 04 B1` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 04 B1` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B2] — PATCH /patient/medications/{id}/log — log dose taken/missed + event_log entry
**Depends on:** B1

### Exploration
<!-- Optional. Run `/phase-explore 04 B2` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 04 B2` to generate. -->

### Decisions & Notes

---

## [B3] — POST /patient/medications — patient adds own medication, emits drug_started
**Depends on:** B1

### Exploration
<!-- Optional. Run `/phase-explore 04 B3` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 04 B3` to generate. -->

### Decisions & Notes

---

## [B4] — PATCH /patient/medications/{id} — patient edits dose/dates, emits dose_changed
**Depends on:** B1

### Exploration
<!-- Optional. Run `/phase-explore 04 B4` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 04 B4` to generate. -->

### Decisions & Notes

---

## [B5] — DELETE /patient/medications/{id} — patient stops medication, soft-delete, drug_stopped
**Depends on:** B1

### Exploration
<!-- Optional. Run `/phase-explore 04 B5` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 04 B5` to generate. -->

### Decisions & Notes

---

## [B6] — GET /doctor/patients/{id}/charts/medications — dose series per INN
**Depends on:** —

### Exploration
<!-- Optional. Run `/phase-explore 04 B6` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 04 B6` to generate. -->

### Decisions & Notes

---

## [B7] — events/repository.py emit() helper
**Depends on:** —

### Exploration
<!-- Optional. Run `/phase-explore 04 B7` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 04 B7` to generate. -->

### Decisions & Notes

---

## [B8] — events/schemas.py — EventLogOut Pydantic schema
**Depends on:** —

### Exploration

### Implementation Plan
<!-- Run `/impl-brief 04 B8` to generate. -->

### Decisions & Notes

---

## [B9] — tests/test_medication_tracking.py
**Depends on:** B1, B2, B3, B4, B5, B6

### Exploration

### Implementation Plan
<!-- Run `/impl-brief 04 B9` to generate. -->

### Decisions & Notes

---

## [F1] — frontend/app/shared/api/medications.ts — patient + chart API client functions
**Depends on:** B1, B2, B3, B4, B5, B6

### Exploration

### Implementation Plan
<!-- Run `/impl-brief 04 F1` to generate. -->

### Decisions & Notes

---

## [F2] — Patient medication section in home page (list + log taken/missed)
**Depends on:** F1

### Exploration

### Implementation Plan
<!-- Run `/impl-brief 04 F2` to generate. -->

### Decisions & Notes

---

## [F3] — MedicationChart component (Recharts LineChart, dose per INN) + doctor patient detail integration
**Depends on:** F1

### Exploration

### Implementation Plan
<!-- Run `/impl-brief 04 F3` to generate. -->

### Decisions & Notes
