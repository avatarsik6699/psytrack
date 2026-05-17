# PHASE 03 — Implementation Notes

<!--
  WHAT to build → docs/PHASE_03.md  (contracts, scope checklist)
  HOW it was built → this file       (plans, decisions, rationale)

  Ownership rules:
  - ### Exploration          — written by agent (/phase-explore). Optional; skip for simple tasks.
  - ### Implementation Plan  — written by agent (/impl-brief). Agent may update only this section.
  - ### Decisions & Notes    — written by human. NEVER overwritten by agent.

  Sync rule: task IDs (B1, F1, I1 …) must match the Scope checklist in PHASE_03.md.
  To add an unplanned task discovered mid-phase, run /phase-add-task 03 "description" — it
  assigns the next ID, derives contracts, and generates explore + impl-brief automatically.
  To mark a removed task: prefix its heading with ~~, e.g. ## ~~B3~~ (removed). Do not delete.
-->

_Phase:_ `03` · _Generated:_ `2026-05-17`

---

## [D1] — Alembic migration 0004_scales_patient_scales
**Depends on:** —

### Exploration
_Explored:_ `2026-05-17` · _Verdict:_ `ready`

**Relevant patterns found:**
- `alembic/versions/0003_diagnoses_medications.py:1-85` — full migration template: `sa.UUID()` with `server_default=sa.text("gen_random_uuid()")`, `sa.DateTime(timezone=True)` with `sa.text("now()")`, `postgresql.JSONB(astext_type=sa.Text())`, `sa.CheckConstraint`, `sa.ForeignKeyConstraint` with `ondelete` — copy this structure exactly
- `alembic/versions/0002_doctor_profile_patient.py` — pattern for separate creation of referencing tables; `down_revision` chain

**Constraints discovered:**
- `down_revision` must be `"0003_diagnoses_medications"`; revision ID must be `"0004_scales_patient_scales"`
- `scales` has no timestamp columns per spec — do NOT add `created_at`/`updated_at` to it
- `patient_scales` has only `created_at` (no `updated_at`) — do NOT auto-add `updated_at` column
- `test_completions` uses `completed_at TIMESTAMPTZ NOT NULL` (not `created_at`/`updated_at`) — custom column, not the shared timestamp pattern
- `improvement_direction` needs `CHECK(improvement_direction IN ('lower','higher'))` constraint
- `clinical_rules.diagnosis_icd` is plain TEXT (no FK to `diagnoses`) — it stores ICD code strings, not foreign keys
- Downgrade drop order must respect FKs: `test_completions` → `patient_scales` → `clinical_rules` → `scales`

**Spec/contract gaps:**
- — (none; contracts are fully specified for this migration)

**Risk areas:**
- JSONB columns (`questions_json`, `domains_json`, `answers_json`) require `from sqlalchemy.dialects import postgresql` and `postgresql.JSONB(astext_type=sa.Text())` — missing import causes silent fallback to non-JSONB type

### Implementation Plan

**Done when:** `uv run alembic upgrade head` exits 0; tables `scales`, `clinical_rules`, `patient_scales`, `test_completions` exist with correct columns verified by `\d <table>` in psql.

**Follows pattern:** `alembic/versions/0003_diagnoses_medications.py`

**Files:**
- `alembic/versions/0004_scales_patient_scales.py` [CREATE]

**Code structure:**
```python
revision: str = "0004_scales_patient_scales"
down_revision: str | None = "0003_diagnoses_medications"

def upgrade() -> None:
    op.create_table("scales", ...)          # no timestamps
    op.create_table("clinical_rules", ...)  # no timestamps
    op.create_table("patient_scales", ...)  # created_at only
    op.create_table("test_completions", ...)  # completed_at only

def downgrade() -> None:
    op.drop_table("test_completions")
    op.drop_table("patient_scales")
    op.drop_table("clinical_rules")
    op.drop_table("scales")
```

**Step-by-step:**
1. Create the file. Set `revision="0004_scales_patient_scales"`, `down_revision="0003_diagnoses_medications"`. Add `from sqlalchemy.dialects import postgresql` at top — **gotcha: missing this import causes silent fallback from JSONB to plain JSON type.**
2. `upgrade()` — creation order: `scales` (no FK deps) → `clinical_rules` (FK → scales) → `patient_scales` (FK → patients, diagnoses, scales, doctor_profiles) → `test_completions` (FK → patients, patient_scales, scales).
3. `scales` columns: `id UUID server_default gen_random_uuid() PK`, `code TEXT UNIQUE NOT NULL`, `name TEXT NOT NULL`, `score_min INT NOT NULL`, `score_max INT NOT NULL`, `improvement_direction TEXT nullable` + `sa.CheckConstraint("improvement_direction IN ('lower','higher')", name="ck_scales_improvement_direction")`, `domains_json postgresql.JSONB(astext_type=sa.Text()) nullable=True`, `questions_json postgresql.JSONB(astext_type=sa.Text()) NOT NULL`. **No timestamp columns.**
4. `clinical_rules` columns: `id UUID PK`, `diagnosis_icd sa.Text() NOT NULL` (plain text, no FK to diagnoses), `scale_id UUID FK scales ON DELETE CASCADE NOT NULL`, `control_point_days INT NOT NULL`, `response_threshold_pct INT NOT NULL`, `response_threshold_abs INT NOT NULL`. **No timestamp columns.**
5. `patient_scales` columns: `id UUID PK`, `patient_id UUID FK patients CASCADE NOT NULL`, `diagnosis_id UUID FK diagnoses CASCADE NOT NULL`, `scale_id UUID FK scales RESTRICT NOT NULL`, `frequency_days INT NOT NULL`, `assigned_by UUID FK doctor_profiles RESTRICT NOT NULL`, `created_at DateTime(timezone=True) server_default sa.text("now()") NOT NULL`. **No `updated_at`.**
6. `test_completions` columns: `id UUID PK`, `patient_id UUID FK patients CASCADE NOT NULL`, `patient_scale_id UUID FK patient_scales CASCADE NOT NULL`, `scale_id UUID FK scales RESTRICT NOT NULL`, `score INT NOT NULL`, `answers_json postgresql.JSONB NOT NULL`, `baseline sa.Boolean() server_default sa.text("false") NOT NULL`, `completed_at DateTime(timezone=True) NOT NULL` (no server_default — set at application time). **No `created_at`/`updated_at`.**
7. `downgrade()`: drop in reverse FK order: `test_completions` → `patient_scales` → `clinical_rules` → `scales`.

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [D2] — PHQ-9 / GAD-7 / YMRS seeder
**Depends on:** D1

### Exploration
_Explored:_ `2026-05-17` · _Verdict:_ `ready`

**Relevant patterns found:**
- `app/seeders/medications.py:1-31` — exact pattern: `BaseSeeder` subclass, `name`/`description` class attrs, `pg_insert(...).values(...).on_conflict_do_nothing(index_elements=[...])`, `session.commit()`, returns `result.rowcount`
- `app/seeders/__init__.py:1-10` — registration: import class, append to `ALL_SEEDERS`; insertion order = execution order
- `app/seeders/base.py:1-11` — `BaseSeeder` ABC: `name: str`, `description: str`, `run(session) -> int`

**Constraints discovered:**
- `scales.code` is UNIQUE — use `on_conflict_do_nothing(index_elements=["code"])` for idempotent re-runs
- `clinical_rules` has no UNIQUE constraint in the schema → cannot use `on_conflict_do_nothing` per-row; preferred approach is insert-only-if-table-empty (check count before inserting)
- `questions_json` is JSONB NOT NULL — must supply complete question array `[{"id": int, "text": str, "options": [{"value": int, "label": str}]}]` for all 27 items (PHQ-9: 9, GAD-7: 7, YMRS: 11)
- `clinical_rules` rows reference `scale_id` FK — scales must be seeded before `clinical_rules` in the same transaction or the FK will fail
- `ScalesSeeder` must be registered before any future seeder that depends on it

**Spec/contract gaps:**
- `clinical_rules` lacks a UNIQUE constraint — idempotent seeding requires a count-guard; adding a migration-level unique constraint on `(diagnosis_icd, scale_id)` would make seeding cleaner but is not in the Phase 03 migration contract

**Risk areas:**
- Question data volume: 27 questions total with typed option arrays — copy from validated clinical sources; incorrect `value` ranges will corrupt score calculations downstream

### Implementation Plan

**Done when:** `uv run python scripts/seed.py --seeder scales` exits 0 and inserts 3 scale rows (PHQ9, GAD7, YMRS) and at least 3 `clinical_rules` rows. Re-running is idempotent — scales use `on_conflict_do_nothing`; rules use a count-guard.

**Follows pattern:** `app/seeders/medications.py:1-31`

**Files:**
- `app/seeders/scales.py` [CREATE]
- `app/seeders/__init__.py` [MODIFY — import ScalesSeeder, append to ALL_SEEDERS]

