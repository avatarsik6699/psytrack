# PHASE 05 — Side Effects

<!-- TOKEN BUDGET: keep this file under 10,000 tokens. Be concise. -->

## Phase Metadata

| Field | Value |
|-------|-------|
| Phase | `05` |
| Title | Side Effects |
| Status | `⏳ pending` |
| Tag | `v0.05.0` |
| Depends on | PHASE_04 gate passing |

---

## Phase Goal

Deliver the full side-effect (SE) subsystem: a bilingual UKU catalogue seeded into the database, patient-facing SE reporting (add / edit / delete with immutable event trail), doctor-facing SE monitoring-rule management, and an SE severity-timeline chart for the doctor patient-detail page. After this phase the doctor can track all SE events for a patient alongside medication and test-score data.

---

## Scope

<!-- Group tasks by area (Backend / Frontend / Infra / Data, etc.).
     ID scheme: B=Backend · F=Frontend · I=Infra · D=Data · T=other (ungrouped)
     Each item: `ID` description — _Depends on:_ ID, ID or —
     IDs are stable after assignment — never renumber. Mark removed tasks as ~~BN~~ (removed). -->

### Data
- [x] `D1` Alembic migration `0006_side_effects` — create `se_dictionary`, `patient_side_effects`, `se_monitoring_rules` tables — _Depends on:_ —
- [x] `D2` Seed `se_dictionary` with UKU catalogue (bilingual `name_ru` / `name_en`) via `app/seeders/side_effects.py` — _Depends on:_ `D1`

### Backend
- [x] `B1` ORM models — `SeDictionary`, `PatientSideEffect`, `SeMonitoringRule` in `app/modules/side_effects/models.py` — _Depends on:_ `D1`
- [x] `B2` Pydantic schemas in `app/modules/side_effects/schemas.py` — `SeDictionaryOut`, `PatientSideEffectIn`, `PatientSideEffectOut`, `SeMonitoringRuleIn`, `SeMonitoringRuleOut` — _Depends on:_ `B1`
- [x] `B3` Reference endpoint `GET /ref/se-dictionary` — paginated, searchable by `q` (name_ru, name_en, uku_code) and `body_system` filter — _Depends on:_ `B2`
- [x] `B4` Patient SE endpoints (`GET`, `POST`, `PATCH`, `DELETE /patient/side-effects`) — emit `se_reported_start`, `se_severity_updated`, `se_resolved`, `se_correction` events to `event_log`; DELETE is soft-delete — _Depends on:_ `B2`
- [x] `B5` Doctor SE rule endpoints (`POST`, `DELETE /doctor/patients/{id}/se-rules/{rid}`) — emit `monitoring_rule_changed` — _Depends on:_ `B2`
- [x] `B6` Doctor SE chart endpoint `GET /doctor/patients/{id}/charts/side-effects` — returns SE severity time-series — _Depends on:_ `B4`

### Frontend
- [x] `F1` Patient side-effects list + add / edit / delete flow — `SideEffectsList`, `SideEffectForm` components; calls `B4` + `B3` — _Depends on:_ `B4`, `B3`
- [x] `F2` `SEMonitoringModal` — doctor assigns / removes SE monitoring rules — calls `B5`, `B3` — _Depends on:_ `B5`, `B3`
- [x] `F3` `SEChart` component (Recharts, SE severity timeline) wired into doctor patient-detail page — _Depends on:_ `B6`

---

## Files

### Create / modify
~~~
# Migrations & seeds
alembic/versions/0006_side_effects.py        (new)
app/seeders/side_effects.py                  (new)

# Backend module (follows app/modules/{module}/* pattern)
app/modules/side_effects/__init__.py         (new)
app/modules/side_effects/models.py           (new)
app/modules/side_effects/schemas.py          (new)
app/modules/side_effects/repository.py       (new)
app/modules/side_effects/service.py          (new)
app/modules/side_effects/dependencies.py     (new)
app/modules/side_effects/exceptions.py       (new)
app/modules/side_effects/api.py              (new — exports ref_se_router, patient_se_router, doctor_se_router, doctor_se_chart_router)

# Router registration
app/api/v1/router.py                         (modify — import & include 4 new SE routers)

# Frontend components
frontend/app/components/patient/SideEffectsList.tsx   (new)
frontend/app/components/patient/SideEffectForm.tsx    (new)
frontend/app/components/doctor/SEMonitoringModal.tsx  (new)
frontend/app/components/doctor/SEChart.tsx            (new)

# Doctor patient-detail page (wire in SEChart + SEMonitoringModal)
frontend/app/routes/doctor/patients.$id.tsx           (modify)

# Generated API types (run pnpm generate:api after backend is done)
frontend/app/shared/api/schema.ts                     (regenerated)
~~~

### Do NOT touch
- `docs/SPEC.md`, `docs/CONTEXT.md`
- `alembic/versions/0001_*` through `0005_*`
- `app/modules/medications/`, `app/modules/scales/`, `app/modules/events/` (except event emit helper if needed)
- `frontend/app/routes/assessment*`, `frontend/app/routes/history.tsx`

