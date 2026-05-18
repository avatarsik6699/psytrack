# PHASE 06 — Implementation Notes

<!--
  WHAT to build → docs/PHASE_06.md  (contracts, scope checklist)
  HOW it was built → this file       (plans, decisions, rationale)

  Ownership rules:
  - ### Exploration          — written by agent (/phase-explore). Optional; skip for simple tasks.
  - ### Implementation Plan  — written by agent (/impl-brief). Agent may update only this section.
  - ### Decisions & Notes    — written by human. NEVER overwritten by agent.

  Sync rule: task IDs (B1, F1, I1 …) must match the Scope checklist in PHASE_06.md.
  To add an unplanned task discovered mid-phase, run /phase-add-task 06 "description" — it
  assigns the next ID, derives contracts, and generates explore + impl-brief automatically.
  To mark a removed task: prefix its heading with ~~, e.g. ## ~~B3~~ (removed). Do not delete.
-->

_Phase:_ `06` · _Generated:_ `2026-05-18`

---

## [D1] — Alembic migration 0007_tasks.py — create tasks table
**Depends on:** —

### Exploration
<!-- Optional. Run `/phase-explore 06 D1` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 06 D1` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B1] — Task ORM model + Pydantic schemas
**Depends on:** D1

### Exploration
<!-- Optional. Run `/phase-explore 06 B1` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 06 B1` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B2] — Color computation service
**Depends on:** —

### Exploration
<!-- Optional. Run `/phase-explore 06 B2` to populate. -->

### Implementation Plan

**Done when:**
`compute_card_color(ColorInputs(...))` returns the correct `"red" | "yellow" | "green" | "gray"` literal for every case in the §3.2 table; `uv run pytest tests/test_color_service.py` passes with at minimum one parametrized test per color (8 cases covering SE severity levels and clinical-dynamics branches).

**Follows pattern:**
`app/modules/side_effects/service.py:196` — `SeSeverityChartService.build_chart` is the closest existing example of a stateless, pure computation over pre-fetched data. B2 is simpler: a module-level function (no class) with no async.

**Files:**
- `app/modules/patients/color_service.py` — **create**
- `tests/test_color_service.py` — **create**

**Code structure:**

```python
# app/modules/patients/color_service.py
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal

CardColor = Literal["red", "yellow", "green", "gray"]

GRAY_THRESHOLD_DAYS = 7


@dataclass
class ColorInputs:
    se_severities: list[int] = field(default_factory=list)
    # ^ active (non-deleted, non-resolved) PatientSideEffect.severity values

    therapy_start: datetime | None = None
    # ^ earliest started_at from active PatientMedication records

    baseline_score: int | None = None
    # ^ TestCompletion.score where baseline=True (most recent per patient_scale_id)

    latest_score: int | None = None
    # ^ TestCompletion.score of the most recent non-baseline completion

    control_point_days: int | None = None
    # ^ ClinicalRule.control_point_days for the patient's primary diagnosis

    response_threshold_pct: int | None = None
    # ^ ClinicalRule.response_threshold_pct

    response_threshold_abs: int | None = None
    # ^ ClinicalRule.response_threshold_abs

    improvement_direction: str | None = None
    # ^ Scale.improvement_direction: "lower" | "higher"

    now: datetime | None = None
    # ^ injectable for unit tests; defaults to datetime.now(timezone.utc)


def compute_card_color(inputs: ColorInputs) -> CardColor:
    ...

def _is_gray(inputs: ColorInputs, now: datetime) -> bool:
    ...

def _clinical_dynamics(
    inputs: ColorInputs, now: datetime
) -> Literal["positive", "not_reached", "negative", "unknown"]:
    ...
```

**Logic:**

```
compute_card_color:
  now = inputs.now or datetime.now(timezone.utc)
  if _is_gray(inputs, now): return "gray"
  dynamics = _clinical_dynamics(inputs, now)
  if any(s >= 3 for s in se_severities) or dynamics == "negative": return "red"
  sev1_count = count(s == 1); has_sev2 = any(s == 2)
  if sev1_count > 3 or has_sev2 or dynamics == "not_reached": return "yellow"
  if dynamics == "positive" and sev1_count <= 3 and not has_sev2: return "green"
  return "gray"  # fallback: unknown dynamics + no bad SEs

_is_gray:
  return True if therapy_start is None
  return True if days_in_therapy < 7
  return True if baseline_score is None and latest_score is None

_clinical_dynamics:
  return "unknown" if any of baseline_score, latest_score, control_point_days, therapy_start is None
  return "unknown" if days_in_therapy < control_point_days  (haven't reached control point)
  delta_pts = baseline - latest    (if direction == "lower")
           OR latest - baseline   (if direction == "higher")
  if delta_pts < 0: return "negative"
  pct_change = delta_pts / baseline_score * 100  (guard baseline_score != 0)
  if delta_pts >= response_threshold_abs or pct_change >= response_threshold_pct: return "positive"
  return "not_reached"
```

