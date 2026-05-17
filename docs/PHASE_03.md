# PHASE 03 — Scale & Assessment Engine

<!-- TOKEN BUDGET: keep this file under 10,000 tokens. Be concise. -->

## Phase Metadata

| Field | Value |
|-------|-------|
| Phase | `03` |
| Title | Scale & Assessment Engine |
| Status | `⏳ pending` |
| Tag | `v0.03.0` |
| Depends on | PHASE_02 gate passing |

---

## Phase Goal

Enable doctors to assign psychiatric scales (PHQ-9, GAD-7, YMRS) to patients with a configurable
repeat frequency. Enable patients to complete assigned assessments through a step-by-step wizard UI.
Scored `test_completions` are persisted and a `test_completed` event is emitted for the timeline.
Test history is surfaced via `GET /patient/history`. See SPEC.md §8 Phase 03.

---

## Scope

<!-- Group tasks by area (Backend / Frontend / Infra / Data, etc.).
     ID scheme: B=Backend · F=Frontend · I=Infra · D=Data · T=other (ungrouped)
     Each item: `ID` description — _Depends on:_ ID, ID or —
     IDs are stable after assignment — never renumber. Mark removed tasks as ~~BN~~ (removed). -->

### Data
- [x] `D1` Alembic migration `0004_scales_patient_scales` — creates `scales` (+ `questions_json JSONB`), `clinical_rules`, `patient_scales`, `test_completions` tables — _Depends on:_ —
- [x] `D2` Seeder script `app/seeders/scales.py` — inserts PHQ-9 (9 Qs), GAD-7 (7 Qs), YMRS (11 items) rows with all questions and `clinical_rules` rows — _Depends on:_ `D1`
- [x] `D3` Alembic migration `0005_event_log` — creates minimal `event_log` table (append-only; no UPDATE/DELETE) needed for `test_completed` event emission in B4 — _Depends on:_ `D1`

### Backend
- [x] `B1` SQLAlchemy models `Scale`, `ClinicalRule`, `PatientScale`, `TestCompletion` in `app/modules/scales/models.py`; `EventLog` model in `app/modules/events/models.py` — _Depends on:_ `D1`, `D3`
- [x] `B2` Reference endpoints `GET /ref/scales` and `GET /ref/scales/{id}/questions`; register in router — _Depends on:_ `B1`
- [x] `B3` Doctor endpoints `POST /doctor/patients/{id}/scales` and `DELETE /doctor/patients/{id}/scales/{sid}`; register in router — _Depends on:_ `B1`
- [x] `B4` Patient endpoint `POST /patient/tests/{patient_scale_id}/submit` — derives score from `answers_json`, persists `test_completions`, emits `test_completed` event to `event_log` — _Depends on:_ `B1`
- [x] `B5` Patient endpoint `GET /patient/history` — paginated list of `test_completions` for the authenticated patient — _Depends on:_ `B4`
- [x] `B6` Patient endpoint `GET /patient/scales/{patient_scale_id}` — returns `PatientScaleOut` (with embedded `ScaleOut`) for the authenticated patient; used by F3 wizard to resolve `scale_id` and fetch questions — _Depends on:_ `B1`
- [x] `B7` Doctor endpoint `GET /doctor/patients/{id}/scales` — list all `PatientScale` rows for a patient (with embedded `ScaleOut`); required by F5 to show the doctor the assigned scales list — _Depends on:_ `B1`, `B3`; **delete guard:** `DELETE` blocked with 409 if `test_completions` exist for that `patient_scale_id` — prevents accidental cascade-deletion of clinical history
- [x] `B8` Patient endpoint `GET /patient/scales` — list all assigned scales for the authenticated patient (with embedded `ScaleOut`); used by F6 home page to show pending assessments — _Depends on:_ `B1`, `B6`

### Frontend
- [x] `F1` `frontend/app/shared/api/scales.ts` — API client functions for all Phase 03 endpoints (list scales, get questions, assign scale, delete assignment, submit test, get history, get patient scale by id) — _Depends on:_ `B2`, `B3`, `B4`, `B5`, `B6`
- [x] `F2` `AssignTestModal` component — doctor selects scale + frequency and submits to `POST .../scales`; integrated into `routes/doctor/patients.$id.tsx` — _Depends on:_ `F1`
- [x] `F3` `/assessment/:patientScaleId` route — multi-step wizard (`AssessmentHeader` with purple progress bar, `QuestionCard`, `AnswerOption`, `NavButtons`); fetches questions via `GET /patient/scales/{id}` → `GET /ref/scales/{scale_id}/questions`; submits to `POST /patient/tests/{patient_scale_id}/submit` on finish — _Depends on:_ `F1`, `B6`
- [x] `F4` `/history` route — populate stub with paginated list of `TestCompletionOut` entries using `GET /patient/history` — _Depends on:_ `F1`
- [x] `F5` Doctor patient detail page `patients.$id.tsx` — show list of assigned scales (`usePatientScales`) with "Remove" button per row; deletion blocked by 409 from B7 when completions exist; invalidates query cache on success — _Depends on:_ `B7`, `F1`
- [x] `F6` Patient home page `pages/home/index.tsx` — replace template stub with list of assigned assessments (`useMyAssignedScales`); each row links to `/assessment/:id`; "View history →" nav link — _Depends on:_ `B8`, `F1`

