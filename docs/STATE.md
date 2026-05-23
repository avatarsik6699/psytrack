# STATE: Patient Tracker Development Tracker

> **Status legend**
> `⏳ pending` — not started
> `🔄 in-progress` — implementation in progress (human, agent, or both)
> `✅ done` — gate checks passed, committed, merged
> `⚠️ NEEDS_REVIEW` — spec changed, phase scope may be stale
> `❌ blocked` — cannot proceed, see Blockers section
>
> **Impl By:** `👤 human` · `🤖 agent` · `🤝 hybrid` · `—` (not yet started)

---

## Phase Status

| Phase    | Status     | Tag    | Gate | Impl By | Notes |
|----------|------------|--------|------|---------|-------|
| PHASE_01 | ✅ done    | v0.01.0 | ✅ | 🤝 hybrid | Foundation & Auth |
| PHASE_02 | ✅ done    | v0.02.0 | ✅ | 🤝 hybrid | Patient Management |
| PHASE_03 | ✅ done    | v0.03.0 | ✅ | 🤝 hybrid | Scale & Assessment Engine |
| PHASE_04 | ✅ done    | v0.04.0 | ✅ | 🤝 hybrid | Medication Tracking |
| PHASE_05 | ✅ done    | v0.05.0 | ✅ | 🤝 hybrid | Side Effects |
| PHASE_06 | ✅ done    | v0.06.0 | ✅ | 🤝 hybrid | Event Timeline & Color Logic |
| PHASE_07 | ✅ done    | v0.07.0 | ✅ | 🤝 hybrid | Charts & Doctor Detail |
| PHASE_08 | ✅ done    | v0.08.0 | ✅ | 🤝 hybrid | Patient Portal Polish |
| PHASE_09 | ⚠️ NEEDS_REVIEW | v0.09.0 | ⬜ | — | Scope revised: patient credentials, real history, in-app indicators |

<!-- Add new rows here via /phase-init N -->

---

## Active Blockers

<!-- Format: PHASE_XX [YYYY-MM-DD]: description — who must resolve it -->

PHASE_09 [2026-05-23]: needs architect review after new profile/credential-reset references and generated-demo-artifact cleanup scope were added. Confirm `/doctor/profile`, updated reference mapping, and **К удалению** artifact list before implementation.

---

## Expert Feedback Log

<!-- Capture human reviewer or domain expert feedback here. -->
<!--
### PHASE_XX — [YYYY-MM-DD]
**Reviewer**: [name / role]
**Feedback**: [what they said]
**Action taken**: [what changed as a result]
-->

---

## Rollback Notes

<!-- Document here if a phase was rolled back or a migration reversed. -->