**Code structure:**
```python
# app/seeders/scales.py
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.scales.models import Scale, ClinicalRule
from app.seeders.base import BaseSeeder

class ScalesSeeder(BaseSeeder):
    name = "scales"
    description = "PHQ-9, GAD-7, YMRS reference scales with questions and clinical rules"

    SCALES_DATA: list[dict] = [
        {
            "code": "PHQ9",
            "name": "Patient Health Questionnaire-9",
            "score_min": 0,
            "score_max": 27,
            "improvement_direction": "lower",
            "domains_json": None,
            "questions_json": [  # 9 questions, options 0-3
                {"id": 1, "text": "Little interest or pleasure in doing things",
                 "options": [{"value": 0, "label": "Not at all"}, {"value": 1, "label": "Several days"},
                             {"value": 2, "label": "More than half the days"}, {"value": 3, "label": "Nearly every day"}]},
                # ... questions 2-9 follow same options structure; texts from PHQ-9 standard
            ],
        },
        {
            "code": "GAD7",
            "name": "Generalized Anxiety Disorder-7",
            "score_min": 0, "score_max": 21, "improvement_direction": "lower",
            "domains_json": None,
            "questions_json": [  # 7 questions, same 0-3 options
                {"id": 1, "text": "Feeling nervous, anxious, or on edge", "options": [...]},
                # ... questions 2-7
            ],
        },
        {
            "code": "YMRS",
            "name": "Young Mania Rating Scale",
            "score_min": 0, "score_max": 60, "improvement_direction": "lower",
            "domains_json": None,
            "questions_json": [  # 11 items; items 5,6,8,9 use 0/2/4/6/8 options; others 0/1/2/3/4
                {"id": 1, "text": "Elevated mood",
                 "options": [{"value": 0, "label": "Absent"}, {"value": 1, "label": "Mildly or possibly increased"},
                             {"value": 2, "label": "Definite subjective elevation"}, {"value": 3, "label": "Elevated, inappropriate"},
                             {"value": 4, "label": "Euphoric, inappropriate laughter"}]},
                # ... items 2-4, 7, 10, 11 follow 0-4 pattern
                # items 5, 6, 8, 9 use 0/2/4/6/8 values (double-weighted)
            ],
        },
    ]

    async def run(self, session: AsyncSession) -> int:
        # 1. Upsert scales (idempotent via on_conflict_do_nothing on "code")
        stmt = pg_insert(Scale).values(self.SCALES_DATA).on_conflict_do_nothing(index_elements=["code"])
        result = await session.execute(stmt)
        scales_inserted = result.rowcount
        await session.flush()

        # 2. Fetch scale IDs for FK references in clinical_rules
        rows = await session.scalars(select(Scale).where(Scale.code.in_(["PHQ9", "GAD7", "YMRS"])))
        scale_map = {s.code: s.id for s in rows}

        # 3. Insert clinical_rules only if table is empty (no UNIQUE constraint — use count-guard)
        rules_count = await session.scalar(select(func.count()).select_from(ClinicalRule))
        rules_inserted = 0
        if rules_count == 0:
            rules_data = [
                {"diagnosis_icd": "F32", "scale_id": scale_map["PHQ9"],
                 "control_point_days": 42, "response_threshold_pct": 50, "response_threshold_abs": 5},
                {"diagnosis_icd": "F41", "scale_id": scale_map["GAD7"],
                 "control_point_days": 42, "response_threshold_pct": 50, "response_threshold_abs": 5},
                {"diagnosis_icd": "F30", "scale_id": scale_map["YMRS"],
                 "control_point_days": 42, "response_threshold_pct": 50, "response_threshold_abs": 10},
            ]
            rules_result = await session.execute(pg_insert(ClinicalRule).values(rules_data))
            rules_inserted = rules_result.rowcount
        await session.commit()
        return scales_inserted + rules_inserted
```

**Step-by-step:**
1. Create `app/seeders/scales.py` with `ScalesSeeder`. Fill `questions_json` for all 27 questions — PHQ-9 (9 × options 0–3), GAD-7 (7 × options 0–3), YMRS (11 items; items 5/6/8/9 use values 0/2/4/6/8; others 0/1/2/3/4).
2. `run()`: insert scales with `on_conflict_do_nothing(index_elements=["code"])`, flush.
3. Fetch inserted scale IDs by code to build FK references for `clinical_rules`.
4. Check `clinical_rules` count; insert 3 rule rows only if count == 0.
5. Commit; return total rowcount.
6. Modify `app/seeders/__init__.py`: `from app.seeders.scales import ScalesSeeder`; append `ScalesSeeder` to `ALL_SEEDERS` after `MedicationReferenceSeeder` (B1 models must exist first).

**Gotcha:** `clinical_rules` has no UNIQUE constraint — cannot use `on_conflict_do_nothing`; the count-guard is required for idempotency.

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B1] — SQLAlchemy models Scale, ClinicalRule, PatientScale, TestCompletion
**Depends on:** D1

### Exploration
_Explored:_ `2026-05-17` · _Verdict:_ `ready`

**Relevant patterns found:**
- `app/modules/medications/models.py:1-36` — `class Foo(UUIDMixin, TimestampMixin, Base)` with `mapped_column`, `ForeignKey`, `JSONB`, and `relationship(..., lazy="raise")`
- `app/db/base.py:1-33` — `UUIDMixin` (id UUID, PK, uuid4 default), `TimestampMixin` (created_at + updated_at both TIMESTAMPTZ)
- `app/modules/patients/models.py:1-29` — `CITEXT`, `Boolean`, nullable-optional fields, FK with `ondelete="CASCADE"`

**Constraints discovered:**
- `Scale` and `ClinicalRule` must NOT inherit `TimestampMixin` — spec schema has no timestamp columns for these tables
- `PatientScale` must NOT inherit `TimestampMixin` — spec has only `created_at` (no `updated_at`); use `UUIDMixin` + manual `created_at = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)`
- `TestCompletion` must NOT inherit `TimestampMixin` — spec uses `completed_at` (not `created_at`/`updated_at`); use `UUIDMixin` + manual `completed_at`
- All relationships that are loaded via queries should use `lazy="raise"` on the model + `selectinload()` in the repository — this is the established pattern (see `PatientMedication.medication`)
- `JSONB` columns require `from sqlalchemy.dialects.postgresql import JSONB`

**Spec/contract gaps:**
- `scales.domains_json` is listed as "deferred V2" — include as JSONB nullable column in the model so the migration column matches

**Risk areas:**
- Four new models in one file — verify `__tablename__` matches migration exactly (`scales`, `clinical_rules`, `patient_scales`, `test_completions`)

### Implementation Plan

**Done when:** `from app.modules.scales.models import Scale, ClinicalRule, PatientScale, TestCompletion` and `from app.modules.events.models import EventLog` both succeed; `__tablename__` values match migration exactly.

**Follows pattern:** `app/modules/medications/models.py:1-36`; `app/db/base.py:1-33`

**Files:**
- `app/modules/scales/__init__.py` [CREATE — empty]
- `app/modules/scales/models.py` [CREATE]
- `app/modules/events/__init__.py` [CREATE — empty]
- `app/modules/events/models.py` [CREATE]

**Code structure:**
```python
# app/modules/scales/models.py
from datetime import datetime
from uuid import UUID
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, UUIDMixin

class Scale(UUIDMixin, Base):                    # NO TimestampMixin
    __tablename__ = "scales"
    code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    score_min: Mapped[int] = mapped_column(Integer, nullable=False)
    score_max: Mapped[int] = mapped_column(Integer, nullable=False)
    improvement_direction: Mapped[str | None] = mapped_column(String(10), nullable=True)
    domains_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    questions_json: Mapped[list] = mapped_column(JSONB, nullable=False)

class ClinicalRule(UUIDMixin, Base):             # NO TimestampMixin
    __tablename__ = "clinical_rules"
    diagnosis_icd: Mapped[str] = mapped_column(Text, nullable=False)
    scale_id: Mapped[UUID] = mapped_column(ForeignKey("scales.id", ondelete="CASCADE"), nullable=False)
    control_point_days: Mapped[int] = mapped_column(Integer, nullable=False)
    response_threshold_pct: Mapped[int] = mapped_column(Integer, nullable=False)
    response_threshold_abs: Mapped[int] = mapped_column(Integer, nullable=False)

class PatientScale(UUIDMixin, Base):             # NO TimestampMixin — manual created_at only
    __tablename__ = "patient_scales"
    patient_id: Mapped[UUID] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    diagnosis_id: Mapped[UUID] = mapped_column(ForeignKey("diagnoses.id", ondelete="CASCADE"), nullable=False)
    scale_id: Mapped[UUID] = mapped_column(ForeignKey("scales.id", ondelete="RESTRICT"), nullable=False)
    frequency_days: Mapped[int] = mapped_column(Integer, nullable=False)
    assigned_by: Mapped[UUID] = mapped_column(ForeignKey("doctor_profiles.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    scale: Mapped["Scale"] = relationship("Scale", lazy="raise")

class TestCompletion(UUIDMixin, Base):           # NO TimestampMixin — manual completed_at only
    __tablename__ = "test_completions"
    patient_id: Mapped[UUID] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_scale_id: Mapped[UUID] = mapped_column(ForeignKey("patient_scales.id", ondelete="CASCADE"), nullable=False)
    scale_id: Mapped[UUID] = mapped_column(ForeignKey("scales.id", ondelete="RESTRICT"), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    answers_json: Mapped[list] = mapped_column(JSONB, nullable=False)
    baseline: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), nullable=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    scale: Mapped["Scale"] = relationship("Scale", lazy="raise")
```

```python
# app/modules/events/models.py
from datetime import datetime
from uuid import UUID
from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, UUIDMixin

class EventLog(UUIDMixin, Base):  # NO TimestampMixin — append-only; manual created_at
    __tablename__ = "event_log"
    patient_id: Mapped[UUID] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
```

**Step-by-step:**
1. Create `app/modules/scales/__init__.py` (empty) and `app/modules/events/__init__.py` (empty).
2. Create `app/modules/scales/models.py` with `Scale`, `ClinicalRule`, `PatientScale`, `TestCompletion`.
3. `Scale` and `ClinicalRule` — do **not** inherit `TimestampMixin`; no timestamp columns.
4. `PatientScale` — do **not** inherit `TimestampMixin`; add manual `created_at` with `server_default=func.now()` only (no `updated_at`).
5. `TestCompletion` — do **not** inherit `TimestampMixin`; add manual `completed_at` with no server_default (set at application time in B4).
6. Both `PatientScale.scale` and `TestCompletion.scale` use `lazy="raise"` — loaded via `selectinload()` in repository queries.
7. Create `app/modules/events/models.py` with `EventLog` (no TimestampMixin; manual `created_at`, nullable `created_by`).

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B2] — Reference endpoints GET /ref/scales and GET /ref/scales/{id}/questions
**Depends on:** B1

### Exploration
_Explored:_ `2026-05-17` · _Verdict:_ `ready`