<!-- Test execution is governed by `## Gate Checks` below + docs/STACK.md § Gate Commands.
     Do not duplicate that list here. -->

---

## Files

### Create / modify
~~~
# Migrations
alembic/versions/0004_scales_patient_scales.py   [CREATE]
alembic/versions/0005_event_log.py               [CREATE]

# Backend — scales module
app/modules/scales/__init__.py                    [CREATE]
app/modules/scales/models.py                      [CREATE]
app/modules/scales/schemas.py                     [CREATE]
app/modules/scales/repository.py                  [CREATE]
app/modules/scales/service.py                     [CREATE]
app/modules/scales/api.py                         [CREATE]
app/modules/scales/exceptions.py                  [CREATE]

# Backend — events module (minimal; extended in Phase 06)
app/modules/events/__init__.py                    [CREATE]
app/modules/events/models.py                      [CREATE]

# Seeder
app/seeders/scales.py                             [CREATE]
app/seeders/__init__.py                           [MODIFY — register scales seeder]

# Router wiring
app/api/v1/router.py                              [MODIFY — register scales router for /ref and /doctor and /patient sub-paths]

# Frontend — API client
frontend/app/shared/api/scales.ts                 [CREATE]

# Frontend — components / routes
frontend/app/components/doctor/AssignTestModal.tsx          [CREATE]
frontend/app/routes/assessment.$patientScaleId.tsx          [CREATE]
frontend/app/routes/history.tsx                             [MODIFY — populate with test history]
frontend/app/routes/doctor/patients.$id.tsx                 [MODIFY — integrate AssignTestModal, show patient_scales list with delete]
frontend/app/pages/home/index.tsx                           [MODIFY — replace template stub with assigned assessments list]
frontend/app/routes.ts                                      [MODIFY — add assessment route]
tests/test_scales.py                                        [CREATE — scale CRUD + 409 delete guard tests]
~~~

### Do NOT touch
- `alembic/versions/0001_*`, `0002_*`, `0003_*`
- `app/modules/auth/`, `app/modules/users/`, `app/modules/doctors/`
- `app/modules/patients/`, `app/modules/diagnoses/`, `app/modules/medications/`
- `frontend/app/shared/api/auth.ts`, `patients.ts`, `diagnoses.ts`, `medications.ts`
- `docs/SPEC.md`, `docs/CONTEXT.md`

---

## Contracts

> This section is the source of truth for `/context-update`. Fill it in **before** handing to AI.

### New persistent data (tables / collections / files)

```sql
-- Event log (minimal; append-only — Phase 06 builds full timeline on top of this)
event_log(
  id           UUID PK,
  patient_id   UUID FK patients NOT NULL,
  event_type   TEXT NOT NULL,           -- e.g. 'test_completed'
  payload      JSONB,
  occurred_at  TIMESTAMPTZ NOT NULL,   -- actual time of the clinical event
  created_at   TIMESTAMPTZ NOT NULL,   -- server receipt time
  created_by   UUID FK users
)

-- Configuration / seed tables
scales(
  id                    UUID PK,
  code                  TEXT UNIQUE NOT NULL,   -- 'PHQ9', 'GAD7', 'YMRS'
  name                  TEXT NOT NULL,
  score_min             INT NOT NULL,
  score_max             INT NOT NULL,
  improvement_direction TEXT CHECK(improvement_direction IN ('lower','higher')),
  domains_json          JSONB,                  -- deferred V2
  questions_json        JSONB NOT NULL          -- [{id,text,options:[{value,label}]}]
)

clinical_rules(
  id                      UUID PK,
  diagnosis_icd           TEXT NOT NULL,
  scale_id                UUID FK scales,
  control_point_days      INT NOT NULL,         -- e.g. 42
  response_threshold_pct  INT NOT NULL,         -- e.g. 50
  response_threshold_abs  INT NOT NULL          -- e.g. 5
)

-- Per-patient tables
patient_scales(
  id             UUID PK,
  patient_id     UUID FK patients NOT NULL,
  diagnosis_id   UUID FK diagnoses NOT NULL,
  scale_id       UUID FK scales NOT NULL,
  frequency_days INT NOT NULL,
  assigned_by    UUID FK doctor_profiles NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL
)

test_completions(
  id                UUID PK,
  patient_id        UUID FK patients NOT NULL,
  patient_scale_id  UUID FK patient_scales NOT NULL,
  scale_id          UUID FK scales NOT NULL,
  score             INT NOT NULL,
  answers_json      JSONB NOT NULL,             -- [{question_id, value}]
  baseline          BOOL DEFAULT false,
  completed_at      TIMESTAMPTZ NOT NULL
)
```

