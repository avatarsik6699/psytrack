# PHASE 05 — Implementation Notes

<!--
  WHAT to build → docs/PHASE_05.md  (contracts, scope checklist)
  HOW it was built → this file        (plans, decisions, rationale)

  Ownership rules:
  - ### Exploration          — written by agent (/phase-explore). Optional; skip for simple tasks.
  - ### Implementation Plan  — written by agent (/impl-brief). Agent may update only this section.
  - ### Decisions & Notes    — written by human. NEVER overwritten by agent.

  Sync rule: task IDs (B1, F1, D1 …) must match the Scope checklist in PHASE_05.md.
  To add an unplanned task discovered mid-phase, run /phase-add-task 05 "description" — it
  assigns the next ID, derives contracts, and generates explore + impl-brief automatically.
  To mark a removed task: prefix its heading with ~~, e.g. ## ~~B3~~ (removed). Do not delete.
-->

_Phase:_ `05` · _Generated:_ `2026-05-17`

---

## [D1] — Alembic migration 0006_side_effects
**Depends on:** —

### Exploration
<!-- Optional. Run `/phase-explore 05 D1` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 05 D1` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [D2] — Seed se_dictionary with UKU catalogue
**Depends on:** D1

### Exploration
<!-- Optional. Run `/phase-explore 05 D2` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 05 D2` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B1] — ORM models: SeDictionary, PatientSideEffect, SeMonitoringRule
**Depends on:** D1

### Exploration
<!-- Optional. Run `/phase-explore 05 B1` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 05 B1` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B2] — Pydantic schemas for SE entities
**Depends on:** B1

### Exploration
<!-- Optional. Run `/phase-explore 05 B2` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 05 B2` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B3] — Reference endpoint GET /ref/se-dictionary
**Depends on:** B2

### Exploration
<!-- Optional. Run `/phase-explore 05 B3` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 05 B3` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B4] — Patient SE endpoints (GET/POST/PATCH/DELETE /patient/side-effects)
**Depends on:** B2

### Exploration
<!-- Optional. Run `/phase-explore 05 B4` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 05 B4` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B5] — Doctor SE rule endpoints (POST/DELETE /doctor/patients/{id}/se-rules)
**Depends on:** B2

### Exploration
<!-- Optional. Run `/phase-explore 05 B5` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 05 B5` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B6] — Doctor SE chart endpoint GET /doctor/patients/{id}/charts/side-effects
**Depends on:** B4

### Exploration
<!-- Optional. Run `/phase-explore 05 B6` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 05 B6` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [F1] — Patient side-effects list + add/edit/delete flow
**Depends on:** B4, B3

### Exploration
<!-- Optional. Run `/phase-explore 05 F1` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 05 F1` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [F2] — SEMonitoringModal (doctor assigns/removes SE rules)
**Depends on:** B5, B3

### Exploration
<!-- Optional. Run `/phase-explore 05 F2` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 05 F2` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [F3] — SEChart component (Recharts, SE severity timeline)
**Depends on:** B6

### Exploration
<!-- Optional. Run `/phase-explore 05 F3` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 05 F3` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->
