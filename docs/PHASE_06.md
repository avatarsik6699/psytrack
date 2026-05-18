# PHASE 06 — Event Timeline & Color Logic

<!-- TOKEN BUDGET: keep this file under 10,000 tokens. Be concise. -->

## Phase Metadata

| Field | Value |
|-------|-------|
| Phase | `06` |
| Title | Event Timeline & Color Logic |
| Status | `⏳ pending` |
| Tag | `v0.06.0` |
| Depends on | PHASE_05 gate passing |

---

## Phase Goal

Expose the append-only `event_log` as a paginated doctor-facing timeline endpoint and wire the color
computation logic (§3.2) into the patient roster so cards are sorted red→yellow→green→gray.
Introduce the `tasks` table and a daily cron job (`POST /system/tasks/generate`) that creates
`pending` task rows for missed medications, scheduled test reminders, and SE monitoring reports.

---

## Scope

### Data
- [x] `D1` Alembic migration `0007_tasks.py` — create `tasks` table — _Depends on:_ —

### Backend
- [x] `B1` `Task` ORM model + Pydantic schemas (`app/modules/tasks/`) — _Depends on:_ `D1`
- [x] `B2` Color computation service (`app/modules/patients/color_service.py`) — pure function implementing §3.2 SE-priority color rules — _Depends on:_ —
- [x] `B3` Update `GET /doctor/patients` to include `card_color` field on `PatientOut` and sort roster red→yellow→green→gray — _Depends on:_ `B2`
- [x] `B4` `GET /doctor/patients/{id}/events` — paginated event timeline endpoint (`app/modules/events/api.py`) — _Depends on:_ —
- [x] `B5` Task generation service + `POST /system/tasks/generate` internal endpoint — _Depends on:_ `B1`
- [x] `B6` APScheduler lifespan hook in FastAPI to call task generation daily — _Depends on:_ `B5`

### Frontend
- [x] `F1` Wire `card_color` API field to `PatientCard` left-border color strip — _Depends on:_ `B3`
- [x] `F2` `EventTimeline` component + render in doctor patient detail page (`/doctor/patients/:id`) — _Depends on:_ `B4`

---

## Files

### Create / modify
~~~
# Migrations
alembic/versions/0007_tasks.py

# Backend — new
app/modules/tasks/__init__.py
app/modules/tasks/models.py
app/modules/tasks/schemas.py
app/modules/tasks/repository.py
app/modules/tasks/service.py
app/modules/tasks/api.py
app/modules/patients/color_service.py
app/modules/events/api.py

# Backend — modify
app/modules/patients/schemas.py        (add card_color to PatientOut)
app/modules/patients/repository.py    (join SE data for color inputs)
app/modules/patients/service.py       (call color_service, sort roster)
app/modules/patients/api.py           (updated roster endpoint)
app/modules/events/repository.py      (add paginated events query)
app/modules/events/schemas.py         (EventLogOut + pagination wrapper)
app/main.py                           (register tasks router, events router, APScheduler lifespan)

# Frontend — new
frontend/app/components/doctor/EventTimeline.tsx

# Frontend — modify
frontend/app/components/doctor/PatientCard.tsx          (apply card_color strip)
frontend/app/routes/doctor/patients.$id.tsx             (embed EventTimeline)
~~~

### Do NOT touch
- `app/modules/events/models.py` — EventLog model already enforces append-only; no schema changes
- Any Phase 05 side-effects files unless strictly required

---

## Contracts

### New persistent data (tables / collections / files)

```sql
tasks(
  id           UUID PRIMARY KEY,
  patient_id   UUID NOT NULL REFERENCES patients(id),
  task_type    TEXT NOT NULL,          -- 'test' | 'medication_log' | 'se_report'
  reference_id UUID,                  -- FK to patient_scales / patient_medications / se_monitoring_rules
  due_at       TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL          -- 'pending' | 'done' | 'missed' | 'snoozed'
               CHECK (status IN ('pending','done','missed','snoozed')),
  created_at   TIMESTAMPTZ NOT NULL
)
```

### New API endpoints / RPC methods / events

| Method | Path | Auth | Response / Payload |
|--------|------|------|--------------------|
| `GET`  | `/api/v1/doctor/patients/{id}/events` | doctor bearer | `{ items: EventLogOut[], total: int, page: int, size: int }` — `?page=1&size=20` |
| `POST` | `/api/v1/system/tasks/generate` | internal (X-Internal-Key header) | `{ generated: int }` |

**Modified endpoint (not new):**
`GET /api/v1/doctor/patients` — `PatientOut` extended with `card_color: "red" | "yellow" | "green" | "gray"`; response sorted red → yellow → green → gray.

### New types / models / shared interfaces

> All TypeScript types are auto-generated — run `pnpm generate:api` after backend changes.
> Do not hand-write.

New backend Pydantic types:
- `TaskOut` — mirrors `tasks` table; `id`, `patientId`, `taskType`, `referenceId`, `dueAt`, `status`, `createdAt`
- `EventTimelinePage` — `{ items: list[EventLogOut], total: int, page: int, size: int }`
- `PatientOut` updated — adds `card_color: Literal["red","yellow","green","gray"]`

### New env vars

None

---

## Gate Checks

> **Before running gate:** confirm all Scope checkboxes are checked (or explicitly deferred in
> Architect Review Notes). Unchecked items appear in the gate report as a warning, not a hard block.

Run `/phase-gate 06` before committing.

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

Phase-specific smoke tests:

```bash
# Color-sorted roster
curl -s http://localhost:8000/api/v1/doctor/patients \
  -H "Authorization: Bearer $DOCTOR_TOKEN"
# expected: JSON array; first items have card_color "red", sorted red→yellow→green→gray

# Paginated event timeline
curl -s "http://localhost:8000/api/v1/doctor/patients/$PATIENT_ID/events?page=1&size=20" \
  -H "Authorization: Bearer $DOCTOR_TOKEN"
# expected: { "items": [...], "total": N, "page": 1, "size": 20 }

# Task generation
curl -s -X POST http://localhost:8000/api/v1/system/tasks/generate \
  -H "X-Internal-Key: $INTERNAL_KEY"
# expected: { "generated": N }  (N >= 0)
```

---

## Architect Review Notes

- [x] No architect review issues recorded

---

## Atomic Commit Message

```
feat(phase-06): event timeline, color logic, task cron
```

---

## Post-Phase Checklist

- [ ] All Scope checkboxes checked (or deferred in Architect Review Notes)
- [ ] `docs/PHASE_06_NOTES.md` complete — Implementation Plans filled, key decisions recorded
- [ ] All automated gate checks green
- [ ] All architect review notes resolved
- [ ] `docs/CONTEXT.md` updated — run `/context-update 06`
- [ ] `docs/STATE.md` phase row updated to `✅ done`
- [ ] `docs/CHANGELOG.md` entry added (if contracts changed)
- [ ] Committed atomically on `feat/phase-06` branch
- [ ] Tag created after merge to develop: `git tag -a v0.06.0 -m "Phase 06: Event Timeline & Color Logic"`
