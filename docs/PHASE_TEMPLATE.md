# PHASE [XX] — [Phase Title]

<!-- TOKEN BUDGET: keep this file under 10,000 tokens. Be concise. -->

## Phase Metadata

| Field | Value |
|-------|-------|
| Phase | `[XX]` |
| Title | [Phase Title] |
| Status | `⏳ pending` |
| Tag | `v0.[XX].0` |
| Depends on | PHASE_[XX-1] gate passing |

---

## Phase Goal

<!-- 2–4 sentences: what does this phase deliver and why does it matter?
     Link to a SPEC.md section if relevant. -->

---

## Design References

<!-- Optional. Populated by /phase-init when design assets (Figma, mockups, screenshots) are provided.
     Remove this section entirely if no design assets exist for this phase.
     Format: `Screen name — brief description (key components, interactions)` -->

<!-- none provided -->

---

## Scope

<!-- Group tasks by area (Backend / Frontend / Infra / Data, etc.).
     ID scheme: B=Backend · F=Frontend · I=Infra · D=Data · T=other (ungrouped)
     Each item: `ID` description — _Depends on:_ ID, ID or —
     IDs are stable after assignment — never renumber. Mark removed tasks as ~~BN~~ (removed). -->

### Backend
- [ ] `B1` [task] — _Depends on:_ —

### Frontend
- [ ] `F1` [task] — _Depends on:_ —

### Frontend Tests
<!-- Authoring new tests is a Scope task. Running them is a Gate command — those are different things.
     FT1 is mandatory whenever new routes or major UI interactions are added. FT2 is optional. -->
- [ ] `FT1` `frontend/tests/e2e/phase-[XX]-smoke.spec.ts` — e2e smoke covering the critical happy path of every new route and major UI interaction added in this phase; minimum one `test()` block per new page/feature — _Depends on:_ [F tasks that add routes or components]
- [ ] `FT2` Unit tests for new utility functions, hooks, or pure-logic modules introduced in this phase — mark `n/a` and check off if no new testable utilities were added — _Depends on:_ —

### Infra
- [ ] `I1` [task] — _Depends on:_ —

---

## Files

### Create / modify
~~~
[list files relative to repo root]
~~~

### Do NOT touch
- [List files / directories out of scope for this phase]

---

## Contracts

> This section is the source of truth for `/context-update`. Fill it in **before** handing to AI.

### New persistent data (tables / collections / files)

None
<!-- Replace with concrete schema when this phase introduces any. -->

### New API endpoints / RPC methods / events

None
<!-- Replace with a table when this phase introduces any:
| Method | Path / Topic | Auth | Response / Payload |
|--------|--------------|------|---------------------|
| `GET` | `/api/v1/[path]` | JWT | `{"field": type}` |
-->

### New types / models / shared interfaces

None

### New env vars

None
<!-- Replace with a table when this phase introduces any:
| Key | Example value | Required |
|-----|---------------|----------|
| `VAR_NAME` | `value` | yes |
-->

---

## Gate Checks

> **Before running gate:** confirm all Scope checkboxes are checked (or explicitly deferred in
> Architect Review Notes). Unchecked items appear in the gate report as a warning, not a hard block.

Run `/phase-gate [XX]` before committing.

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
- `FT1` checkbox is checked — `frontend/tests/e2e/phase-[XX]-smoke.spec.ts` exists and all its tests are green in `pnpm test:e2e`; OR
- `FT1` is explicitly deferred in Architect Review Notes with a written justification (e.g. "phase adds no new routes or UI interactions").

If this phase needs a custom smoke target or other phase-specific note, record it here:

```bash
# Optional phase-specific smoke override
# curl -s http://localhost:8000/api/v1/[your-endpoint]
# expected: [describe expected response]
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
feat(phase-[XX]): [short description — what was built, not how]
```

---

## Post-Phase Checklist

- [ ] All Scope checkboxes checked (or deferred in Architect Review Notes)
- [ ] `FT1` checked — `frontend/tests/e2e/phase-[XX]-smoke.spec.ts` exists, or deferral documented in Architect Review Notes
- [ ] `docs/PHASE_[XX]_NOTES.md` complete — Implementation Plans filled, key decisions recorded
- [ ] All automated gate checks green
- [ ] All architect review notes resolved
- [ ] `docs/CONTEXT.md` updated — run `/context-update [XX]`
- [ ] `docs/STATE.md` phase row updated to `✅ done`
- [ ] `docs/CHANGELOG.md` entry added (if contracts changed)
- [ ] Committed atomically on `feat/phase-[XX]` branch
- [ ] Tag created after merge to develop: `git tag -a v0.[XX].0 -m "Phase [XX]: [title]"`