**Relevant patterns found:**
- `app/modules/medications/api.py:20-32` — `ref_router = APIRouter(prefix="/ref/medications", tags=["reference"])` with `Depends(get_current_user)` (bearer, any role) — copy this pattern for `GET /ref/scales` and `GET /ref/scales/{id}/questions`
- `app/modules/medications/repository.py:14-19` — `select(Model).where(...).limit().offset()` + `scalars()` pattern for list queries
- `app/api/v1/router.py:1-19` — router registration: import two routers (`ref_router`, `doctor_router`), call `include_router()` for each

**Constraints discovered:**
- Auth is `bearer` (any authenticated user) — use `Depends(get_current_user)`, not `require_doctor`/`require_patient`
- `GET /ref/scales/{id}/questions` returns the `questions_json` JSONB field parsed as a list — the `Scale` model will have the JSONB column; repository fetches scale by id; API returns `scale.questions_json` directly
- `ScaleOut` does NOT include `questions_json` — return only `id, code, name, score_min, score_max, improvement_direction`
- `GET /ref/scales` should return all rows (no pagination needed per spec); `GET /ref/scales/{id}/questions` returns `scale.questions_json` cast to `list[dict]`

**Spec/contract gaps:**
- Contracts define `ScaleQuestion` as `{id: int, text: str, options: [{value: int, label: str}]}` but backend Pydantic schema for this type needs to be created — not listed in existing schemas

**Risk areas:**
- After implementing, must run `pnpm generate:api` before any frontend work touches scale types

### Implementation Plan

**Done when:** `GET /api/v1/ref/scales` returns 200 `ScaleOut[]` (3 items after seeding). `GET /api/v1/ref/scales/{id}/questions` returns 200 `ScaleQuestion[]` for a valid ID, 404 for unknown ID. Both require a valid bearer token.

**Follows pattern:** `app/modules/medications/api.py:20-32` (ref_router); `app/modules/medications/repository.py:14-19` (list query); `app/modules/medications/schemas.py` (Pydantic schemas)

**Files:**
- `app/modules/scales/schemas.py` [CREATE — all Phase 03 Pydantic schemas]
- `app/modules/scales/repository.py` [CREATE — ScaleRepository + stubs for PatientScaleRepository, TestCompletionRepository]
- `app/modules/scales/service.py` [CREATE — ScaleService]
- `app/modules/scales/dependencies.py` [CREATE]
- `app/modules/scales/exceptions.py` [CREATE]
- `app/modules/scales/api.py` [CREATE — ref_scales_router]
- `app/api/v1/router.py` [MODIFY — add ref_scales_router]

**Code structure:**
```python
# schemas.py
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class ScaleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    code: str
    name: str
    score_min: int
    score_max: int
    improvement_direction: str | None

class ScaleQuestion(BaseModel):
    id: int
    text: str
    options: list[dict]  # [{"value": int, "label": str}]

class PatientScaleCreate(BaseModel):
    scale_id: UUID
    diagnosis_id: UUID
    frequency_days: int

class PatientScaleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    patient_id: UUID
    diagnosis_id: UUID
    scale_id: UUID
    frequency_days: int
    assigned_by: UUID
    created_at: datetime
    scale: ScaleOut | None = None

class TestSubmitIn(BaseModel):
    answers: list[dict]  # [{"question_id": int, "value": int}]
    baseline: bool = False

class TestCompletionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    patient_id: UUID
    patient_scale_id: UUID
    scale_id: UUID
    score: int
    baseline: bool
    completed_at: datetime
    scale: ScaleOut | None = None

class TestCompletionPage(BaseModel):
    items: list[TestCompletionOut]
    total: int
```

```python
# repository.py (ScaleRepository portion)
class ScaleRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[Scale]:
        result = await self._session.scalars(select(Scale))
        return list(result)

    async def get_by_id(self, scale_id: UUID) -> Scale | None:
        return await self._session.scalar(select(Scale).where(Scale.id == scale_id))
```

```python
# service.py (ScaleService portion)
class ScaleService:
    def __init__(self, repository: ScaleRepository) -> None:
        self._repository = repository

    async def list_all(self) -> list[Scale]:
        return await self._repository.list_all()

    async def get_by_id(self, scale_id: UUID) -> Scale:
        scale = await self._repository.get_by_id(scale_id)
        if scale is None:
            raise HTTPException(status_code=404, detail="Scale not found")
        return scale
```

```python
# api.py (ref_scales_router)
ref_scales_router = APIRouter(prefix="/ref/scales", tags=["reference"])

@ref_scales_router.get("", response_model=list[ScaleOut])
async def list_scales(
    _current_user: User = Depends(get_current_user),
    scale_service: ScaleService = Depends(get_scale_service),
) -> list[ScaleOut]:
    scales = await scale_service.list_all()
    return [ScaleOut.model_validate(s) for s in scales]

@ref_scales_router.get("/{scale_id}/questions", response_model=list[ScaleQuestion])
async def get_scale_questions(
    scale_id: UUID,
    _current_user: User = Depends(get_current_user),
    scale_service: ScaleService = Depends(get_scale_service),
) -> list[ScaleQuestion]:
    scale = await scale_service.get_by_id(scale_id)
    return scale.questions_json  # JSONB list returned directly
```

```python
# router.py additions
from app.modules.scales.api import ref_scales_router
api_v1_router.include_router(ref_scales_router)
```

**Step-by-step:**
1. Create `app/modules/scales/schemas.py` — define all 7 schemas listed above (`ScaleOut`, `ScaleQuestion`, `PatientScaleCreate`, `PatientScaleOut`, `TestSubmitIn`, `TestCompletionOut`, `TestCompletionPage`).
2. Create `app/modules/scales/exceptions.py` (placeholder for `ScaleNotFound` if custom exceptions are needed).
3. Create `app/modules/scales/repository.py` with `ScaleRepository` (list_all, get_by_id). Add empty stubs for `PatientScaleRepository` and `TestCompletionRepository` — fill in B3/B4/B5.
4. Create `app/modules/scales/service.py` with `ScaleService` (list_all, get_by_id with 404).
5. Create `app/modules/scales/dependencies.py` with `get_scale_service` dependency using `Depends(get_async_session)`.
6. Create `app/modules/scales/api.py` with `ref_scales_router` and two GET endpoints.
7. Add `ref_scales_router` import and `api_v1_router.include_router(ref_scales_router)` to `app/api/v1/router.py`.

**Gotcha:** After B2 is done, run `pnpm generate:api` before implementing any frontend tasks — stale `schema.ts` causes type errors on F1.

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B3] — Doctor endpoints POST/DELETE /doctor/patients/{id}/scales[/{sid}]
**Depends on:** B1

### Exploration
_Explored:_ `2026-05-17` · _Verdict:_ `ready`

**Relevant patterns found:**
- `app/modules/diagnoses/api.py:1-62` — fullest analogue: `require_doctor` + `doctor_service.get_for_user(current_user.id)` (→ profile) + `patient_service.get_for_doctor(patient_id, profile.id)` (→ ownership check) + service call
- `app/modules/medications/api.py:54-66` — `POST` endpoint returning 201, same guard pattern
- `app/modules/diagnoses/api.py:15` — `APIRouter(prefix="/doctor/patients/{patient_id}/diagnoses")` — use `{patient_id}` in prefix to match path param name

**Constraints discovered:**
- `PatientScale.assigned_by` is a FK to `doctor_profiles.id` (not `users.id`) — must use `profile.id` (from `doctor_service.get_for_user(current_user.id)`) not `current_user.id`
- `PatientScale.diagnosis_id` FK → `diagnoses.id` — must validate that the diagnosis belongs to the patient (use `DiagnosisService.get(diagnosis_id)` and check `patient_id`)
- DELETE must verify: (1) patient belongs to doctor, (2) `patient_scale.patient_id == patient_id` — prevents cross-patient deletion
- No `updated_at` on `patient_scales` — DELETE is a hard delete, not soft-delete

**Spec/contract gaps:**
- `PatientScaleCreate` body schema needs: `scale_id: UUID`, `diagnosis_id: UUID`, `frequency_days: int` — not yet defined in any schema file
- Validation of `diagnosis_id` belonging to the patient is implied but not stated in spec; must enforce in service

**Risk areas:**
- `DiagnosisService` must be imported into the scales service/api — adds a cross-module dependency; use the same `Depends` pattern as existing medication endpoints

### Implementation Plan

**Done when:** `POST /api/v1/doctor/patients/{id}/scales` with `{scale_id, diagnosis_id, frequency_days}` returns 201 `PatientScaleOut`. `DELETE /api/v1/doctor/patients/{id}/scales/{sid}` returns 200 `{"ok": true}`. Both return 403 if patient not owned by doctor; 404 if scale_id not found.

**Follows pattern:** `app/modules/diagnoses/api.py:1-62` (require_doctor + profile + patient ownership + service call); `app/modules/medications/api.py:54-66` (POST returning 201)

**Files:**
- `app/modules/scales/repository.py` [MODIFY — add PatientScaleRepository methods]
- `app/modules/scales/service.py` [MODIFY — add PatientScaleService]
- `app/modules/scales/dependencies.py` [MODIFY — add get_patient_scale_service]
- `app/modules/scales/api.py` [MODIFY — add doctor_scales_router]
- `app/api/v1/router.py` [MODIFY — add doctor_scales_router]

**Code structure:**
```python
# repository.py — PatientScaleRepository
class PatientScaleRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, ps: PatientScale) -> PatientScale:
        self._session.add(ps)
        await self._session.flush()
        return ps

    async def get_by_id_with_scale(self, ps_id: UUID) -> PatientScale | None:
        return await self._session.scalar(
            select(PatientScale).where(PatientScale.id == ps_id)
            .options(selectinload(PatientScale.scale))
        )

    async def get_by_patient_and_id(self, patient_id: UUID, ps_id: UUID) -> PatientScale | None:
        return await self._session.scalar(
            select(PatientScale)
            .where(PatientScale.id == ps_id, PatientScale.patient_id == patient_id)
            .options(selectinload(PatientScale.scale))
        )

    async def delete(self, ps: PatientScale) -> None:
        await self._session.delete(ps)
        await self._session.flush()
```

