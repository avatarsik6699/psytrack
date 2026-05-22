# PHASE 07 — Charts & Doctor Detail

<!-- TOKEN BUDGET: keep this file under 10,000 tokens. Be concise. -->

## Phase Metadata

| Field | Value |
|-------|-------|
| Phase | `07` |
| Title | Charts & Doctor Detail |
| Status | `⏳ pending` |
| Tag | `v0.07.0` |
| Depends on | PHASE_06 gate passing |

---

## Phase Goal

Phase 07 delivers the visual analytics layer of the doctor experience. It completes the `/doctor/patients/:id` detail page with three Recharts charts (scores, medications, side effects), an `AssessmentResultsTable`, and a `TherapyGoals` sidebar panel. It also extends the patient roster cards with adherence and latest-score data first seen in the design references. After this phase the doctor has a complete single-screen view of therapy dynamics without navigating away.

---

## Design References

1. **Patient Roster — Card view** — Grid of `PatientCard`s: colored-initials avatar, status badge (Urgent/Monitoring/Stable), PHQ-9/GAD-7 score+severity pills (e.g. "22 — Severe"), adherence progress bar with %, medication chips; urgent alert banner; search bar; filter tabs (All / Urgent / Monitoring); list/grid toggle.
2. **Patient Roster — List view** — Table layout with columns PATIENT · LAST VISIT · PHQ-9 · GAD-7 · ADHERENCE (color bar) · STATUS; same filter tabs and toggle.
3. **Patient Detail — Score Trends** — Full page: `PatientHeader` (avatar, name, age/gender/diagnosis, severity badge pills for each scale, adherence %, card-color status chip, active medication chips, "Edit Medication" outline + "Assign Test" teal buttons in TopBar); `DiagnosisTabSwitcher` (one tab per diagnosis); main `ScoreChart` (dual-line Recharts: PHQ-9 teal `#0D9E7E`, GAD-7 purple `#5B5BD6`, dot markers, weekly x-axis labels "Feb W1"…, delta chip top-right "PHQ-9 ↓1"); `AssessmentResultsTable` below chart (DATE / TEST / SCORE / INTERPRETATION / Δ). Right sidebar: `NextAppointmentCard` (date + Reschedule button), `TherapyGoals` (checkbox list, teal progress bar, "X/Y complete" label), Reported Side Effects summary (SE name, date, severity badge), Clinical Summary (current score vs last).
4. **Notifications overlay** — Bell dropdown: urgent patient list with △ icons, timestamp. *(Phase 09 scope — documented for future reference only.)*

---

## Scope

### Data
- [x] `D1` TherapyGoal ORM model (`app/modules/therapy_goals/models.py`) + Alembic migration `0009_therapy_goals` — _Depends on:_ —

### Backend
- [x] `B1` Score chart endpoint — `GET /api/v1/doctor/patients/{id}/charts/scores` → `ScoreChartSeries[]` (one series per assigned scale; includes `scoreMin`, `scoreMax`, `improvementDirection`) — _Depends on:_ —
- [x] `B2` Therapy goals CRUD — `GET /doctor/patients/{id}/goals`, `POST /doctor/patients/{id}/goals`, `PATCH /doctor/patients/{id}/goals/{gid}` — _Depends on:_ `D1`
- [x] `B3` Extend `PatientOut` with computed roster-card fields: `adherence_percent: float | null` (30-day window from `event_log`), `latest_scores: list[ScoreSnapshot]` (latest score per active scale), `active_medications_summary: list[MedSummary]` (active `patient_medications` rows) — _Depends on:_ —