> **Spec gap note:** `questions_json` is not in SPEC §3's original `scales` schema but is required
> to serve `GET /ref/scales/{id}/questions`. Added in this migration as a NOT NULL JSONB column.

### New API endpoints / RPC methods / events

| Method | Path | Auth | Response / Payload |
|--------|------|------|--------------------|
| `GET` | `/api/v1/ref/scales` | bearer | `ScaleOut[]` |
| `GET` | `/api/v1/ref/scales/{id}/questions` | bearer | `ScaleQuestion[]` |
| `GET` | `/api/v1/doctor/patients/{id}/scales` | doctor | `PatientScaleOut[]` (with embedded `scale`) |
| `POST` | `/api/v1/doctor/patients/{id}/scales` | doctor | `PatientScaleOut` |
| `DELETE` | `/api/v1/doctor/patients/{id}/scales/{sid}` | doctor | `{"ok": true}` · **409** if completions exist |
| `POST` | `/api/v1/patient/tests/{patient_scale_id}/submit` | patient | `TestCompletionOut` |
| `GET` | `/api/v1/patient/history` | patient | `{"items": TestCompletionOut[], "total": int}` |
| `GET` | `/api/v1/patient/scales` | patient | `PatientScaleOut[]` (with embedded `scale`) |
| `GET` | `/api/v1/patient/scales/{patient_scale_id}` | patient | `PatientScaleOut` (with embedded `scale`) |

**New event type emitted:** `test_completed` (written to `event_log`)

### New types / models / shared interfaces

```typescript
// Scale reference
interface ScaleQuestion {
  id: number;
  text: string;
  options: { value: number; label: string }[];
}

interface ScaleOut {
  id: string;
  code: string;
  name: string;
  scoreMin: number;
  scoreMax: number;
  improvementDirection: 'lower' | 'higher';
}

// Doctor-assigned scale
interface PatientScaleOut {
  id: string;
  patientId: string;
  diagnosisId: string;
  scaleId: string;
  frequencyDays: number;
  assignedBy: string;
  createdAt: string;
  scale?: ScaleOut;
}

// Submission input
interface TestSubmitIn {
  answers: { questionId: number; value: number }[];
  baseline?: boolean;
}

// Stored result
interface TestCompletionOut {
  id: string;
  patientId: string;
  patientScaleId: string;
  scaleId: string;
  score: number;
  baseline: boolean;
  completedAt: string;
  scale?: ScaleOut;
}
```

### New env vars

None

---

## Gate Checks

> **Before running gate:** confirm all Scope checkboxes are checked (or explicitly deferred in
> Architect Review Notes). Unchecked items appear in the gate report as a warning, not a hard block.

Run `/phase-gate 03` before committing.

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
# Phase 03 smoke check — list seeded reference scales (requires valid bearer token)
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/public/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@example.com","password":"changeme"}' | jq -r '.access_token')

curl -s http://localhost:8000/api/v1/ref/scales \
  -H "Authorization: Bearer $TOKEN" | jq .

# expected: array with 3 items; codes PHQ9, GAD7, YMRS; non-empty questions_json per scale
```

---

## Architect Review Notes

- [x] No architect review issues recorded

---

## Atomic Commit Message

```
feat(phase-03): scale assessment engine — seeds, patient_scales, submit
```

---

## Post-Phase Checklist

- [ ] All Scope checkboxes checked (or deferred in Architect Review Notes)
- [ ] `docs/PHASE_03_NOTES.md` complete — Implementation Plans filled, key decisions recorded
- [ ] All automated gate checks green
- [ ] All architect review notes resolved
- [ ] `docs/CONTEXT.md` updated — run `/context-update 03`
- [ ] `docs/STATE.md` phase row updated to `✅ done`
- [ ] `docs/CHANGELOG.md` entry added (if contracts changed)
- [ ] Committed atomically on `feat/phase-03` branch
- [ ] Tag created after merge to develop: `git tag -a v0.03.0 -m "Phase 03: Scale & Assessment Engine"`