```python
# service.py — PatientScaleService
class PatientScaleService:
    def __init__(self, repository: PatientScaleRepository) -> None:
        self._repository = repository

    async def assign(self, data: PatientScaleCreate, patient_id: UUID, assigned_by: UUID) -> PatientScale:
        ps = PatientScale(
            patient_id=patient_id,
            scale_id=data.scale_id,
            diagnosis_id=data.diagnosis_id,
            frequency_days=data.frequency_days,
            assigned_by=assigned_by,  # doctor_profile.id, NOT user.id
        )
        ps = await self._repository.add(ps)
        result = await self._repository.get_by_id_with_scale(ps.id)
        return result  # type: ignore[return-value]

    async def remove(self, patient_id: UUID, ps_id: UUID) -> None:
        ps = await self._repository.get_by_patient_and_id(patient_id, ps_id)
        if ps is None:
            raise HTTPException(status_code=404, detail="Patient scale not found")
        await self._repository.delete(ps)

    async def get_for_patient(self, patient_id: UUID, ps_id: UUID) -> PatientScale:
        ps = await self._repository.get_by_patient_and_id(patient_id, ps_id)
        if ps is None:
            raise HTTPException(status_code=404, detail="Patient scale not found")
        return ps
```

```python
# api.py — doctor_scales_router
doctor_scales_router = APIRouter(prefix="/doctor/patients/{patient_id}/scales", tags=["doctor-scales"])

@doctor_scales_router.post("", response_model=PatientScaleOut, status_code=status.HTTP_201_CREATED)
async def assign_scale(
    patient_id: UUID,
    body: PatientScaleCreate,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    scale_service: ScaleService = Depends(get_scale_service),
    ps_service: PatientScaleService = Depends(get_patient_scale_service),
) -> PatientScaleOut:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    await scale_service.get_by_id(body.scale_id)   # 404 if scale unknown
    ps = await ps_service.assign(body, patient_id, profile.id)
    return PatientScaleOut.model_validate(ps)

@doctor_scales_router.delete("/{patient_scale_id}", response_model=dict)
async def remove_scale(
    patient_id: UUID,
    patient_scale_id: UUID,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    ps_service: PatientScaleService = Depends(get_patient_scale_service),
) -> dict:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    await ps_service.remove(patient_id, patient_scale_id)
    return {"ok": True}
```

**Step-by-step:**
1. Add `PatientScaleRepository` to `repository.py` with `add`, `get_by_id_with_scale`, `get_by_patient_and_id`, `delete` methods.
2. Add `PatientScaleService` to `service.py` with `assign`, `remove`, `get_for_patient` methods.
3. Add `get_patient_scale_service` to `dependencies.py`.
4. Add `doctor_scales_router` to `api.py` with POST and DELETE endpoints.
5. Import `doctor_scales_router` in `app/api/v1/router.py`; call `api_v1_router.include_router(doctor_scales_router)`.

**Gotcha:** `PatientScale.assigned_by` is FK → `doctor_profiles.id`, not `users.id` — pass `profile.id` (from `doctor_service.get_for_user()`), not `current_user.id`.

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B4] — Patient endpoint POST /patient/tests/{patient_scale_id}/submit
**Depends on:** B1

### Exploration
_Explored:_ `2026-05-17` · _Verdict:_ `ready`
_Decision recorded:_ create minimal `event_log` migration (D3) in Phase 03; B4 emits to it.

**Relevant patterns found:**
- `app/modules/auth/dependencies.py:72` — `require_patient = require_role(UserRole.patient)` is defined and exported but not yet used in any endpoint; B4 will be the first patient-auth endpoint
- `app/modules/auth/__init__.py` — exports `require_patient` — import from here
- `app/modules/medications/service.py:28-42` — pattern for `add()` + `get_with_X()` in the same operation (flush, re-fetch with selectinload)

**Constraints discovered:**
- `Patient.id` cannot be derived from `User.id` via any existing repository method — `PatientRepository` has no `get_by_user_id()` method; `Patient` has `user_id` FK but no reverse-lookup query; must add `get_by_user_id(user_id: UUID)` to `PatientRepository`
- Score is derived as `sum(answer["value"] for answer in answers_json)` — simple sum; no scale-specific scoring weights per spec
- `test_completions.completed_at` is `NOT NULL` with no `server_default` in spec — set to `datetime.now(timezone.utc)` in service at creation time
- `answers_json` JSONB stores `[{"question_id": int, "value": int}]` — matches `TestSubmitIn.answers` shape
- `EventLog` is append-only — no `UPDATE`/`DELETE` at DB level; enforce in SQLAlchemy by providing no update methods
- `event_log.occurred_at` = `completed_at`; `event_log.created_by` = authenticated user's `user_id`; `payload` = `{"test_completion_id": str, "score": int, "scale_code": str}`

**Spec/contract gaps:**
- `PatientRepository.get_by_user_id()` method is missing — needs to be added to `app/modules/patients/repository.py`

**Risk areas:**
- Ownership check: must verify `patient_scale.patient_id == authenticated_patient.id` to prevent cross-patient submissions

### Implementation Plan

**Done when:** Authenticated patient can POST `{"answers":[...], "baseline":false}` to `/api/v1/patient/tests/{patient_scale_id}/submit`; receives 201 `TestCompletionOut`; rows exist in `test_completions` and `event_log` (event_type `test_completed`).

**Follows pattern:** `app/modules/medications/service.py:28-42` (add + re-fetch pattern); `app/modules/auth/dependencies.py:72` (require_patient)

**Files:**
- `app/modules/patients/repository.py` [MODIFY — add get_by_user_id]
- `app/modules/events/repository.py` [CREATE]
- `app/modules/scales/repository.py` [MODIFY — add TestCompletionRepository]
- `app/modules/scales/service.py` [MODIFY — add TestCompletionService.submit]
- `app/modules/scales/dependencies.py` [MODIFY — add get_test_completion_service]
- `app/modules/scales/api.py` [MODIFY — add patient_tests_router]
- `app/api/v1/router.py` [MODIFY — add patient_tests_router]

**Code structure:**
```python
# app/modules/patients/repository.py — add this method to PatientRepository
async def get_by_user_id(self, user_id: UUID) -> Patient | None:
    return await self._session.scalar(
        select(Patient).where(Patient.user_id == user_id)
    )
```

```python
# app/modules/events/repository.py
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.events.models import EventLog

class EventLogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, event: EventLog) -> EventLog:
        self._session.add(event)
        await self._session.flush()
        return event
```

```python
# repository.py — TestCompletionRepository
class TestCompletionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, tc: TestCompletion) -> TestCompletion:
        self._session.add(tc)
        await self._session.flush()
        return tc

    async def get_by_id_with_scale(self, tc_id: UUID) -> TestCompletion | None:
        return await self._session.scalar(
            select(TestCompletion).where(TestCompletion.id == tc_id)
            .options(selectinload(TestCompletion.scale))
        )
```

```python
# service.py — TestCompletionService.submit
from datetime import datetime, timezone

class TestCompletionService:
    def __init__(
        self,
        tc_repo: TestCompletionRepository,
        ps_repo: PatientScaleRepository,
        event_repo: EventLogRepository,
    ) -> None:
        self._tc_repo = tc_repo
        self._ps_repo = ps_repo
        self._event_repo = event_repo

    async def submit(
        self, ps_id: UUID, patient_id: UUID, data: TestSubmitIn, created_by: UUID | None
    ) -> TestCompletion:
        ps = await self._ps_repo.get_by_id_with_scale(ps_id)
        if ps is None or ps.patient_id != patient_id:
            raise HTTPException(status_code=404, detail="Patient scale not found")
        score = sum(a["value"] for a in data.answers)
        now = datetime.now(timezone.utc)
        tc = TestCompletion(
            patient_id=patient_id,
            patient_scale_id=ps_id,
            scale_id=ps.scale_id,
            score=score,
            answers_json=[{"question_id": a["question_id"], "value": a["value"]} for a in data.answers],
            baseline=data.baseline,
            completed_at=now,
        )
        tc = await self._tc_repo.add(tc)
        event = EventLog(
            patient_id=patient_id,
            event_type="test_completed",
            payload={"test_completion_id": str(tc.id), "score": score, "scale_code": ps.scale.code},
            occurred_at=now,
            created_at=now,
            created_by=created_by,
        )
        await self._event_repo.add(event)
        result = await self._tc_repo.get_by_id_with_scale(tc.id)
        return result  # type: ignore[return-value]
```

```python
# api.py — patient_tests_router
patient_tests_router = APIRouter(prefix="/patient/tests", tags=["patient-tests"])

@patient_tests_router.post("/{patient_scale_id}/submit", response_model=TestCompletionOut, status_code=201)
async def submit_test(
    patient_scale_id: UUID,
    body: TestSubmitIn,
    current_user: User = Depends(require_patient),
    patient_repo: PatientRepository = Depends(get_patient_repository),
    tc_service: TestCompletionService = Depends(get_test_completion_service),
) -> TestCompletionOut:
    patient = await patient_repo.get_by_user_id(current_user.id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    tc = await tc_service.submit(patient_scale_id, patient.id, body, created_by=current_user.id)
    return TestCompletionOut.model_validate(tc)
```

**Step-by-step:**
1. Add `get_by_user_id(user_id: UUID)` to `PatientRepository` in `app/modules/patients/repository.py`.
2. Create `app/modules/events/repository.py` with `EventLogRepository.add()`.
3. Add `TestCompletionRepository` to `app/modules/scales/repository.py` with `add` and `get_by_id_with_scale`.
4. Add `TestCompletionService` to `service.py`; inject `TestCompletionRepository`, `PatientScaleRepository`, `EventLogRepository`.
5. `submit()`: verify ownership (`ps.patient_id == patient_id`); compute score as `sum(a["value"] for a in data.answers)`; set `completed_at = datetime.now(timezone.utc)`; flush tc; emit EventLog; re-fetch tc with `selectinload(scale)`.
6. Add `patient_tests_router` to `api.py` with `POST /{patient_scale_id}/submit`.
7. Add `get_patient_repository` dependency to `app/modules/patients/dependencies.py` if not already present.
8. Register `patient_tests_router` in `router.py`.

