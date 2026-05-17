# PHASE 02 — Patient Management

<!-- TOKEN BUDGET: keep this file under 10,000 tokens. Be concise. -->

## Phase Metadata

| Field | Value |
|-------|-------|
| Phase | `02` |
| Title | Patient Management |
| Status | `⏳ pending` |
| Tag | `v0.02.0` |
| Depends on | PHASE_01 gate passing |

---

## Phase Goal

Deliver full patient CRUD for doctors: create patients with auto-generated temp credentials, list the roster, view and edit patient profiles, add diagnoses, and assign medications. Color logic is deferred to Phase 06. The doctor patient roster (`/doctor`) and a basic patient detail view (`/doctor/patients/:id`) are delivered as working frontend routes.

See [SPEC.md §4.2](./SPEC.md#42-doctor--patient-management), [§4.3 (diagnoses + medications)](./SPEC.md#43-doctor--clinical-configuration), [§4.6 (ref/medications)](./SPEC.md#46-reference-data), [§5.1 (doctor views)](./SPEC.md#51-pages).

---

## Scope

<!-- Group tasks by area (Backend / Frontend / Infra / Data, etc.).
     ID scheme: B=Backend · F=Frontend · I=Infra · D=Data · T=other (ungrouped)
     Each item: `ID` description — _Depends on:_ ID, ID or —
     IDs are stable after assignment — never renumber. Mark removed tasks as ~~BN~~ (removed). -->

### Data

- [x] `D1` ORM models — `Diagnosis` (`app/modules/diagnoses/models.py`), `MedicationReference` + `PatientMedication` (`app/modules/medications/models.py`); columns verbatim from SPEC §3 — _Depends on:_ —
- [x] `D2` Alembic migration `0003_diagnoses_medications.py` — auto-generate from `D1` models, review, commit file — _Depends on:_ `D1`

### Backend

- [x] `B1` Patient CRUD module — `app/modules/patients/api.py`: `GET /doctor/patients`, `POST /doctor/patients` (temp credential generation), `GET /doctor/patients/{id}`, `PATCH /doctor/patients/{id}`, `POST /doctor/patients/{id}/archive`; `app/modules/patients/schemas.py`: `PatientCreate`, `PatientOut`, `PatientCreatedOut` — _Depends on:_ `D1`
- [x] `B2` Patient repository — `app/modules/patients/repository.py`: all queries scoped to `doctor_id`; `app/modules/patients/service.py`: temp login/password generation (random 8-char alphanumeric; hashed for storage, plaintext returned once) — _Depends on:_ `D1`
- [x] `B3` Diagnoses module — `app/modules/diagnoses/api.py`: `POST /doctor/patients/{id}/diagnoses`, `PATCH /doctor/patients/{id}/diagnoses/{did}`; schemas, service, repository — _Depends on:_ `D1`, `B1`
- [x] `B4` Medications reference module — `app/modules/medications/api.py`: `GET /ref/medications` (searchable by INN/brand name, paginated); seed script or fixture data with ≥ 5 common psychiatric medications — _Depends on:_ `D1`
- [x] `B5` Doctor medication assignment — endpoints `POST /doctor/patients/{id}/medications`, `PATCH /doctor/patients/{id}/medications/{mid}`; schemas `PatientMedicationCreate`, `PatientMedicationOut`; service + repository — _Depends on:_ `D1`, `B4`
- [x] `B6` Wire new routers — `app/api/v1/router.py`: include doctor patients, diagnoses, medications, ref routers; update `alembic/env.py` imports — _Depends on:_ `B1`, `B3`, `B4`, `B5`
- [x] `B7` Backend tests — `tests/test_patient_management.py` (CRUD, archive, 403 on other-doctor patient), `tests/test_diagnoses.py`, `tests/test_medications.py` — _Depends on:_ `B1`, `B2`, `B3`, `B5`

### Frontend

- [x] `F1` Patient roster page — `frontend/app/routes/doctor/index.tsx`: fetches patient list, renders `PatientCard` grid (color indicator placeholder: gray for all until Phase 06), `SortControls` (sort by name / created_at) — _Depends on:_ `B1`
- [x] `F2` Add patient modal — `frontend/app/components/doctor/AddPatientModal.tsx`: form (full name, birth date, gender), calls `POST /doctor/patients`, displays `temp_login` + `temp_password` in a copy-to-clipboard panel after creation — _Depends on:_ `B1`
- [x] `F3` Patient detail shell — `frontend/app/routes/doctor/patients.$id.tsx` + `frontend/app/components/doctor/PatientHeader.tsx`: name, birth date, gender, email fields; edit mode toggle; Archive button with confirmation — _Depends on:_ `B1`, `B2`
- [x] `F4` Diagnoses section — `frontend/app/components/doctor/DiagnosisList.tsx` + `DiagnosisForm.tsx`: add diagnosis (ICD code + name + is_primary toggle + date + notes); inline edit; rendered inside patient detail page — _Depends on:_ `B3`, `F3`
- [x] `F5` Medication assignment section — `frontend/app/components/doctor/MedicationAssignForm.tsx`: typeahead search of `ref/medications` (by INN/brand), select medication, set dose/unit/frequency/dates; rendered inside patient detail page — _Depends on:_ `B4`, `B5`, `F3`
- [x] `F6` API service layer — `frontend/app/shared/api/patients.ts`, `diagnoses.ts`, `medications.ts`: typed wrappers around fetch for all new endpoints — _Depends on:_ `B1`, `B3`, `B4`, `B5`

<!-- Test execution is governed by `## Gate Checks` below + docs/STACK.md § Gate Commands.
     Do not duplicate that list here. -->

---

## Files

### Create / modify
```
# Backend — new
app/modules/diagnoses/__init__.py
app/modules/diagnoses/models.py
app/modules/diagnoses/schemas.py
app/modules/diagnoses/repository.py
app/modules/diagnoses/service.py
app/modules/medications/__init__.py
app/modules/medications/models.py           (MedicationReference + PatientMedication)
app/modules/medications/schemas.py
app/modules/medications/repository.py
app/modules/medications/service.py
alembic/versions/0003_diagnoses_medications.py
tests/test_patient_management.py
tests/test_diagnoses.py
tests/test_medications.py

# Backend — modify
app/modules/patients/api.py                 modify  (add CRUD + archive endpoints)
app/modules/patients/schemas.py             modify  (add PatientCreate, PatientOut, PatientCreatedOut)
app/modules/patients/service.py             modify  (add temp credential generation)
app/modules/patients/repository.py         modify  (add list/get/update/archive queries)
app/api/v1/router.py                        modify  (include new routers)
alembic/env.py                              modify  (add diagnoses + medications module imports)

# Frontend — new
frontend/app/routes/doctor/index.tsx
frontend/app/routes/doctor/patients.$id.tsx
frontend/app/components/doctor/PatientCard.tsx
frontend/app/components/doctor/AddPatientModal.tsx
frontend/app/components/doctor/PatientHeader.tsx
frontend/app/components/doctor/DiagnosisList.tsx
frontend/app/components/doctor/DiagnosisForm.tsx
frontend/app/components/doctor/MedicationAssignForm.tsx
frontend/app/shared/services/api/patients.ts
frontend/app/shared/services/api/diagnoses.ts
frontend/app/shared/services/api/medications.ts

# Frontend — modify
frontend/app/routes.ts                      modify  (wire /doctor and /doctor/patients/:id routes)
frontend/app/components/layout/Sidebar.tsx  modify  (add doctor nav links: Patients, Schedule, Settings)
```

### Do NOT touch
- `docs/SPEC.md`, `docs/CONTEXT.md`, `docs/STATE.md`, `docs/CHANGELOG.md`
- Phase 01 auth modules (`app/modules/auth/`, `app/modules/users/`)
- `alembic/versions/0001_*`, `alembic/versions/0002_*`
- Patient-facing routes (Phase 08)
- Color logic for patient card indicator (Phase 06)
- Charts / analytics endpoints (Phase 07)
- Scale / assessment modules (Phase 03)
- Side-effect modules (Phase 05)
- Event log (Phase 06)
- Appointment module (Phase 09)

---

## Contracts

> This section is the source of truth for `/context-update`.

### New persistent data (tables / collections / files)

```sql
diagnoses(id UUID PK, patient_id UUID FK patients,
          icd_code TEXT, name TEXT, is_primary BOOL DEFAULT false,
          date_diagnosed DATE, notes TEXT, created_at TIMESTAMPTZ)

medications_reference(id UUID PK, inn TEXT, brand_names JSONB)

patient_medications(id UUID PK, patient_id UUID FK patients,
                    medication_id UUID FK medications_reference,
                    dose_mg NUMERIC, unit TEXT,
                    frequency TEXT,            -- "once daily", "PRN", …
                    started_at DATE, ended_at DATE,
                    dose_precision TEXT CHECK(dose_precision IN ('exact','approx','range')),
                    created_by_role TEXT,      -- 'doctor' | 'patient'
                    created_at TIMESTAMPTZ)
```

### New API endpoints / RPC methods / events

| Method | Path | Auth | Response / Payload |
|--------|------|------|--------------------|
| `GET` | `/api/v1/doctor/patients` | doctor | `PatientOut[]` (no color; sorted by name) |
| `POST` | `/api/v1/doctor/patients` | doctor | `PatientCreatedOut` (includes plaintext `temp_login`+`temp_password`) |
| `GET` | `/api/v1/doctor/patients/{id}` | doctor | `PatientOut` |
| `PATCH` | `/api/v1/doctor/patients/{id}` | doctor | `PatientOut` |
| `POST` | `/api/v1/doctor/patients/{id}/archive` | doctor | `{"ok": true}` |
| `POST` | `/api/v1/doctor/patients/{id}/diagnoses` | doctor | `DiagnosisOut` |
| `PATCH` | `/api/v1/doctor/patients/{id}/diagnoses/{did}` | doctor | `DiagnosisOut` |
| `POST` | `/api/v1/doctor/patients/{id}/medications` | doctor | `PatientMedicationOut` |
| `PATCH` | `/api/v1/doctor/patients/{id}/medications/{mid}` | doctor | `PatientMedicationOut` |
| `GET` | `/api/v1/ref/medications` | bearer | `MedicationReferenceOut[]` (paginated; query param `?q=`) |

### New types / models / shared interfaces

```typescript
interface PatientCreate {
  fullName: string;
  birthDate?: string | null;   // ISO date "YYYY-MM-DD"
  gender?: string | null;
}

interface PatientOut {
  id: string;
  doctorId: string;
  fullName: string;
  birthDate: string | null;
  gender: string | null;
  email: string | null;
  emailVerified: boolean;
  onboardingComplete: boolean;
  archivedAt: string | null;
  createdAt: string;
}

interface PatientCreatedOut extends PatientOut {
  tempLogin: string;
  tempPassword: string;        // plaintext, returned once on creation only
}

interface DiagnosisOut {
  id: string;
  patientId: string;
  icdCode: string;
  name: string;
  isPrimary: boolean;
  dateDiagnosed: string | null;
  notes: string | null;
  createdAt: string;
}

interface MedicationReferenceOut {
  id: string;
  inn: string;
  brandNames: string[];
}

interface PatientMedicationOut {
  id: string;
  patientId: string;
  medication: MedicationReferenceOut;
  doseMg: number | null;
  unit: string | null;
  frequency: string | null;
  startedAt: string | null;
  endedAt: string | null;
  dosePrecision: 'exact' | 'approx' | 'range';
  createdByRole: 'doctor' | 'patient';
  createdAt: string;
}
```

### New env vars

None

---

## Gate Checks

> **Before running gate:** confirm all Scope checkboxes are checked (or explicitly deferred in
> Architect Review Notes). Unchecked items appear in the gate report as a warning, not a hard block.

Run `/phase-gate 02` before committing.

`/phase-gate` returns full PASS only when:
- Automated checks are green
- All architect review items below are resolved (checked off)

Use the commands in [docs/STACK.md](./STACK.md#gate-commands) as the source of truth for automated checks.

```bash
# Phase 02 smoke checks

# Create a patient (requires doctor JWT from Phase 01 register/login)
curl -s -X POST http://localhost:8000/api/v1/doctor/patients \
  -H "Authorization: Bearer <doctor_token>" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test Patient","birth_date":"1990-01-01","gender":"male"}'
# expected: PatientCreatedOut JSON with temp_login and temp_password fields

# List patients
curl -s http://localhost:8000/api/v1/doctor/patients \
  -H "Authorization: Bearer <doctor_token>"
# expected: JSON array with at least the created patient

# Search medications reference
curl -s "http://localhost:8000/api/v1/ref/medications?q=sertr" \
  -H "Authorization: Bearer <doctor_token>"
# expected: JSON array of MedicationReferenceOut (e.g. sertraline)

# Frontend: http://localhost:3000/doctor renders patient roster without console errors
```

---

## Architect Review Notes

- [x] No architect review issues recorded

---

## Atomic Commit Message

```
feat(phase-02): patient management — CRUD, diagnoses, medication assignment, doctor roster
```

---

## Post-Phase Checklist

- [ ] All Scope checkboxes checked (or deferred in Architect Review Notes)
- [ ] `docs/PHASE_02_NOTES.md` complete — Implementation Plans filled, key decisions recorded
- [ ] All automated gate checks green
- [ ] All architect review notes resolved
- [ ] `docs/CONTEXT.md` updated — run `/context-update 02`
- [ ] `docs/STATE.md` phase row updated to `✅ done`
- [ ] `docs/CHANGELOG.md` entry added (contracts introduced)
- [ ] Committed atomically on `feat/phase-02` branch
- [ ] Tag created after merge to develop: `git tag -a v0.02.0 -m "Phase 02: Patient Management"`
