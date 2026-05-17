# PHASE 04 — Medication Tracking

<!-- TOKEN BUDGET: keep this file under 10,000 tokens. Be concise. -->

## Phase Metadata

| Field | Value |
|-------|-------|
| Phase | `04` |
| Title | Medication Tracking |
| Status | `✅ done` |
| Tag | `v0.04.0` |
| Depends on | PHASE_03 gate passing |

---

## Phase Goal

Enable patients to log medication doses (taken/missed) and self-manage their own medications.
Every patient write emits a corresponding `event_log` entry (`dose_taken`, `dose_missed`,
`drug_started`, `dose_changed`, `drug_stopped`) so the doctor sees a full change audit.
The doctor gains a `GET /doctor/patients/{id}/charts/medications` endpoint returning a dose
series per INN, driving the `MedicationChart` Recharts component in the patient detail page.
See SPEC.md §4.5, §4.7, §8 Phase 04.

---

## Scope

<!-- Group tasks by area (Backend / Frontend / Infra / Data, etc.).
     ID scheme: B=Backend · F=Frontend · I=Infra · D=Data · T=other (ungrouped)
     Each item: `ID` description — _Depends on:_ ID, ID or —
     IDs are stable after assignment — never renumber. Mark removed tasks as ~~BN~~ (removed). -->

### Backend
- [x] `B1` `GET /patient/medications` — patient's own current medication list (patient auth); reuses `PatientMedicationOut`; filters by `patient_id` from JWT — _Depends on:_ —
- [x] `B2` `PATCH /patient/medications/{id}/log` — accept `{"status":"taken"|"missed","occurred_at":"<ISO>"}` (patient auth); validate ownership; write `dose_taken` or `dose_missed` event to `event_log`; return `EventLogOut` — _Depends on:_ `B1`
- [x] `B3` `POST /patient/medications` — patient adds new medication (patient auth); sets `created_by_role='patient'`; emits `drug_started` event — _Depends on:_ `B1`
- [x] `B4` `PATCH /patient/medications/{id}` — patient edits dose/dates (patient auth); validates ownership; emits `dose_changed` event — _Depends on:_ `B1`
- [x] `B5` `DELETE /patient/medications/{id}` — patient stops medication (patient auth); soft-delete via `ended_at = now()`; emits `drug_stopped` event; returns `{"ok": true}` — _Depends on:_ `B1`
- [x] `B6` `GET /doctor/patients/{id}/charts/medications` — doctor auth; returns `MedicationChartOut` (dose series per INN from `patient_medications`); one series per active medication — _Depends on:_ —
- [x] `B7` `app/modules/events/repository.py` — add `emit(session, patient_id, event_type, payload, occurred_at, created_by)` helper used by B2–B5 — _Depends on:_ —
- [x] `B8` `app/modules/events/schemas.py` — create `EventLogOut` Pydantic schema — _Depends on:_ —
- [x] `B9` `tests/test_medication_tracking.py` — tests: list patient meds, log dose (taken/missed), patient add/edit/stop, chart endpoint — _Depends on:_ `B1`, `B2`, `B3`, `B4`, `B5`, `B6`

### Frontend
- [x] `F1` `frontend/app/shared/api/medications.ts` — API client functions for all Phase 04 patient-side and chart endpoints (listMyMedications, logDose, addMyMedication, editMyMedication, stopMyMedication, getMedicationChart) — _Depends on:_ `B1`, `B2`, `B3`, `B4`, `B5`, `B6`
- [x] `F2` Patient medication section — integrate medication list + log (taken/missed) actions into patient home page `pages/home/index.tsx`; show INN, dose, frequency per medication; "Taken" / "Missed" buttons per row — _Depends on:_ `F1`
- [x] `F3` `MedicationChart` component — `frontend/app/components/doctor/MedicationChart.tsx`; Recharts `LineChart`; one line per INN; x-axis = date, y-axis = dose_mg; integrated into `routes/doctor/patients.$id.tsx` — _Depends on:_ `F1`

<!-- Test execution is governed by `## Gate Checks` below + docs/STACK.md § Gate Commands.
     Do not duplicate that list here. -->

---

## Files

### Create / modify
~~~
# Backend — events module extension
app/modules/events/schemas.py                          [CREATE]
app/modules/events/repository.py                       [MODIFY — add emit() helper]

# Backend — medications module extension
app/modules/medications/schemas.py                     [MODIFY — add MedicationLogIn, EventLogOut ref, MedicationChartPoint/Series/Out]
app/modules/medications/repository.py                  [MODIFY — add patient-scoped queries, chart data query]
app/modules/medications/service.py                     [MODIFY — add log_dose, add_by_patient, edit_by_patient, stop_by_patient, chart_series]
app/modules/medications/api.py                         [MODIFY — add patient_med_router and doctor_chart_router]

# Router wiring
app/api/v1/router.py                                   [MODIFY — register patient_med_router, doctor_chart_router]

# Tests
tests/test_medication_tracking.py                      [CREATE]

# Frontend — API client
frontend/app/shared/api/medications.ts                 [CREATE]