**Gotcha:** Ownership check (`ps.patient_id != patient_id`) returns 404 not 403 — don't reveal existence of another patient's scale.

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B5] — Patient endpoint GET /patient/history
**Depends on:** B4

### Exploration
_Explored:_ `2026-05-17` · _Verdict:_ `ready`

**Relevant patterns found:**
- `app/modules/medications/api.py:22-32` — `limit`/`offset` query params with `Depends(get_current_user)` — same structure for pagination params
- `app/modules/medications/repository.py:14-19` — `scalars(stmt.limit(limit).offset(offset))` paginated query pattern
- `app/modules/medications/schemas.py:42-57` — `PatientMedicationOut` with nested relationship (`medication: MedicationReferenceOut`) — `TestCompletionOut` needs `scale?: ScaleOut` equivalently

**Constraints discovered:**
- Response format `{"items": [...], "total": int}` is unique in this codebase — no existing `PaginatedResponse` wrapper exists; must define `TestCompletionPage` (or generic) Pydantic schema
- `total` requires a separate `COUNT(*)` query or `len(all_results)` — use a second `select(func.count())` for accuracy under pagination
- Same constraint as B4: `PatientRepository.get_by_user_id()` must exist to resolve patient from `require_patient`
- `TestCompletionOut` should selectinload `Scale` relationship for the `scale?: ScaleOut` field

**Spec/contract gaps:**
- No existing `PaginatedResponse[T]` generic in codebase — introduce a simple `TestCompletionPage` schema with `items: list[TestCompletionOut]` and `total: int`

**Risk areas:**
- Depends on B4 being resolved (particularly the `PatientRepository.get_by_user_id()` addition and `test_completions` table existing)

### Implementation Plan

**Done when:** `GET /api/v1/patient/history` returns 200 `{"items": [...], "total": N}` for an authenticated patient; `items` are `TestCompletionOut` objects with embedded `scale`; empty list when no completions exist.

**Follows pattern:** `app/modules/medications/repository.py:50-56` (paginated list with selectinload); `app/modules/medications/schemas.py:42-57` (nested Out schema)

**Files:**
- `app/modules/scales/repository.py` [MODIFY — add list_by_patient, count_by_patient to TestCompletionRepository]
- `app/modules/scales/service.py` [MODIFY — add TestCompletionService.list_history]
- `app/modules/scales/api.py` [MODIFY — add patient_history_router]
- `app/api/v1/router.py` [MODIFY — add patient_history_router]

**Code structure:**
```python
# repository.py — TestCompletionRepository additions
async def list_by_patient(self, patient_id: UUID, limit: int, offset: int) -> list[TestCompletion]:
    result = await self._session.scalars(
        select(TestCompletion)
        .where(TestCompletion.patient_id == patient_id)
        .options(selectinload(TestCompletion.scale))
        .order_by(TestCompletion.completed_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result)

async def count_by_patient(self, patient_id: UUID) -> int:
    result = await self._session.scalar(
        select(func.count()).select_from(TestCompletion)
        .where(TestCompletion.patient_id == patient_id)
    )
    return result or 0
```

```python
# service.py — TestCompletionService.list_history
async def list_history(
    self, patient_id: UUID, limit: int, offset: int
) -> tuple[list[TestCompletion], int]:
    items = await self._tc_repo.list_by_patient(patient_id, limit, offset)
    total = await self._tc_repo.count_by_patient(patient_id)
    return items, total
```

```python
# api.py — patient_history_router
patient_history_router = APIRouter(prefix="/patient", tags=["patient-history"])

@patient_history_router.get("/history", response_model=TestCompletionPage)
async def get_history(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(require_patient),
    patient_repo: PatientRepository = Depends(get_patient_repository),
    tc_service: TestCompletionService = Depends(get_test_completion_service),
) -> TestCompletionPage:
    patient = await patient_repo.get_by_user_id(current_user.id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    items, total = await tc_service.list_history(patient.id, limit, offset)
    return TestCompletionPage(
        items=[TestCompletionOut.model_validate(tc) for tc in items],
        total=total,
    )
```

**Step-by-step:**
1. Add `list_by_patient(patient_id, limit, offset)` and `count_by_patient(patient_id)` to `TestCompletionRepository` — use `selectinload(TestCompletion.scale)` on list query; separate `func.count()` query for total.
2. Add `list_history()` to `TestCompletionService` — returns `(items, total)` tuple.
3. Add `patient_history_router` to `api.py` with `GET /history`; reuses `get_by_user_id` added in B4.
4. Register `patient_history_router` in `router.py`.

**Note:** `TestCompletionPage` (defined in B2 schemas) is the unique paginated-response wrapper — no generic `PaginatedResponse[T]` exists in the codebase; `TestCompletionPage` with explicit `items` + `total` fields is intentional.

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [F1] — frontend/app/shared/api/scales.ts — API client functions
**Depends on:** B2, B3, B4, B5

### Exploration
_Explored:_ `2026-05-17` · _Verdict:_ `ready`

**Relevant patterns found:**
- `frontend/app/shared/api/medications.ts:1-58` — exact template: named query-key helper object, `useQuery` + `useMutation` + `useQueryClient`, `api.get/post/delete` with `params: { path: {...} }`, types imported via `components['schemas']['TypeName']`
- `frontend/app/shared/api/client.ts` — `api` client instance (already wired up)
- `frontend/app/shared/api/keys.ts` — global key constants (no change needed; add `scalesQueryKeys` in `scales.ts`)

**Constraints discovered:**
- All types must come from `schema.ts` after `pnpm generate:api` — do NOT hand-write `ScaleOut`, `PatientScaleOut`, etc.; import via `components['schemas']`
- `api.delete()` must be used for `DELETE /doctor/patients/{id}/scales/{sid}` — verify the `api` client exposes `.delete()` (check `client.ts`)
- `GET /patient/history` returns `{"items": [...], "total": int}` — response type will be `components['schemas']['TestCompletionPage']` after `generate:api`
- F1 is strictly blocked by B2, B3, B4, B5 completing and `pnpm generate:api` running

**Spec/contract gaps:**
- — (none beyond the B4 event_log question; F1 itself is clear once backend types exist)

**Risk areas:**
- Schema drift: if backend Pydantic schemas don't exactly match the TypeScript interfaces in Contracts, `pnpm typecheck` will catch mismatches but only after `generate:api`

### Implementation Plan

**Done when:** `pnpm typecheck` passes; `frontend/app/shared/api/scales.ts` exports all 7 hooks; all types come from `components['schemas']` (no hand-written interfaces). **Strictly blocked by B2–B6 completing and `pnpm generate:api` running.**

**Follows pattern:** `frontend/app/shared/api/medications.ts:1-58` exactly

**Files:**
- `frontend/app/shared/api/scales.ts` [CREATE]

**Code structure:**
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api/client';
import type { components } from '@shared/types/schema';

type PatientScaleCreate = components['schemas']['PatientScaleCreate'];
type TestSubmitIn = components['schemas']['TestSubmitIn'];

export const scalesQueryKeys = {
    refScales: () => ['scales', 'ref'] as const,
    scaleQuestions: (scaleId: string) => ['scales', 'questions', scaleId] as const,
    patientScales: (patientId: string) => ['scales', 'patient', patientId] as const,
    patientScale: (psId: string) => ['scales', 'patientScale', psId] as const,
    history: () => ['scales', 'history'] as const,
};

export function useScales() {
    return useQuery({
        queryKey: scalesQueryKeys.refScales(),
        queryFn: () => api.get('/api/v1/ref/scales'),
    });
}

export function useScaleQuestions(scaleId: string) {
    return useQuery({
        queryKey: scalesQueryKeys.scaleQuestions(scaleId),
        queryFn: () => api.get('/api/v1/ref/scales/{scale_id}/questions', {
            params: { path: { scale_id: scaleId } },
        }),
        enabled: !!scaleId,
    });
}

export function useAssignScaleMutation(patientId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: PatientScaleCreate) =>
            api.post('/api/v1/doctor/patients/{patient_id}/scales', {
                body: data,
                params: { path: { patient_id: patientId } },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: scalesQueryKeys.patientScales(patientId) });
        },
    });
}

export function useDeleteScaleMutation(patientId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (patientScaleId: string) =>
            api.delete('/api/v1/doctor/patients/{patient_id}/scales/{patient_scale_id}', {
                params: { path: { patient_id: patientId, patient_scale_id: patientScaleId } },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: scalesQueryKeys.patientScales(patientId) });
        },
    });
}

export function useSubmitTestMutation(patientScaleId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: TestSubmitIn) =>
            api.post('/api/v1/patient/tests/{patient_scale_id}/submit', {
                body: data,
                params: { path: { patient_scale_id: patientScaleId } },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: scalesQueryKeys.history() });
        },
    });
}

export function useTestHistory(limit = 20, offset = 0) {
    return useQuery({
        queryKey: scalesQueryKeys.history(),
        queryFn: () => api.get('/api/v1/patient/history', { query: { limit, offset } }),
    });
}