**Tests structure:**

```python
# tests/test_color_service.py
import pytest
from datetime import datetime, timedelta, timezone
from app.modules.patients.color_service import ColorInputs, compute_card_color

NOW = datetime(2026, 5, 18, tzinfo=timezone.utc)
OLD = NOW - timedelta(days=30)

@pytest.mark.parametrize("inputs,expected", [
    # Gray: no therapy start
    (ColorInputs(now=NOW), "gray"),
    # Gray: < 7 days
    (ColorInputs(therapy_start=NOW - timedelta(days=5), now=NOW), "gray"),
    # Gray: therapy OK but no test results
    (ColorInputs(therapy_start=OLD, now=NOW), "gray"),
    # Red: SE severity 4
    (ColorInputs(se_severities=[4], therapy_start=OLD, now=NOW), "red"),
    # Red: SE severity 3
    (ColorInputs(se_severities=[3], therapy_start=OLD, now=NOW), "red"),
    # Red: negative clinical dynamics (score worse than baseline with "lower" direction)
    (ColorInputs(se_severities=[], therapy_start=OLD, baseline_score=50, latest_score=80,
                 control_point_days=14, response_threshold_pct=30, response_threshold_abs=20,
                 improvement_direction="lower", now=NOW), "red"),
    # Yellow: SE severity 2
    (ColorInputs(se_severities=[2], therapy_start=OLD, now=NOW), "yellow"),
    # Yellow: 4 × severity-1
    (ColorInputs(se_severities=[1, 1, 1, 1], therapy_start=OLD, now=NOW), "yellow"),
    # Yellow: improvement not reached at control point
    (ColorInputs(se_severities=[], therapy_start=OLD, baseline_score=100, latest_score=90,
                 control_point_days=14, response_threshold_pct=30, response_threshold_abs=20,
                 improvement_direction="lower", now=NOW), "yellow"),
    # Green: positive dynamics, low SE
    (ColorInputs(se_severities=[1], therapy_start=OLD, baseline_score=100, latest_score=50,
                 control_point_days=14, response_threshold_pct=30, response_threshold_abs=20,
                 improvement_direction="lower", now=NOW), "green"),
])
def test_compute_card_color(inputs, expected):
    assert compute_card_color(inputs) == expected
```

**Step-by-step order:**

1. Create `app/modules/patients/color_service.py` with `CardColor`, `GRAY_THRESHOLD_DAYS`, `ColorInputs`, `_is_gray`, `_clinical_dynamics`, `compute_card_color`.
2. Create `tests/test_color_service.py` with the parametrized table above (10 cases minimum).
3. Run `uv run pytest tests/test_color_service.py -v` — all cases must pass.
4. Do **not** register anything in `app/main.py` — this is a pure library module consumed by B3.

**Gotcha callouts:**

- `PatientSideEffect.deleted_at` and `PatientSideEffect.resolved` must both be checked before passing severities in — the caller (B3 repository) must filter to `deleted_at IS NULL AND resolved = false`; `color_service.py` does not query the DB.
- `baseline_score` may be `None` even after 7 days if the patient has never submitted a test — the gray check catches this but only when _both_ baseline and latest are `None`. If only baseline is `None` but latest is set (unusual), treat dynamics as `"unknown"` (handled by `_clinical_dynamics`).
- No async code in this file. Tests use plain `def` — no `pytest-asyncio` fixtures needed.

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B3] — Update GET /doctor/patients with card_color + color sort
**Depends on:** B2

### Exploration
<!-- Optional. Run `/phase-explore 06 B3` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 06 B3` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B4] — GET /doctor/patients/{id}/events paginated endpoint
**Depends on:** —

### Exploration
<!-- Optional. Run `/phase-explore 06 B4` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 06 B4` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B5] — Task generation service + POST /system/tasks/generate endpoint
**Depends on:** B1

### Exploration
<!-- Optional. Run `/phase-explore 06 B5` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 06 B5` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B6] — APScheduler lifespan hook for daily task generation
**Depends on:** B5

### Exploration
<!-- Optional. Run `/phase-explore 06 B6` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 06 B6` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [F1] — Wire card_color to PatientCard color strip
**Depends on:** B3

### Exploration
<!-- Optional. Run `/phase-explore 06 F1` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 06 F1` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [F2] — EventTimeline component + doctor patient detail integration
**Depends on:** B4

### Exploration
<!-- Optional. Run `/phase-explore 06 F2` to populate. -->

### Implementation Plan
<!-- Run `/impl-brief 06 F2` to generate. -->

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->