### Frontend
- [x] `F1` `PatientHeader` component — avatar (colored initials), name, age/gender/diagnosis line, PHQ-9/GAD-7 severity badge pills, adherence %, card-color status chip, active medication chips; "Edit Medication" + "Assign Test" action buttons wired to TopBar — _Depends on:_ `B3`
- [x] `F2` `DiagnosisTabSwitcher` — tab strip rendering one tab per patient diagnosis; active tab drives chart context — _Depends on:_ —
- [x] `F3` `ScoreChart` — Recharts `LineChart`; multi-series (PHQ-9 teal, GAD-7 purple, YMRS amber); dot markers; weekly-formatted x-axis; delta legend chip; + `AssessmentResultsTable` below (DATE / TEST / SCORE / INTERPRETATION severity badge / Δ arrow+number) — _Depends on:_ `B1`
- [x] `F4` `MedicationChart` — Recharts `LineChart`; dose series per INN over time; uses Phase 04 endpoint `GET /charts/medications` — _Depends on:_ —
- [x] `F5` `SEChart` — Recharts chart; SE severity over time per UKU code; uses Phase 05 endpoint `GET /charts/side-effects` — _Depends on:_ —
- [x] `F6` `TherapyGoals` component — checkbox list; teal progress bar; "X/Y complete" label; PATCH on checkbox toggle — _Depends on:_ `B2`
- [x] `F7` Full `/doctor/patients/:id` detail page — composes `PatientHeader`, `DiagnosisTabSwitcher`, `ScoreChart`, `MedicationChart`, `SEChart`, `EventTimeline` (Phase 06), `TherapyGoals`, right-sidebar panels (`NextAppointmentCard` stub — no appointments table yet, `SEChart` summary, `ClinicalSummary`); `AssignTestModal` (calls Phase 03 `POST /scales` endpoint) — _Depends on:_ `F1`, `F2`, `F3`, `F4`, `F5`, `F6`
- [x] `F8` `PatientCard` roster enhancements — PHQ-9/GAD-7 score+severity pills, adherence color progress bar, active medication chips; list-view table toggle (list/grid) — _Depends on:_ `B3`

### Frontend Tests
- [x] `FT1` `frontend/tests/e2e/phase-07-smoke.spec.ts` — e2e smoke covering `/doctor/patients/:id` critical path: page loads, ScoreChart renders, TherapyGoals toggles, AssignTestModal opens; minimum one `test()` per new route — _Depends on:_ `F7`
- [x] `FT2` Unit tests for score utilities: severity-label mapping (score → "Minimal/Mild/Moderate/Mod. Severe/Severe"), delta computation (score change between consecutive points), week-label formatter — _Depends on:_ `F3`

---

## Files

### Create / modify
~~~
# Backend — new
app/modules/therapy_goals/__init__.py
app/modules/therapy_goals/models.py
app/modules/therapy_goals/schemas.py
app/modules/therapy_goals/service.py
app/modules/therapy_goals/router.py
app/modules/scales/charts.py          # score chart service + router
alembic/versions/0009_therapy_goals.py

# Backend — modify
app/modules/patients/schemas.py       # add adherence_percent, latest_scores, active_medications_summary to PatientOut
app/modules/patients/service.py       # compute B3 fields in get_patients / get_patient
app/main.py                           # register therapy_goals router

# Frontend — new
frontend/app/routes/doctor.patients.$id.tsx
frontend/app/components/doctor/PatientHeader.tsx
frontend/app/components/doctor/DiagnosisTabSwitcher.tsx
frontend/app/components/doctor/TherapyGoals.tsx
frontend/app/components/doctor/AssignTestModal.tsx
frontend/app/components/charts/ScoreChart.tsx
frontend/app/components/charts/MedicationChart.tsx
frontend/app/components/charts/SEChart.tsx
frontend/app/components/charts/AssessmentResultsTable.tsx
frontend/tests/e2e/phase-07-smoke.spec.ts

# Frontend — modify
frontend/app/components/doctor/PatientCard.tsx   # F8 enhancements
frontend/app/schema.ts                            # regenerate after backend changes (pnpm generate:api)
~~~

### Do NOT touch
- Any existing Alembic migration files (never modify; only add new)
- `app/modules/events/models.py` (append-only model; write new rows only)
- `app/modules/side_effects/`, `app/modules/medications/` (endpoints already live; modify only if B3 requires importing helpers)
- `docs/SPEC.md`, `docs/CONTEXT.md`
- Any Phase 01–06 route files not listed above

---

## Contracts

> This section is the source of truth for `/context-update`. Fill it in **before** handing to AI.

### New persistent data (tables / collections / files)

```sql
therapy_goals(
  id          UUID PRIMARY KEY,
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_completed BOOL NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL
)
```

### New API endpoints / RPC methods / events