export function usePatientScale(patientScaleId: string) {
    return useQuery({
        queryKey: scalesQueryKeys.patientScale(patientScaleId),
        queryFn: () => api.get('/api/v1/patient/scales/{patient_scale_id}', {
            params: { path: { patient_scale_id: patientScaleId } },
        }),
        enabled: !!patientScaleId,
    });
}
```

**Step-by-step:**
1. Confirm backend is running and B2–B6 are complete.
2. Run `cd frontend && pnpm generate:api` to regenerate `schema.ts` from live OpenAPI spec.
3. Create `frontend/app/shared/api/scales.ts` with `scalesQueryKeys` and all 7 hooks above.
4. Verify path templates (`{scale_id}`, `{patient_id}`, `{patient_scale_id}`) exactly match the OpenAPI operation paths.
5. Run `pnpm typecheck` — fix any path/schema mismatches (root cause: backend schema name differs from TS interface name).

**Gotcha:** Stale `schema.ts` — any type error like "Property X does not exist" means `pnpm generate:api` was not run after the latest API change. Run it first.

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [F2] — AssignTestModal component (doctor assigns scale + frequency)
**Depends on:** F1

### Exploration
_Explored:_ `2026-05-17` · _Verdict:_ `ready`

**Relevant patterns found:**
- `frontend/app/components/doctor/MedicationAssignForm.tsx:1-162` — closest analogue: `useState` for form fields, mutation hook, `onSuccess`/`onCancel` callback props, inline error display, submit button with `isPending` guard
- `frontend/app/routes/doctor/patients.$id.tsx:1-75` — integration point: `useState(false)` toggle for show/hide, renders component conditionally with `patientId` + `onSuccess`/`onCancel` props
- `frontend/app/components/doctor/DiagnosisList.tsx:1-54` — secondary analogue: section card layout, conditional form render, empty state message

**Constraints discovered:**
- `AssignTestModal` requires three inputs: `scale_id` (select from `GET /ref/scales`), `diagnosis_id` (select from patient's existing diagnoses via `useDiagnoses(patientId)`), `frequency_days` (number input)
- Must import `useScales` (from F1) and `useDiagnoses` (from `@shared/api/diagnoses`) — cross-module dependency
- The `patients.$id.tsx` route currently shows no `patient_scales` list; adding the modal also implies showing the current list of assigned scales (fetch from `usePatientScales(patientId)` from F1)
- After successful assignment, invalidate the patient-scales query key

**Spec/contract gaps:**
- PHASE_03.md calls this a "modal" but existing UI uses inline expand-in-place forms; align style with existing UX (inline section) unless a modal overlay is explicitly required

**Risk areas:**
- `useDiagnoses(patientId)` already exists in `@shared/api/diagnoses` — confirm hook name before importing to avoid creating a duplicate

### Implementation Plan

**Done when:** Doctor patient detail page shows an "Assigned Scales" section; clicking "Assign Test" reveals an inline form; submitting creates a `PatientScale` and the list refreshes; form can be cancelled.

**Follows pattern:** `frontend/app/components/doctor/MedicationAssignForm.tsx:1-162` (form with useState, mutation, onSuccess/onCancel props); `frontend/app/routes/doctor/patients.$id.tsx:1-75` (inline toggle pattern)

**Files:**
- `frontend/app/components/doctor/AssignTestModal.tsx` [CREATE]
- `frontend/app/routes/doctor/patients.$id.tsx` [MODIFY — add Assigned Scales section + modal toggle]

**Code structure:**
```typescript
// AssignTestModal.tsx
import { useState } from 'react';
import { useScales, useAssignScaleMutation } from '@shared/api/scales';
import { useDiagnoses } from '@shared/api/diagnoses';  // verify exact hook name before import

interface Props {
    patientId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function AssignTestModal({ patientId, onSuccess, onCancel }: Props) {
    const [scaleId, setScaleId] = useState('');
    const [diagnosisId, setDiagnosisId] = useState('');
    const [frequencyDays, setFrequencyDays] = useState(7);
    const { data: scales = [] } = useScales();
    const { data: diagnoses = [] } = useDiagnoses(patientId);
    const mutation = useAssignScaleMutation(patientId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!scaleId || !diagnosisId) return;
        mutation.mutate(
            { scale_id: scaleId, diagnosis_id: diagnosisId, frequency_days: frequencyDays },
            { onSuccess }
        );
    };

    return (
        <form onSubmit={handleSubmit} className="mt-3 space-y-2 pt-3 border-t border-border">
            <div>
                <label className="block text-xs font-medium mb-1">Scale *</label>
                <select value={scaleId} onChange={e => setScaleId(e.target.value)}
                    className="w-full border border-border rounded px-2 py-1.5 text-xs" required>
                    <option value="">Select scale…</option>
                    {scales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Diagnosis *</label>
                <select value={diagnosisId} onChange={e => setDiagnosisId(e.target.value)}
                    className="w-full border border-border rounded px-2 py-1.5 text-xs" required>
                    <option value="">Select diagnosis…</option>
                    {diagnoses.map(d => <option key={d.id} value={d.id}>{d.icd_code} — {d.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Repeat every (days) *</label>
                <input type="number" min={1} value={frequencyDays}
                    onChange={e => setFrequencyDays(Number(e.target.value))}
                    className="w-24 border border-border rounded px-2 py-1.5 text-xs" required />
            </div>
            {mutation.error && <p className="text-xs text-red-500">Failed to assign scale.</p>}
            <div className="flex gap-2">
                <button type="button" onClick={onCancel}
                    className="px-2 py-1 text-xs border border-border rounded hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={mutation.isPending}
                    className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded disabled:opacity-50">
                    {mutation.isPending ? 'Assigning…' : 'Assign'}
                </button>
            </div>
        </form>
    );
}
```

```typescript
// patients.$id.tsx — additions (inline, at end of existing section list)
const [showAssignTest, setShowAssignTest] = useState(false);
// ... render below existing sections:
<section className="border border-border rounded p-4">
    <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">Assigned Scales</h3>
        {!showAssignTest && (
            <button onClick={() => setShowAssignTest(true)}
                className="text-xs text-primary hover:underline">+ Assign Test</button>
        )}
    </div>
    {showAssignTest && (
        <AssignTestModal patientId={id} onSuccess={() => setShowAssignTest(false)}
            onCancel={() => setShowAssignTest(false)} />
    )}
</section>
```

**Step-by-step:**
1. Check exact export name of the diagnoses hook in `frontend/app/shared/api/diagnoses.ts` before importing (exploration noted `useDiagnoses` — verify).
2. Create `frontend/app/components/doctor/AssignTestModal.tsx` with `Props` interface and form component.
3. Form has three inputs: scale `<select>` (populated from `useScales()`), diagnosis `<select>` (populated from `useDiagnoses(patientId)`), frequency `<input type="number">`.
4. On submit: call `useAssignScaleMutation(patientId).mutate({...})`; on success call `onSuccess`.
5. Modify `patients.$id.tsx`: add `showAssignTest` state toggle and render `AssignTestModal` conditionally below existing sections.

**Gotcha (exploration):** existing UI uses inline expand-in-place forms, not modal overlays — match that pattern (no backdrop/overlay); component is named `AssignTestModal` for traceability but renders inline.

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [F3] — /assessment/:patientScaleId route — multi-step wizard
**Depends on:** F1

### Exploration
_Explored:_ `2026-05-17` · _Verdict:_ `ready`
_Decision recorded:_ B6 (`GET /patient/scales/{patient_scale_id}`) added to scope; F3 calls it to resolve `scale_id`.

**Relevant patterns found:**
- `frontend/app/routes.ts:1-17` — `route('assessment/:patientScaleId', ...)` must be added inside the patient layout block (lines 6-11); file uses colon notation, component uses `$` notation in filename (`assessment.$patientScaleId.tsx`)
- `frontend/app/routes/history.tsx:1-3` — stub route pattern (returns null); `assessment.$patientScaleId.tsx` is a new file (no stub exists)
- SPEC §5.4 — `--color-accent-500: #5B5BD6` is the purple-violet token for assessment UI; use `bg-[#5B5BD6]` or a Tailwind alias for the progress bar

**Constraints discovered:**
- React Router v7 file convention: route file named `assessment.$patientScaleId.tsx`; route registered as `route('assessment/:patientScaleId', ...)` in `routes.ts`
- `useParams<{ patientScaleId: string }>()` to read the ID from the URL
- The wizard is multi-step — must track `currentStep: number` in local state; total steps = number of questions
- Data flow: `usePatientScale(patientScaleId)` → get `scale_id` → `useScaleQuestions(scale_id)` → render questions
- On final step submit: `useSubmitTestMutation(patientScaleId)` from F1 with `{ answers: [...], baseline: false }`

**Spec/contract gaps:**
- Patient home page (`routes/_index.tsx`) currently imports `@pages/home` — no assigned-tests list rendered; patient has no UI entry point to the wizard (out of F3 scope, acceptable for Phase 03 MVP)

**Risk areas:**
- `usePatientScale` and `useScaleQuestions` are two serial async calls before rendering; show a loading state to avoid blank screen

### Implementation Plan

**Done when:** Navigating to `/assessment/{patientScaleId}` renders questions one by one; the purple progress bar advances; completing the final question calls submit and navigates to `/history`. Loading state shown while data fetches.

**Follows pattern:** `frontend/app/routes.ts:1-17` (route registration); `frontend/app/routes/history.tsx` (stub → full route)

**Files:**
- `frontend/app/routes.ts` [MODIFY — add assessment route inside patient layout block]
- `frontend/app/routes/assessment.$patientScaleId.tsx` [CREATE]

**Code structure:**
```typescript
// routes.ts — add inside patient layout block (after 'profile' route)
layout('./layouts/patient-layout.tsx', [
    index('./routes/_index.tsx'),
    route('history', './routes/history.tsx'),
    route('profile', './routes/profile.tsx'),
    route('assessment/:patientScaleId', './routes/assessment.$patientScaleId.tsx'),
]),
```

```typescript
// assessment.$patientScaleId.tsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { usePatientScale, useScaleQuestions, useSubmitTestMutation } from '@shared/api/scales';

export default function AssessmentPage() {
    const { patientScaleId } = useParams<{ patientScaleId: string }>();
    const navigate = useNavigate();
    const { data: patientScale, isLoading: loadingScale } = usePatientScale(patientScaleId!);
    const { data: questions = [], isLoading: loadingQs } = useScaleQuestions(
        patientScale?.scale_id ?? ''
    );  // enabled: !!patientScale?.scale_id (via useScaleQuestions's enabled guard)
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<{ question_id: number; value: number }[]>([]);
    const mutation = useSubmitTestMutation(patientScaleId!);

    if (loadingScale || loadingQs) {
        return <div className="p-6 text-sm text-muted-foreground">Loading assessment…</div>;
    }
    if (!patientScale || questions.length === 0) {
        return <div className="p-6 text-sm text-red-500">Assessment not found.</div>;
    }

    const currentQuestion = questions[step];
    const progressPct = Math.round((step / questions.length) * 100);

    const handleAnswer = (value: number) => {
        const updated = [
            ...answers.filter(a => a.question_id !== currentQuestion.id),
            { question_id: currentQuestion.id, value },
        ];
        setAnswers(updated);
        if (step < questions.length - 1) {
            setStep(s => s + 1);
        } else {
            mutation.mutate(
                { answers: updated, baseline: false },
                { onSuccess: () => navigate('/history') }
            );
        }
    };

    return (
        <div className="max-w-lg mx-auto p-6 space-y-6">
            {/* AssessmentHeader */}
            <div>
                <h1 className="text-base font-semibold">{patientScale.scale?.name}</h1>
                <p className="text-xs text-muted-foreground mb-2">
                    Question {step + 1} of {questions.length}
                </p>
                {/* Purple progress bar — SPEC §5.4 --color-accent-500 */}
                <div className="h-2 w-full bg-gray-200 rounded-full">
                    <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${progressPct}%`, backgroundColor: '#5B5BD6' }}
                    />
                </div>
            </div>
            {/* QuestionCard */}
            <p className="text-sm font-medium">{currentQuestion.text}</p>
            {/* AnswerOptions */}
            <div className="space-y-2">
                {currentQuestion.options.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => handleAnswer(opt.value)}
                        disabled={mutation.isPending}
                        className="w-full text-left border border-border rounded px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            {/* NavButtons — back only */}
            {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                    className="text-xs text-muted-foreground hover:underline">← Back</button>
            )}
            {mutation.error && (
                <p className="text-xs text-red-500">Submission failed. Please try again.</p>
            )}
        </div>
    );
}
```

**Step-by-step:**
1. Add `route('assessment/:patientScaleId', './routes/assessment.$patientScaleId.tsx')` to the patient layout block in `frontend/app/routes.ts` (after the `profile` route, before the closing `]`).
2. Create `frontend/app/routes/assessment.$patientScaleId.tsx` with the full wizard.
3. Data flow: `usePatientScale(patientScaleId)` → get `scale_id` → `useScaleQuestions(scale_id)`. Both hooks have `enabled` guards to prevent calls with empty IDs.
4. Track `step` and `answers` in local state; clicking an answer option advances step.
5. On final question: call `mutation.mutate({answers, baseline:false})` and navigate to `/history` on success.
6. Progress bar: inline `style={{ backgroundColor: '#5B5BD6' }}` for the SPEC §5.4 purple accent.

**Gotcha:** `useScaleQuestions` must have `enabled: !!scaleId` (already in F1 implementation) — without it, the query fires with an empty string and returns 404.

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [F4] — /history route — populate with paginated test completions
**Depends on:** F1

### Exploration
_Explored:_ `2026-05-17` · _Verdict:_ `ready`

**Relevant patterns found:**
- `frontend/app/routes/history.tsx:1-3` — existing stub (just `return null`) — MODIFY this file in place
- `frontend/app/shared/api/medications.ts:22-29` — `useQuery` with a simple query function; `useTestHistory()` will follow the same shape
- `frontend/app/components/doctor/DiagnosisList.tsx:10-53` — card section with list rendering — adapt for test completion items

**Constraints discovered:**
- `GET /patient/history` response shape is `{"items": TestCompletionOut[], "total": int}` — access as `data.items` and `data.total`
- Auth is `patient` role; the hook calls `api.get('/api/v1/patient/history', ...)` — no path params, optional `limit`/`offset` query params
- `TestCompletionOut` includes `completed_at: string` and `score: int` and optionally `scale?: ScaleOut` — display scale name + score + date

**Spec/contract gaps:**
- No pagination UI (next/prev buttons) is specified for MVP — display first page only (default `limit=20` or similar)

**Risk areas:**
- Low risk; this is a read-only display route; the main dependency is F1 (query hook) being available

### Implementation Plan

**Done when:** Patient at `/history` sees a list of past test completions (scale name, score, date); empty state shown when none exist; `pnpm typecheck` passes.

**Follows pattern:** `frontend/app/components/doctor/DiagnosisList.tsx:10-53` (card/list section layout); `frontend/app/shared/api/medications.ts:22-29` (useQuery hook shape)

**Files:**
- `frontend/app/routes/history.tsx` [MODIFY — replace `return null` stub with full implementation]

**Code structure:**
```typescript
// history.tsx — replace existing stub entirely
import { useTestHistory } from '@shared/api/scales';