# Frontend — components / routes
frontend/app/components/doctor/MedicationChart.tsx     [CREATE]
frontend/app/pages/home/index.tsx                      [MODIFY — add patient medication section]
frontend/app/routes/doctor/patients.$id.tsx            [MODIFY — integrate MedicationChart]
frontend/app/shared/types/schema.ts                    [REGENERATE — run pnpm generate:api after backend changes]
~~~

### Do NOT touch
- `alembic/versions/` — no new migrations needed; `patient_medications` (0003) and `event_log` (0005) already exist
- `app/modules/auth/`, `app/modules/users/`, `app/modules/doctors/`
- `app/modules/patients/`, `app/modules/diagnoses/`, `app/modules/scales/`
- `frontend/app/shared/api/auth.ts`, `patients.ts`, `diagnoses.ts`, `scales.ts`
- `docs/SPEC.md`, `docs/CONTEXT.md`

---

## Contracts

> This section is the source of truth for `/context-update`. Fill it in **before** handing to AI.

### New persistent data (tables / collections / files)

None — `patient_medications` was created in Phase 02 (migration `0003`) and `event_log` in
Phase 03 (migration `0005`). This phase first writes the following new event types to `event_log`:
`dose_taken` · `dose_missed` · `drug_started` · `dose_changed` · `drug_stopped`

### New API endpoints / RPC methods / events

| Method | Path | Auth | Response / Payload |
|--------|------|------|--------------------|
| `GET` | `/api/v1/patient/medications` | patient | `PatientMedicationOut[]` |
| `PATCH` | `/api/v1/patient/medications/{id}/log` | patient | `EventLogOut` |
| `POST` | `/api/v1/patient/medications` | patient | `PatientMedicationOut` (emits `drug_started`) |
| `PATCH` | `/api/v1/patient/medications/{id}` | patient | `PatientMedicationOut` (emits `dose_changed`) |
| `DELETE` | `/api/v1/patient/medications/{id}` | patient | `{"ok": true}` (emits `drug_stopped`; soft-delete) |
| `GET` | `/api/v1/doctor/patients/{id}/charts/medications` | doctor | `MedicationChartSeries[]` |

**New event types written to `event_log`:** `dose_taken`, `dose_missed`, `drug_started`, `dose_changed`, `drug_stopped`

### New types / models / shared interfaces

```typescript
// Request body for logging a dose
interface MedicationLogIn {
  status: 'taken' | 'missed';
  occurredAt: string; // ISO 8601 timestamp
}

// Returned by log endpoint and any event-emitting mutation
interface EventLogOut {
  id: string;
  patientId: string;
  eventType: string;
  payload: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
  createdBy: string | null;
}

// Medication chart data — one series per INN
interface MedicationChartPoint {
  date: string;    // ISO date of the dose record
  doseMg: number | null;
}

interface MedicationChartSeries {
  inn: string;
  medicationId: string;
  points: MedicationChartPoint[];
}

type MedicationChartOut = MedicationChartSeries[];
```

### New env vars

None

---

## Gate Checks

> **Before running gate:** confirm all Scope checkboxes are checked (or explicitly deferred in
> Architect Review Notes). Unchecked items appear in the gate report as a warning, not a hard block.

Run `/phase-gate 04` before committing.

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

```bash
# Phase 04 smoke check — patient lists own medications, then logs a dose
PATIENT_TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/public/auth/patient-login \
  -H "Content-Type: application/json" \
  -d '{"temp_login":"patient001","temp_password":"changeme"}' | jq -r '.access_token')

# List patient medications
curl -s http://localhost:8000/api/v1/patient/medications \
  -H "Authorization: Bearer $PATIENT_TOKEN" | jq .
# expected: array (may be empty if no meds assigned); HTTP 200

# Log a dose (requires a valid patient_medication id from the list above)
MED_ID="55290661-6697-4e5c-94a4-daec65404e7f"
curl -s -X PATCH "http://localhost:8000/api/v1/patient/medications/$MED_ID/log" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"taken\",\"occurred_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" | jq .
# expected: EventLogOut with event_type="dose_taken"

# Doctor chart endpoint
DOCTOR_TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/public/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@example.com","password":"changeme"}' | jq -r '.access_token')

PATIENT_ID="e44f5e20-f0f2-4bf9-9946-96ea5a2049b3"
curl -s "http://localhost:8000/api/v1/doctor/patients/$PATIENT_ID/charts/medications" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" | jq .
# expected: array of MedicationChartSeries (one per INN); may be empty
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
feat(phase-04): medication tracking — patient log, patient meds, doctor chart
```

---

## Post-Phase Checklist

- [ ] All Scope checkboxes checked (or deferred in Architect Review Notes)
- [ ] `docs/PHASE_04_NOTES.md` complete — Implementation Plans filled, key decisions recorded
- [ ] All automated gate checks green
- [ ] All architect review notes resolved
- [ ] `docs/CONTEXT.md` updated — run `/context-update 04`
- [ ] `docs/STATE.md` phase row updated to `✅ done`
- [ ] `docs/CHANGELOG.md` entry added (if contracts changed)
- [ ] Committed atomically on `feat/phase-04` branch
- [ ] Tag created after merge to develop: `git tag -a v0.04.0 -m "Phase 04: Medication Tracking"`