---

## Contracts

> This section is the source of truth for `/context-update`. Fill it in **before** handing to AI.

### New persistent data (tables / collections / files)

```sql
se_dictionary(
  id UUID PK,
  uku_code TEXT UNIQUE NOT NULL,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  body_system TEXT,
  severity_min INT DEFAULT 0,
  severity_max INT DEFAULT 4
)

patient_side_effects(
  id UUID PK,
  patient_id UUID FK patients,
  se_id UUID FK se_dictionary,
  severity INT CHECK(severity BETWEEN 0 AND 4),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  date_precision TEXT CHECK(date_precision IN ('exact','lt_24h','month','year','range')),
  duration_label TEXT,
  resolved BOOL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ
)

se_monitoring_rules(
  id UUID PK,
  patient_id UUID FK patients,
  se_id UUID FK se_dictionary,
  frequency_days INT,
  assigned_by UUID FK doctor_profiles,
  created_at TIMESTAMPTZ
)
```

New event types written to existing `event_log`:
`se_reported_start` · `se_severity_updated` · `se_resolved` · `se_correction` · `monitoring_rule_changed`

### New API endpoints / RPC methods / events

| Method | Path | Auth | Response / Payload |
|--------|------|------|--------------------|
| `GET` | `/api/v1/ref/se-dictionary` | bearer | `{ items: SeDictionaryOut[], total: int }` (`?q=`, `?body_system=`, `?page=`, `?size=`) |
| `GET` | `/api/v1/patient/side-effects` | patient | `PatientSideEffectOut[]` |
| `POST` | `/api/v1/patient/side-effects` | patient | `PatientSideEffectOut` |
| `PATCH` | `/api/v1/patient/side-effects/{id}` | patient | `PatientSideEffectOut` (emits `se_correction` or `se_severity_updated` / `se_resolved`) |
| `DELETE` | `/api/v1/patient/side-effects/{id}` | patient | `{ ok: true }` (soft-delete; original `se_reported_start` event preserved) |
| `POST` | `/api/v1/doctor/patients/{id}/se-rules` | doctor | `SeMonitoringRuleOut` |
| `DELETE` | `/api/v1/doctor/patients/{id}/se-rules/{rid}` | doctor | `{ ok: true }` |
| `GET` | `/api/v1/doctor/patients/{id}/charts/side-effects` | doctor | `SeSeverityDataPoint[]` |

### New types / models / shared interfaces

```ts
// Generated via pnpm generate:api from OpenAPI schema

interface SeDictionaryOut {
  id: string;
  ukuCode: string;
  nameRu: string;
  nameEn: string;
  bodySystem: string | null;
  severityMin: number;
  severityMax: number;
}

interface PatientSideEffectOut {
  id: string;
  patientId: string;
  seId: string;
  se: SeDictionaryOut;
  severity: number;
  startedAt: string;
  endedAt: string | null;
  datePrecision: 'exact' | 'lt_24h' | 'month' | 'year' | 'range';
  durationLabel: string | null;
  resolved: boolean;
  notes: string | null;
  createdAt: string;
}

interface SeMonitoringRuleOut {
  id: string;
  patientId: string;
  seId: string;
  se: SeDictionaryOut;
  frequencyDays: number;
  assignedBy: string;
  createdAt: string;
}

interface SeSeverityDataPoint {
  date: string;
  seId: string;
  seName: string;   // locale-selected name_ru or name_en
  severity: number;
}
```

### New env vars

None

---

## Gate Checks

> **Before running gate:** confirm all Scope checkboxes are checked (or explicitly deferred in
> Architect Review Notes). Unchecked items appear in the gate report as a warning, not a hard block.

Run `/phase-gate 05` before committing.

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
# Phase 05 smoke check — SE dictionary seeded and accessible
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/ref/se-dictionary?size=5 \
  | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['total'] > 0, 'SE dictionary empty'; print('OK — total:', d['total'])"
# expected: OK — total: <N> (where N > 0)
```

---

## Architect Review Notes

- [x] No architect review issues recorded

---

## Atomic Commit Message

```
feat(phase-05): side effects — UKU seed, SE reporting, monitoring rules, SE chart
```

---

## Post-Phase Checklist

- [ ] All Scope checkboxes checked (or deferred in Architect Review Notes)
- [ ] `docs/PHASE_05_NOTES.md` complete — Implementation Plans filled, key decisions recorded
- [ ] All automated gate checks green
- [ ] All architect review notes resolved
- [ ] `docs/CONTEXT.md` updated — run `/context-update 05`
- [ ] `docs/STATE.md` phase row updated to `✅ done`
- [ ] `docs/CHANGELOG.md` entry added (if contracts changed)
- [ ] Committed atomically on `feat/phase-05` branch
- [ ] Tag created after merge to develop: `git tag -a v0.05.0 -m "Phase 05: Side Effects"`