export default function HistoryPage() {
    const { data, isLoading } = useTestHistory();
    const items = data?.items ?? [];

    if (isLoading) {
        return <div className="p-6 text-sm text-muted-foreground">Loading history…</div>;
    }

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-lg font-semibold">Assessment History</h1>
            {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assessments completed yet.</p>
            ) : (
                <ul className="space-y-2">
                    {items.map(item => (
                        <li key={item.id} className="border border-border rounded p-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">
                                    {item.scale?.name ?? item.scale_id}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(item.completed_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Score: <span className="font-medium text-foreground">{item.score}</span>
                                {item.baseline && ' (baseline)'}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
```

**Step-by-step:**
1. Open `frontend/app/routes/history.tsx` and replace the entire content (currently just `return null`) with the `HistoryPage` component above.
2. Import `useTestHistory` from `@shared/api/scales` (created in F1).
3. Access `data.items` and render each `TestCompletionOut` as a list item with scale name, score, and formatted date.
4. Show empty state text when `items.length === 0`.
5. No pagination UI for MVP — default `limit=20` from `useTestHistory()` handles first page.
6. Run `pnpm typecheck` to confirm `data.items` resolves from `TestCompletionPage.items` correctly.

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [D3] — Alembic migration 0005_event_log
**Depends on:** D1

### Exploration
_Explored:_ `2026-05-17` · _Verdict:_ `ready`
_Added mid-phase:_ resolved B4 open question — Phase 03 creates minimal event_log table; Phase 06 builds full timeline on top.

**Relevant patterns found:**
- `alembic/versions/0003_diagnoses_medications.py:1-85` — migration template: `sa.UUID()`, `sa.DateTime(timezone=True)`, `sa.text("gen_random_uuid()")`, `sa.ForeignKeyConstraint` with `ondelete`
- `alembic/versions/0004_scales_patient_scales.py` (to be created in D1) — `down_revision` will be `"0004_scales_patient_scales"`

**Constraints discovered:**
- `event_log` is append-only per SPEC §5 — no `UPDATE`/`DELETE` should be possible at the DB level; enforced in the SQLAlchemy model by providing no update methods (not a DB constraint, just application convention)
- `created_by` is FK → `users.id` with `ondelete="SET NULL"` — user deletion should not cascade-delete audit records
- `patient_id` is FK → `patients.id` with `ondelete="CASCADE"` — if patient is deleted, their events are deleted too
- `event_type` is plain TEXT (not an enum constraint) — Phase 06 can add more types without a migration

**Spec/contract gaps:**
- — (schema matches SPEC §3 exactly; Phase 03 only uses `test_completed` event type)

**Risk areas:**
- `down_revision` must reference `"0004_scales_patient_scales"` (D1's revision ID); if D1 revision ID differs, the chain breaks

### Implementation Plan

**Done when:** `uv run alembic upgrade head` exits 0; table `event_log` exists with columns `id`, `patient_id`, `event_type`, `payload`, `occurred_at`, `created_at`, `created_by`.

**Follows pattern:** `alembic/versions/0003_diagnoses_medications.py` (migration template); `alembic/versions/0004_scales_patient_scales.py` (D1, sets `down_revision`)

**Files:**
- `alembic/versions/0005_event_log.py` [CREATE]

**Code structure:**
```python
"""Add event_log table (append-only; Phase 06 builds timeline on top)

Revision ID: 0005_event_log
Revises: 0004_scales_patient_scales
Create Date: 2026-05-17
"""

from collections.abc import Sequence
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0005_event_log"
down_revision: str | None = "0004_scales_patient_scales"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

def upgrade() -> None:
    op.create_table(
        "event_log",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("patient_id", sa.UUID(), nullable=False),
        sa.Column("event_type", sa.Text(), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_event_log_patient_id", "event_log", ["patient_id"])

def downgrade() -> None:
    op.drop_index("ix_event_log_patient_id", table_name="event_log")
    op.drop_table("event_log")
```

**Step-by-step:**
1. Create `alembic/versions/0005_event_log.py`; set `revision="0005_event_log"`, `down_revision="0004_scales_patient_scales"`. Add `from sqlalchemy.dialects import postgresql`.
2. `upgrade()`: single `op.create_table("event_log", ...)` with all 7 columns.
3. `patient_id` FK → `patients.id` with `ondelete="CASCADE"` (deleting patient removes their events).
4. `created_by` FK → `users.id` with `ondelete="SET NULL"` (nullable — user deletion preserves audit record).
5. `payload` is nullable JSONB; `occurred_at` and `created_at` are both non-nullable `DateTime(timezone=True)` with **no** server_default (set at application time in B4).
6. `event_type` is plain `Text()` — no CHECK constraint; Phase 06 can add more event types without migration.
7. Add index on `patient_id` for history queries.
8. `downgrade()`: drop index, then drop table.

**Gotcha:** `down_revision` must exactly match D1's `revision` string (`"0004_scales_patient_scales"`). If D1 revision ID changed during authoring, update this value to match.

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B6] — Patient endpoint GET /patient/scales/{patient_scale_id}
**Depends on:** B1

### Exploration
_Explored:_ `2026-05-17` · _Verdict:_ `ready`
_Added mid-phase:_ resolved F3 open question — F3 wizard calls this to get `scale_id` before fetching questions.

**Relevant patterns found:**
- `app/modules/medications/api.py:23-32` — `ref_router.get("", ...)` list pattern; adapt to `patient_router.get("/{patient_scale_id}", ...)` for single-item fetch
- `app/modules/diagnoses/api.py:18-29` — `require_doctor` + ownership check pattern; mirror with `require_patient` + patient ownership check
- `app/modules/medications/repository.py:36-42` — `get_with_X()` using `selectinload` to load nested relation — use same approach to load `PatientScale` with `scale` relationship

**Constraints discovered:**
- Auth is `patient` — use `require_patient`; resolve `Patient` from `User.id` via `PatientRepository.get_by_user_id()` (must be added in B4)
- Ownership: verify `patient_scale.patient_id == authenticated_patient.id` — return 404 if mismatch (don't reveal existence to wrong patient)
- Response is `PatientScaleOut` with embedded `scale: ScaleOut` — `selectinload(PatientScale.scale)` on the query
- This endpoint is patient-auth only — doctors use their own `GET /doctor/patients/{id}/scales` route (not in Phase 03 scope but implied)

**Spec/contract gaps:**
- `GET /doctor/patients/{id}/scales` (list of assigned scales for a patient) is not in Phase 03 scope — the doctor view in F2 only posts/deletes; listing could be added later or the doctor can see it in patient detail

**Risk areas:**
- Shares `PatientRepository.get_by_user_id()` with B4/B5 — implement that helper once in the repository, reference it here; don't duplicate the lookup logic

### Implementation Plan

**Done when:** Authenticated patient can GET `/api/v1/patient/scales/{patient_scale_id}` and receives 200 `PatientScaleOut` with embedded `scale`. Returns 404 for unknown ID or ID belonging to another patient.

**Follows pattern:** `app/modules/medications/repository.py:36-42` (`get_with_medication` selectinload pattern); `app/modules/diagnoses/api.py:18-29` (ownership guard)

**Files:**
- `app/modules/scales/api.py` [MODIFY — add patient_scales_router]
- `app/api/v1/router.py` [MODIFY — add patient_scales_router]

**Code structure:**
```python
# api.py — patient_scales_router
patient_scales_router = APIRouter(prefix="/patient/scales", tags=["patient-scales"])

@patient_scales_router.get("/{patient_scale_id}", response_model=PatientScaleOut)
async def get_patient_scale(
    patient_scale_id: UUID,
    current_user: User = Depends(require_patient),
    patient_repo: PatientRepository = Depends(get_patient_repository),
    ps_service: PatientScaleService = Depends(get_patient_scale_service),
) -> PatientScaleOut:
    patient = await patient_repo.get_by_user_id(current_user.id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    ps = await ps_service.get_for_patient(patient.id, patient_scale_id)
    return PatientScaleOut.model_validate(ps)
```

`PatientScaleService.get_for_patient()` and `PatientScaleRepository.get_by_patient_and_id()` are already defined in B3 — reuse them. `get_by_patient_and_id()` uses `selectinload(PatientScale.scale)` so the embedded `scale` field is populated.

**Step-by-step:**
1. Add `patient_scales_router` to `app/modules/scales/api.py` with `GET /{patient_scale_id}`.
2. Reuse `PatientRepository.get_by_user_id()` added in B4 — no new repository changes needed.
3. Reuse `PatientScaleService.get_for_patient()` added in B3 — no new service changes needed.
4. Register `patient_scales_router` in `app/api/v1/router.py`.

**Note:** This endpoint is patient-auth only. Ownership is enforced in `get_for_patient()` via the `patient_id` filter — a mismatch returns 404 (not 403), consistent with B4.

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [B7] — Doctor endpoint GET /doctor/patients/{id}/scales + DELETE 409 guard
**Depends on:** B1, B3

### Exploration
_Explored:_ `2026-05-17` · _Verdict:_ `ready`

**Relevant patterns found:**
- `app/modules/scales/repository.py:PatientScaleRepository.get_by_patient_and_id` — existing query with `selectinload(PatientScale.scale)` — `list_by_patient` follows the same pattern ordered by `created_at.desc()`
- `app/modules/scales/service.py:PatientScaleService.remove` — injection point for the 409 guard

**Constraints discovered:**
- `test_completions.patient_scale_id ON DELETE CASCADE` (migration 0004) — DB would silently destroy all clinical history if a `patient_scale` is deleted; the guard prevents this at the application layer
- `PatientScaleService` previously accepted only one repo; now requires `TestCompletionRepository` to call `has_completions()` before deletion
- `get_patient_scale_service` dependency must define `get_test_completion_repository` **before** it is referenced — Python evaluates default argument values at import time

**Spec/contract gaps:**
- Original B3 spec did not define a GET list endpoint for the doctor — gap identified post-implementation and addressed here

**Risk areas:**
- Ordering `get_test_completion_repository` before `get_patient_scale_service` in `dependencies.py` — fixed; previously caused `NameError` at import time

### Implementation Plan

**Done when:** `GET /doctor/patients/{id}/scales` returns `PatientScaleOut[]` with embedded `scale`. `DELETE` on a scale with completions returns 409; without completions returns 200 `{"ok": true}`. 6 tests in `tests/test_scales.py` all green.

**Files:**
- `app/modules/scales/repository.py` [MODIFY — `PatientScaleRepository.list_by_patient`, `TestCompletionRepository.has_completions`]
- `app/modules/scales/service.py` [MODIFY — `PatientScaleService.__init__` accepts `tc_repository`; `remove()` calls `has_completions` and raises 409; `list_for_patient()` added]
- `app/modules/scales/dependencies.py` [MODIFY — reorder functions; `get_patient_scale_service` injects `tc_repository`]
- `app/modules/scales/api.py` [MODIFY — add `GET ""` handler to `doctor_scales_router`]
- `tests/test_scales.py` [CREATE]

### Decisions & Notes
**Delete guard rationale:** `ON DELETE CASCADE` on `test_completions.patient_scale_id` would silently destroy completed assessment records when a doctor removes a scale assignment. In a psychiatric monitoring context, completed assessments are irreversible clinical records. The service now raises HTTP 409 if any completions exist, forcing the doctor to acknowledge the situation rather than accidentally erasing history. Future phases may introduce a soft-unassign or archival flow.

---

## [B8] — Patient endpoint GET /patient/scales (list)
**Depends on:** B1, B6

### Exploration
_Explored:_ `2026-05-17` · _Verdict:_ `ready`

**Relevant patterns found:**
- `app/modules/scales/api.py:patient_scales_router` — single-item GET `/{patient_scale_id}` already exists; list endpoint `GET ""` follows the same auth pattern
- `app/modules/scales/service.py:PatientScaleService.list_for_patient` — added alongside B7; reuses `PatientScaleRepository.list_by_patient`

**Constraints discovered:**
- Auth is `patient`; ownership enforced implicitly by filtering on `patient_id` from `get_by_user_id` lookup
- Response is `PatientScaleOut[]` with embedded `scale` — same schema as doctor list endpoint

**Spec/contract gaps:**
- Not in original Phase 03 scope; added as prerequisite for F6 patient home page

**Risk areas:**
- —

### Implementation Plan

**Done when:** Authenticated patient can `GET /api/v1/patient/scales` and receive all their assigned scales with embedded `scale` name/code.

**Files:**
- `app/modules/scales/api.py` [MODIFY — add `GET ""` to `patient_scales_router`]

### Decisions & Notes

---

## [F5] — Doctor patient view: assigned scales list with delete
**Depends on:** B7, F1

### Exploration
_Explored:_ `2026-05-17` · _Verdict:_ `ready`

**Relevant patterns found:**
- `frontend/app/routes/doctor/patients.$id.tsx` — existing section pattern (Medications section lines 63-81) with `useState` toggle and list rendering
- `frontend/app/shared/api/scales.ts:useDeleteScaleMutation` — already exported; just needs `usePatientScales` hook alongside it

**Constraints discovered:**
- `useDeleteScaleMutation` invalidates `scalesQueryKeys.patientScales(patientId)` on success — list auto-refreshes
- 409 error from DELETE must be surfaced to the doctor via `alert()` (simple enough for MVP; toast system not available yet)
- `deleteMutation.isPending` must disable all "Remove" buttons to prevent double-submission during the request

**Spec/contract gaps:**
- —

**Risk areas:**
- Error from `useMutation.onError` carries the raw error object; extracting `.detail` from FastAPI JSON error requires a type assertion

### Implementation Plan

**Done when:** Doctor patient detail page lists assigned scales; each row shows scale name and frequency; "Remove" button calls DELETE; 409 surfaces as alert; list refreshes on success.

**Files:**
- `frontend/app/shared/api/scales.ts` [MODIFY — add `usePatientScales` hook]
- `frontend/app/routes/doctor/patients.$id.tsx` [MODIFY — add list rendering with delete button]

### Decisions & Notes

---

## [F6] — Patient home page: pending assessments list
**Depends on:** B8, F1

### Exploration
_Explored:_ `2026-05-17` · _Verdict:_ `ready`

**Relevant patterns found:**
- `frontend/app/pages/home/index.tsx` — template stub using i18n keys; replaced with patient-specific content
- `frontend/app/routes/assessment.$patientScaleId.tsx` — assessment wizard accepts `/assessment/:id`; home page links here via `<Link to={/assessment/${ps.id}}>`
- `frontend/app/routes/history.tsx` — sibling route; linked from home via "View history →"

**Constraints discovered:**
- SPEC §5.4 purple accent `#5B5BD6` used for the "Start" CTA button (consistent with assessment progress bar)
- The home page is always rendered as patient — no role check needed (layout handles auth)
- `useMyAssignedScales()` calls `GET /patient/scales` — returns all assigned scales including ones with prior completions; this is acceptable for MVP (patient can retake)

**Spec/contract gaps:**
- Phase 08 will replace this minimal list with the full dashboard (TaskCard, StatBar, CareTeamCard, etc.); this implementation is intentionally minimal

**Risk areas:**
- —

### Implementation Plan

**Done when:** Patient home page shows list of assigned scales; each row has scale name, frequency, and a purple "Start" link to `/assessment/:id`; empty state when no scales; link to `/history`.

**Files:**
- `frontend/app/shared/api/scales.ts` [MODIFY — add `useMyAssignedScales` hook]
- `frontend/app/pages/home/index.tsx` [MODIFY — replace template stub]

### Decisions & Notes
**Phase 08 note:** This home page is a MVP stepping stone. Phase 08 will introduce the full patient dashboard with TaskCard components, StatBar, and appointment reminders per SPEC §5.4.