| Method | Path | Auth | Response / Payload |
|--------|------|------|---------------------|
| `GET` | `/api/v1/doctor/patients/{id}/charts/scores` | doctor JWT | `ScoreChartSeries[]` |
| `GET` | `/api/v1/doctor/patients/{id}/goals` | doctor JWT | `TherapyGoalOut[]` |
| `POST` | `/api/v1/doctor/patients/{id}/goals` | doctor JWT | `TherapyGoalOut` |
| `PATCH` | `/api/v1/doctor/patients/{id}/goals/{gid}` | doctor JWT | `TherapyGoalOut` |

### New types / models / shared interfaces

```typescript
// Therapy goals
interface TherapyGoalOut {
  id: string;
  patientId: string;
  description: string;
  isCompleted: boolean;
  createdAt: string;
}

// Score chart
interface ScoreChartPoint {
  completedAt: string;  // ISO datetime
  score: number;
  baseline: boolean;
}
interface ScoreChartSeries {
  scaleId: string;
  scaleCode: string;          // "PHQ-9" | "GAD-7" | "YMRS"
  scaleName: string;
  scoreMin: number;
  scoreMax: number;
  improvementDirection: "lower" | "higher";
  points: ScoreChartPoint[];
}

// PatientOut extensions (B3)
interface ScoreSnapshot {
  scaleCode: string;
  scaleName: string;
  score: number;
  severityLabel: string;      // "Minimal" | "Mild" | "Moderate" | "Mod. Severe" | "Severe"
}
interface MedSummary {
  inn: string;
  doseMg: number;
  unit: string;
  frequency: string;
}
// PatientOut gains:
//   adherencePercent: number | null   (30-day window)
//   latestScores: ScoreSnapshot[]
//   activeMedicationsSummary: MedSummary[]
```

### New env vars

None

---

## Gate Checks

> **Before running gate:** confirm all Scope checkboxes are checked (or explicitly deferred in
> Architect Review Notes). Unchecked items appear in the gate report as a warning, not a hard block.

Run `/phase-gate 07` before committing.

`/phase-gate` returns full PASS only when:
- Automated checks are green
- All architect review items below are resolved (checked off)

Use the commands in [docs/STACK.md](./STACK.md#gate-commands) as the source of truth for:
- infrastructure / bootstrap
- migrations (if applicable)
- backend / unit tests
- frontend prep, type-check, unit tests (if a frontend exists)
- e2e (if an e2e suite exists)
- the default smoke check

**Frontend test coverage check (hard requirement):** before the gate can pass, confirm one of the following:
- `FT1` checkbox is checked — `frontend/tests/e2e/phase-07-smoke.spec.ts` exists and all its tests are green in `pnpm test:e2e`; OR
- `FT1` is explicitly deferred in Architect Review Notes with a written justification (e.g. "phase adds no new routes or UI interactions").

```bash
# Phase 07 score chart smoke check
# Replace {patient_id} and {token} with seeded values
curl -s http://localhost:8000/api/v1/doctor/patients/{patient_id}/charts/scores \
  -H "Authorization: Bearer {token}"
# expected: JSON array; each element has scaleCode, scaleName, points array
```

---

## Architect Review Notes

Use this section after manual verification. Add one checkbox item per issue the architect wants
fixed before the phase can close. Leave the item unchecked while it is still open. Check it off
only after the fix is implemented and re-verified.
If manual verification found nothing, keep the default checked line below.

- [x] No architect review issues recorded

---

## Atomic Commit Message

```
feat(phase-07): charts & doctor detail — score endpoint, therapy goals
```

---

## Post-Phase Checklist

- [ ] All Scope checkboxes checked (or deferred in Architect Review Notes)
- [x] `FT1` checked — `frontend/tests/e2e/phase-07-smoke.spec.ts` exists, or deferral documented in Architect Review Notes
- [ ] `docs/PHASE_07_NOTES.md` complete — Implementation Plans filled, key decisions recorded
- [ ] All automated gate checks green
- [ ] All architect review notes resolved
- [ ] `docs/CONTEXT.md` updated — run `/context-update 07`
- [ ] `docs/STATE.md` phase row updated to `✅ done`
- [ ] `docs/CHANGELOG.md` entry added (if contracts changed)
- [ ] Committed atomically on `feat/phase-07` branch
- [ ] Tag created after merge to develop: `git tag -a v0.07.0 -m "Phase 07: Charts & Doctor Detail"`
