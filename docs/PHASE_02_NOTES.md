# PHASE 02 — Implementation Notes

<!--
  WHAT to build → docs/PHASE_02.md  (contracts, scope checklist)
  HOW it was built → this file       (plans, decisions, rationale)

  Ownership rules:
  - ### Exploration          — written by agent (/phase-explore). Optional; skip for simple tasks.
  - ### Implementation Plan  — written by agent (/impl-brief). Agent may update only this section.
  - ### Decisions & Notes    — written by human. NEVER overwritten by agent.

  Sync rule: task IDs (D1, D2, B1 … F6) must match the Scope checklist in PHASE_02.md.
  To add an unplanned task discovered mid-phase, run /phase-add-task 02 "description".
  To mark a removed task: prefix its heading with ~~, e.g. ## ~~B3~~ (removed). Do not delete.
-->

_Phase:_ `02` · _Generated:_ `2026-05-16`

---

## [D1] — ORM models: Diagnosis, MedicationReference, PatientMedication
**Depends on:** —

### Exploration
<!-- Optional. Run `/phase-explore 02 D1` to populate. -->

### Implementation Plan

**Done when:** `app/modules/diagnoses/models.py` defines `Diagnosis` and `app/modules/medications/models.py` defines `MedicationReference` + `PatientMedication`; all three classes appear in `Base.metadata.tables` (confirmed by `uv run pytest` creating the tables without error).

**Follows pattern:** `app/modules/doctors/models.py` and `app/modules/patients/models.py`

**Files:**
- create `app/modules/diagnoses/__init__.py`
- create `app/modules/diagnoses/models.py`
- create `app/modules/medications/__init__.py`
- create `app/modules/medications/models.py`

**Code structure:**

```python
# app/modules/diagnoses/models.py
from datetime import date
from uuid import UUID
from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, TimestampMixin, UUIDMixin

class Diagnosis(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "diagnoses"
    patient_id: Mapped[UUID] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    icd_code: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    date_diagnosed: Mapped[date | None] = mapped_column(nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
```

```python
# app/modules/medications/models.py
from datetime import date
from decimal import Decimal
from uuid import UUID
from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDMixin

class MedicationReference(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "medications_reference"
    inn: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    brand_names: Mapped[list | None] = mapped_column(JSONB, nullable=True)

class PatientMedication(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "patient_medications"
    patient_id: Mapped[UUID] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    medication_id: Mapped[UUID] = mapped_column(
        ForeignKey("medications_reference.id", ondelete="RESTRICT"), nullable=False
    )
    dose_mg: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)
    unit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    frequency: Mapped[str | None] = mapped_column(String(100), nullable=True)
    started_at: Mapped[date | None] = mapped_column(nullable=True)
    ended_at: Mapped[date | None] = mapped_column(nullable=True)
    dose_precision: Mapped[str | None] = mapped_column(String(10), nullable=True)
    created_by_role: Mapped[str | None] = mapped_column(String(10), nullable=True)
    medication: Mapped["MedicationReference"] = relationship("MedicationReference", lazy="raise")
```

**Steps:**
1. Create `app/modules/diagnoses/__init__.py` (empty).
2. Create `app/modules/diagnoses/models.py` with `Diagnosis` class above.
3. Create `app/modules/medications/__init__.py` (empty).
4. Create `app/modules/medications/models.py` with `MedicationReference` and `PatientMedication` classes above. Define the `medication` relationship with `lazy="raise"` — callers must use `selectinload` explicitly.
5. Do **not** add imports to `alembic/env.py` or `conftest.py` yet — that's part of D2.

### Decisions & Notes
<!-- Document implementation decisions, deviations from plan, and lessons learned. -->

---

## [D2] — Alembic migration 0003_diagnoses_medications
**Depends on:** D1

### Exploration
<!-- Optional. Run `/phase-explore 02 D2` to populate. -->

### Implementation Plan

**Done when:** `uv run alembic upgrade head` applies `0003_diagnoses_medications` without error, and `diagnoses`, `medications_reference`, and `patient_medications` tables exist in PostgreSQL (verified by the smoke check or `psql` inspection).

**Follows pattern:** `alembic/versions/0002_doctor_profile_patient.py`

**Files:**
- modify `alembic/env.py` (add module imports)
- modify `tests/conftest.py` (add module imports)
- create `alembic/versions/0003_diagnoses_medications.py` (auto-generated, then renamed)

**Steps:**
1. Add to `alembic/env.py` (after existing module imports):
   ```python
   import app.modules.diagnoses  # noqa: F401
   import app.modules.medications  # noqa: F401
   ```
2. Add the same two imports to `tests/conftest.py` (after the existing `import app.modules.patients` line).
3. Run: `uv run alembic revision --autogenerate -m "diagnoses_medications"`
4. Rename the generated file to `alembic/versions/0003_diagnoses_medications.py`.
5. Review the generated SQL — confirm it creates `diagnoses`, `medications_reference`, `patient_medications` with the correct FKs and `CHECK` constraints. Alembic does not auto-generate `CHECK` constraints from Python-level validation; add them manually in the migration if needed (e.g., `dose_precision IN ('exact','approx','range')`).
6. Run `uv run alembic upgrade head` against a running PostgreSQL to verify no errors.

**Migration SQL (reference — confirm against auto-generated output):**
```sql
CREATE TABLE medications_reference (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inn VARCHAR(200) NOT NULL,
    brand_names JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_medications_reference_inn ON medications_reference (inn);

CREATE TABLE diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    icd_code VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    date_diagnosed DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_diagnoses_patient_id ON diagnoses (patient_id);

CREATE TABLE patient_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL REFERENCES medications_reference(id) ON DELETE RESTRICT,
    dose_mg NUMERIC,
    unit VARCHAR(20),
    frequency VARCHAR(100),
    started_at DATE,
    ended_at DATE,
    dose_precision VARCHAR(10) CHECK (dose_precision IN ('exact','approx','range')),
    created_by_role VARCHAR(10) CHECK (created_by_role IN ('doctor','patient')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_patient_medications_patient_id ON patient_medications (patient_id);
```

### Decisions & Notes

---

## [B1] — Patient CRUD module (api + schemas)
**Depends on:** D1

### Exploration
<!-- Optional. Run `/phase-explore 02 B1` to populate. -->

### Implementation Plan

**Done when:** `GET /api/v1/doctor/patients` returns 200 with a list; `POST /api/v1/doctor/patients` returns 201 with `temp_login` and `temp_password` fields; `GET/PATCH /api/v1/doctor/patients/{id}` return 200; `POST /api/v1/doctor/patients/{id}/archive` returns `{"ok": true}`. All return 403 for non-doctor callers.

**Follows pattern:** `app/modules/auth/api.py` (router style) · `app/modules/patients/schemas.py` (Pydantic with `from_attributes=True`)

**Files:**
- modify `app/modules/patients/schemas.py`
- create `app/modules/patients/api.py`

**Schemas to add to `app/modules/patients/schemas.py`:**
```python
from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from uuid import UUID

class PatientCreate(BaseModel):
    full_name: str
    birth_date: date | None = None
    gender: str | None = None

class PatientUpdate(BaseModel):
    full_name: str | None = None
    birth_date: date | None = None
    gender: str | None = None
    email: str | None = None

# Update existing PatientOut to include archived_at:
class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID
    doctor_id: UUID
    full_name: str
    birth_date: date | None
    gender: str | None
    email: str | None
    email_verified: bool
    onboarding_complete: bool
    archived_at: datetime | None
    created_at: datetime

class PatientCreatedOut(PatientOut):
    temp_login: str
    temp_password: str  # plaintext, returned once only
```

**Router (`app/modules/patients/api.py`):**
```python
from fastapi import APIRouter, Depends, status
from uuid import UUID
from app.modules.auth.dependencies import require_doctor
from app.modules.doctors.dependencies import get_doctor_service
from app.modules.doctors.service import DoctorService
from app.modules.patients.dependencies import get_patient_service
from app.modules.patients.schemas import PatientCreate, PatientCreatedOut, PatientOut, PatientUpdate
from app.modules.patients.service import PatientService
from app.modules.users.models import User

router = APIRouter(prefix="/doctor/patients", tags=["doctor-patients"])

@router.get("", response_model=list[PatientOut])
async def list_patients(
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
) -> list[PatientOut]: ...

@router.post("", response_model=PatientCreatedOut, status_code=status.HTTP_201_CREATED)
async def create_patient(body: PatientCreate, ...) -> PatientCreatedOut: ...

@router.get("/{patient_id}", response_model=PatientOut)
async def get_patient(patient_id: UUID, ...) -> PatientOut: ...

@router.patch("/{patient_id}", response_model=PatientOut)
async def update_patient(patient_id: UUID, body: PatientUpdate, ...) -> PatientOut: ...

@router.post("/{patient_id}/archive", status_code=status.HTTP_200_OK)
async def archive_patient(patient_id: UUID, ...) -> dict[str, bool]: ...
```

**Steps:**
1. Update `app/modules/patients/schemas.py`: add `PatientCreate`, `PatientUpdate`, `PatientCreatedOut`; add `archived_at: datetime | None` to existing `PatientOut`.
2. Create `app/modules/patients/api.py` with the router above. Each endpoint:
   - Calls `doctor_service` to look up the `DoctorProfile` for `current_user.id` (raises 404 if missing).
   - Passes `doctor_id=profile.id` to the patient service for all reads/writes.
3. `create_patient` calls `patient_service.create(body, doctor_id)` which returns `(Patient, plaintext_password)` — see B2 for service implementation.
4. All `/{patient_id}` endpoints call `patient_service.get_for_doctor(patient_id, doctor_id)` which raises 404 if not found or 403 if wrong doctor.

### Decisions & Notes

---

## [B2] — Patient repository + service (temp credential generation)
**Depends on:** D1

### Exploration

### Implementation Plan

**Done when:** `patient_service.create(body, doctor_id)` creates a `User` (role=patient) + `Patient` in one transaction and returns `(Patient, plaintext_password)`; `list_by_doctor` returns only patients for the given `doctor_id`; `get_for_doctor` raises `PatientNotFound` (→ 404) if patient doesn't exist or belongs to a different doctor.

**Follows pattern:** `app/modules/doctors/repository.py` and `app/modules/doctors/service.py`

**Files:**
- modify `app/modules/patients/repository.py`
- modify `app/modules/patients/service.py`
- create `app/modules/patients/exceptions.py`

**Repository additions (`app/modules/patients/repository.py`):**
```python
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select
from app.modules.patients.models import Patient

# (add to PatientRepository)
async def list_by_doctor(self, doctor_id: UUID) -> list[Patient]:
    result = await self._session.scalars(
        select(Patient)
        .where(Patient.doctor_id == doctor_id, Patient.archived_at.is_(None))
        .order_by(Patient.full_name)
    )
    return list(result)

async def get_by_id(self, patient_id: UUID) -> Patient | None:
    return await self._session.scalar(select(Patient).where(Patient.id == patient_id))

async def get_by_doctor_and_id(self, doctor_id: UUID, patient_id: UUID) -> Patient | None:
    return await self._session.scalar(
        select(Patient).where(Patient.id == patient_id, Patient.doctor_id == doctor_id)
    )
```

**Exceptions (`app/modules/patients/exceptions.py`):**
```python
from app.core.exceptions import AppException

class PatientNotFound(AppException):
    status_code = 404
    detail = "Patient not found"
```

**Service additions (`app/modules/patients/service.py`):**
```python
import secrets, string
from app.modules.auth.utils import hash_password
from app.modules.users.models import User, UserRole
from app.modules.users.service import UserService  # injected

def _generate_temp_credentials() -> tuple[str, str]:
    alphabet = string.ascii_lowercase + string.digits
    login = ''.join(secrets.choice(alphabet) for _ in range(8))
    password = ''.join(secrets.choice(alphabet) for _ in range(8))
    return login, password

class PatientService:
    def __init__(self, repository, user_service: UserService) -> None: ...

    async def create(self, data: PatientCreate, doctor_id: UUID) -> tuple[Patient, str]:
        temp_login, temp_password = _generate_temp_credentials()
        user = User(role=UserRole.patient, hashed_password=hash_password(temp_password), is_active=True)
        # persist user via user_service or session add
        patient = Patient(
            user_id=user.id, doctor_id=doctor_id,
            full_name=data.full_name, birth_date=data.birth_date, gender=data.gender,
            temp_login=temp_login, temp_password_hash=hash_password(temp_password),
        )
        await self._repository.add(patient)
        return patient, temp_password

    async def list_by_doctor(self, doctor_id: UUID) -> list[Patient]:
        return await self._repository.list_by_doctor(doctor_id)

    async def get_for_doctor(self, patient_id: UUID, doctor_id: UUID) -> Patient:
        patient = await self._repository.get_by_doctor_and_id(doctor_id, patient_id)
        if patient is None:
            raise PatientNotFound()
        return patient

    async def archive(self, patient: Patient) -> Patient:
        patient.archived_at = datetime.now(timezone.utc)
        await self._session.flush()
        return patient
```

**Note on `PatientService` constructor:** `PatientService` currently only takes `repository`. To add `user_service`, update `app/modules/patients/dependencies.py` to inject `UserService` alongside the repository. `UserService` is accessible via `app.modules.users.get_user_service`.

**Steps:**
1. Create `app/modules/patients/exceptions.py`.
2. Add `list_by_doctor`, `get_by_id`, `get_by_doctor_and_id` to `PatientRepository`.
3. Update `PatientService.__init__` to also accept `user_service: UserService`.
4. Add `_generate_temp_credentials`, `create`, `list_by_doctor`, `get_for_doctor`, `archive` to `PatientService`.
5. Update `app/modules/patients/dependencies.py`: inject `UserService` into `get_patient_service`.

### Decisions & Notes

---

## [B3] — Diagnoses module (api, schemas, service, repository)
**Depends on:** D1, B1

### Exploration

### Implementation Plan

**Done when:** `POST /api/v1/doctor/patients/{id}/diagnoses` returns 201 `DiagnosisOut`; `PATCH /api/v1/doctor/patients/{id}/diagnoses/{did}` returns 200. A doctor trying to access a patient belonging to another doctor gets 404. Tests in `tests/test_diagnoses.py` pass.

**Follows pattern:** `app/modules/doctors/` full module layout

**Files:**
- `app/modules/diagnoses/__init__.py` (created in D1, stays empty)
- create `app/modules/diagnoses/schemas.py`
- create `app/modules/diagnoses/repository.py`
- create `app/modules/diagnoses/service.py`
- create `app/modules/diagnoses/dependencies.py`
- create `app/modules/diagnoses/api.py`

**Schemas (`app/modules/diagnoses/schemas.py`):**
```python
from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class DiagnosisCreate(BaseModel):
    icd_code: str
    name: str
    is_primary: bool = False
    date_diagnosed: date | None = None
    notes: str | None = None

class DiagnosisUpdate(BaseModel):
    icd_code: str | None = None
    name: str | None = None
    is_primary: bool | None = None
    date_diagnosed: date | None = None
    notes: str | None = None

class DiagnosisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    patient_id: UUID
    icd_code: str
    name: str
    is_primary: bool
    date_diagnosed: date | None
    notes: str | None
    created_at: datetime
```

**Repository (`app/modules/diagnoses/repository.py`):**
```python
class DiagnosisRepository:
    def __init__(self, session: AsyncSession) -> None: ...
    async def add(self, diagnosis: Diagnosis) -> Diagnosis: ...
    async def get_by_id(self, diagnosis_id: UUID) -> Diagnosis | None: ...
    async def list_by_patient(self, patient_id: UUID) -> list[Diagnosis]: ...
```

**Service (`app/modules/diagnoses/service.py`):**
```python
class DiagnosisService:
    async def create(self, data: DiagnosisCreate, patient_id: UUID) -> Diagnosis: ...
    async def update(self, diagnosis: Diagnosis, data: DiagnosisUpdate) -> Diagnosis: ...
    async def get(self, diagnosis_id: UUID) -> Diagnosis:  # raises DiagnosisNotFound
```

Create `app/modules/diagnoses/exceptions.py` with `DiagnosisNotFound(AppException, status_code=404)`.

**Router (`app/modules/diagnoses/api.py`):**
```python
router = APIRouter(prefix="/doctor/patients/{patient_id}/diagnoses", tags=["diagnoses"])

@router.post("", response_model=DiagnosisOut, status_code=201)
async def create_diagnosis(
    patient_id: UUID,
    body: DiagnosisCreate,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    diagnosis_service: DiagnosisService = Depends(get_diagnosis_service),
) -> DiagnosisOut:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)  # 404 guard
    diagnosis = await diagnosis_service.create(body, patient_id)
    return DiagnosisOut.model_validate(diagnosis)

@router.patch("/{diagnosis_id}", response_model=DiagnosisOut)
async def update_diagnosis(patient_id: UUID, diagnosis_id: UUID, body: DiagnosisUpdate, ...) -> DiagnosisOut: ...
```

**Steps:**
1. Create `app/modules/diagnoses/schemas.py`, `repository.py`, `service.py`, `exceptions.py`, `dependencies.py`, `api.py` following the pattern above.
2. Every endpoint must call `patient_service.get_for_doctor(patient_id, profile.id)` first as an access-control guard. This ensures cross-doctor access returns 404 (not 403, to avoid leaking patient existence).

### Decisions & Notes

---

## [B4] — Medications reference module (GET /ref/medications + seed)
**Depends on:** D1

### Exploration

### Implementation Plan

**Done when:** `GET /api/v1/ref/medications?q=sert` returns a JSON array containing at least sertraline; `GET /api/v1/ref/medications` returns all entries (paginated, default limit 50). Any authenticated user (doctor or patient) can call this endpoint.

**Follows pattern:** `app/modules/doctors/` for module layout; query pattern from `app/modules/patients/repository.py`

**Files:**
- `app/modules/medications/__init__.py` (created in D1)
- create `app/modules/medications/schemas.py`
- create `app/modules/medications/repository.py`
- create `app/modules/medications/service.py`
- create `app/modules/medications/dependencies.py`
- create `app/modules/medications/api.py`
- create `scripts/seed_medications.py`

**Schemas (`app/modules/medications/schemas.py`):**
```python
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class MedicationReferenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    inn: str
    brand_names: list[str]

class PatientMedicationCreate(BaseModel):
    medication_id: UUID
    dose_mg: Decimal | None = None
    unit: str | None = None
    frequency: str | None = None
    started_at: date | None = None
    ended_at: date | None = None
    dose_precision: Literal['exact', 'approx', 'range'] | None = None

class PatientMedicationUpdate(BaseModel):
    dose_mg: Decimal | None = None
    unit: str | None = None
    frequency: str | None = None
    started_at: date | None = None
    ended_at: date | None = None
    dose_precision: Literal['exact', 'approx', 'range'] | None = None

class PatientMedicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    patient_id: UUID
    medication_id: UUID
    medication: MedicationReferenceOut
    dose_mg: Decimal | None
    unit: str | None
    frequency: str | None
    started_at: date | None
    ended_at: date | None
    dose_precision: str | None
    created_by_role: str | None
    created_at: datetime
```

**Repository (`app/modules/medications/repository.py`):**
```python
class MedicationRepository:
    async def search(self, q: str | None, limit: int, offset: int) -> list[MedicationReference]:
        stmt = select(MedicationReference)
        if q:
            stmt = stmt.where(MedicationReference.inn.ilike(f"%{q}%"))
        return list(await self._session.scalars(stmt.limit(limit).offset(offset)))
    async def get_by_id(self, med_id: UUID) -> MedicationReference | None: ...
```

**Router for ref endpoint (`app/modules/medications/api.py`):**
```python
ref_router = APIRouter(prefix="/ref/medications", tags=["reference"])

@ref_router.get("", response_model=list[MedicationReferenceOut])
async def list_medications(
    q: str | None = None,
    limit: int = 50,
    offset: int = 0,
    _current_user: User = Depends(get_current_user),
    medication_service: MedicationService = Depends(get_medication_service),
) -> list[MedicationReferenceOut]: ...
```

**Seed script (`scripts/seed_medications.py`):**
```python
# Run: uv run python scripts/seed_medications.py
# Inserts ≥ 5 common psychiatric medications into medications_reference
SEED_DATA = [
    {"inn": "sertraline", "brand_names": ["Zoloft"]},
    {"inn": "fluoxetine", "brand_names": ["Prozac"]},
    {"inn": "escitalopram", "brand_names": ["Lexapro", "Cipralex"]},
    {"inn": "quetiapine", "brand_names": ["Seroquel"]},
    {"inn": "lithium", "brand_names": ["Lithobid", "Eskalith"]},
]
```

**Steps:**
1. Create schemas, repository, service, dependencies, api files.
2. Create `scripts/seed_medications.py` with the seed data above. Run it once after migration.
3. For tests that need reference medications: add a `medication_ref` fixture in `tests/conftest.py` (or in the test file) that inserts one record into `medications_reference` via `db_session`.

**Gotcha:** `brand_names` is JSONB in PostgreSQL but stored as JSON in SQLite (test DB). SQLite's JSON support is limited. When querying `brand_names`, avoid JSONB-specific operators; use Python-level filtering in tests. The `conftest.py` already patches `visit_JSONB` to fall back to `JSON`.

### Decisions & Notes

---

## [B5] — Doctor medication assignment (POST/PATCH /doctor/patients/{id}/medications)
**Depends on:** D1, B4

### Exploration

### Implementation Plan

**Done when:** `POST /api/v1/doctor/patients/{id}/medications` returns 201 `PatientMedicationOut` with a nested `medication` object; `PATCH /api/v1/doctor/patients/{id}/medications/{mid}` returns 200; cross-doctor access returns 404. Tests pass.

**Follows pattern:** B3 (diagnoses module) — same access-control guard pattern

**Files:**
- add to `app/modules/medications/repository.py` (PatientMedication queries)
- add to `app/modules/medications/service.py` (assignment service methods)
- add to `app/modules/medications/api.py` (doctor assignment router, separate from ref_router)

**PatientMedication repository additions:**
```python
class PatientMedicationRepository:
    async def add(self, pm: PatientMedication) -> PatientMedication:
        self._session.add(pm)
        await self._session.flush()
        await self._session.refresh(pm)  # loads updated_at etc.
        return pm

    async def get_with_medication(self, pm_id: UUID) -> PatientMedication | None:
        return await self._session.scalar(
            select(PatientMedication)
            .where(PatientMedication.id == pm_id)
            .options(selectinload(PatientMedication.medication))
        )

    async def list_by_patient(self, patient_id: UUID) -> list[PatientMedication]:
        return list(await self._session.scalars(
            select(PatientMedication)
            .where(PatientMedication.patient_id == patient_id, PatientMedication.ended_at.is_(None))
            .options(selectinload(PatientMedication.medication))
        ))
```

**Doctor assignment router (add to `app/modules/medications/api.py`):**
```python
doctor_med_router = APIRouter(prefix="/doctor/patients/{patient_id}/medications", tags=["doctor-medications"])

@doctor_med_router.post("", response_model=PatientMedicationOut, status_code=201)
async def assign_medication(patient_id: UUID, body: PatientMedicationCreate, ...) -> PatientMedicationOut:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)  # 404 guard
    pm = PatientMedication(
        patient_id=patient_id,
        medication_id=body.medication_id,
        dose_mg=body.dose_mg, unit=body.unit,
        frequency=body.frequency,
        started_at=body.started_at, ended_at=body.ended_at,
        dose_precision=body.dose_precision,
        created_by_role="doctor",
    )
    pm = await medication_service.add(pm)
    pm_with_ref = await medication_service.get_with_medication(pm.id)
    return PatientMedicationOut.model_validate(pm_with_ref)

@doctor_med_router.patch("/{medication_id}", response_model=PatientMedicationOut)
async def update_medication(patient_id: UUID, medication_id: UUID, body: PatientMedicationUpdate, ...) -> PatientMedicationOut: ...
```

**`selectinload` import:** `from sqlalchemy.orm import selectinload`

**Steps:**
1. Add `PatientMedicationRepository` methods and `selectinload` query to `app/modules/medications/repository.py`.
2. Add assignment service methods to `app/modules/medications/service.py`.
3. Add `doctor_med_router` to `app/modules/medications/api.py` (alongside `ref_router`).
4. Both routers exported from the module and included separately in `app/api/v1/router.py` (B6).

**Gotcha:** `lazy="raise"` on `PatientMedication.medication` means any access without `selectinload` raises `MissingGreenlet` or `DetachedInstanceError`. Always use `get_with_medication` (not `get_by_id`) when serializing `PatientMedicationOut`.

### Decisions & Notes

---

## [B6] — Wire new routers into app/api/v1/router.py
**Depends on:** B1, B3, B4, B5

### Exploration

### Implementation Plan

**Done when:** `uv run uvicorn app.main:app` starts cleanly; `GET /api/v1/doctor/patients` and `GET /api/v1/ref/medications` appear in the OpenAPI docs at `/docs`.

**Follows pattern:** `app/api/v1/router.py` (existing pattern — import router, call `include_router`)

**Files:**
- modify `app/api/v1/router.py`

**Changes to `app/api/v1/router.py`:**
```python
from app.modules.auth.api import router as auth_router
from app.modules.health.api import router as health_router
from app.modules.patients.api import router as patients_router
from app.modules.diagnoses.api import router as diagnoses_router
from app.modules.medications.api import ref_router as med_ref_router
from app.modules.medications.api import doctor_med_router

api_v1_router = APIRouter(prefix=API_V1_PREFIX)
api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(patients_router)
api_v1_router.include_router(diagnoses_router)
api_v1_router.include_router(med_ref_router)
api_v1_router.include_router(doctor_med_router)
```

**Steps:**
1. Add the four new router imports.
2. Add four `include_router` calls.
3. Start the server (`make dev`) and verify `/docs` shows the new endpoints.
4. Optionally regenerate the OpenAPI schema for frontend: `curl http://localhost:8000/openapi.json > frontend/app/shared/types/openapi.json` and re-run `openapi-typescript` if the project uses it (check `frontend/package.json` for the script).

### Decisions & Notes

---

## [B7] — Backend tests (patient CRUD, diagnoses, medications)
**Depends on:** B1, B2, B3, B5

### Exploration

### Implementation Plan

**Done when:** `uv run pytest tests/test_patient_management.py tests/test_diagnoses.py tests/test_medications.py` all pass (green) with aiosqlite in-memory DB.

**Follows pattern:** `tests/test_register_api.py` — use `client: AsyncClient`, `db_session: AsyncSession` fixtures; assert status code + JSON shape; use `db_session` for setup/teardown.

**Files:**
- create `tests/test_patient_management.py`
- create `tests/test_diagnoses.py`
- create `tests/test_medications.py`

**Shared test helper — doctor + JWT setup (add as fixtures or helpers in each test file):**
```python
async def create_doctor_and_get_token(client: AsyncClient) -> tuple[str, dict]:
    """Register a doctor and return (access_token, doctor_payload)."""
    resp = await client.post("/api/v1/public/auth/register", json={
        "email": "doc@test.com", "password": "Pass1234!", "full_name": "Dr Test", "consent_152fz": True
    })
    return resp.json()["access_token"], resp.json()
```

**`tests/test_patient_management.py` — key test cases:**
```python
async def test_create_patient_returns_temp_credentials(client, db_session): ...
    # POST /doctor/patients → 201, has temp_login, temp_password
async def test_list_patients_returns_own_patients(client, db_session): ...
    # create 2 patients, GET → list of 2
async def test_get_patient(client, db_session): ...
    # GET /doctor/patients/{id} → 200 PatientOut
async def test_update_patient(client, db_session): ...
    # PATCH → 200, updated full_name
async def test_archive_patient(client, db_session): ...
    # POST /archive → 200 {"ok": true}, patient no longer in list
async def test_doctor_cannot_access_other_doctors_patient(client, db_session): ...
    # Register 2nd doctor, create patient under doc1, try GET as doc2 → 404
async def test_non_doctor_cannot_create_patient(client, db_session): ...
    # Use patient JWT (from patient_login) → 403
```

**`tests/test_diagnoses.py`:**
```python
async def test_create_diagnosis(client, db_session): ...  # 201, DiagnosisOut
async def test_update_diagnosis(client, db_session): ...  # 200
async def test_cross_doctor_diagnosis_returns_404(client, db_session): ...
```

**`tests/test_medications.py`:**
```python
async def test_list_ref_medications(client, db_session): ...  # 200, list (may be empty in test)
async def test_search_ref_medications(client, db_session): ...  # insert fixture med, search by INN
async def test_assign_medication_to_patient(client, db_session): ...  # 201, PatientMedicationOut
async def test_update_patient_medication(client, db_session): ...  # 200
async def test_cross_doctor_medication_returns_404(client, db_session): ...
```

**Important:** Add `import app.modules.diagnoses` and `import app.modules.medications` to `tests/conftest.py` (done in D2) so that SQLAlchemy includes their tables in `Base.metadata.create_all`.

### Decisions & Notes

---

## [F1] — Patient roster page (/doctor)
**Depends on:** B1

### Exploration

### Implementation Plan

**Done when:** `http://localhost:3000/doctor` renders a list of patient cards (or an empty-state message); a new patient created via F2 appears in the list without a full page reload; all cards show gray color indicator (color logic is Phase 06); no TypeScript errors (`pnpm typecheck`).

**Follows pattern:** `frontend/app/features/auth/login-form.tsx` (React Query mutation pattern) · `frontend/app/shared/api/auth.ts` (useQuery hook pattern)

**Files:**
- modify `frontend/app/routes/doctor/_index.tsx`
- create `frontend/app/components/doctor/PatientCard.tsx`
- create `frontend/app/shared/api/patients.ts` (query hooks — also needed by F2, F3)

**API hooks (`frontend/app/shared/api/patients.ts`):**
```typescript
// Use direct fetch until schema is regenerated; import PatientOut from shared types
import type { PatientOut, PatientCreatedOut } from '@/shared/types/patients';

export const patientQueryKeys = {
  list: ['patients'] as const,
  detail: (id: string) => ['patients', id] as const,
};

export function usePatients() {
  return useQuery({
    queryKey: patientQueryKeys.list,
    queryFn: async () => {
      const token = jwtService.read()?.access_token;
      const res = await fetch('/api/v1/doctor/patients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch patients');
      return res.json() as Promise<PatientOut[]>;
    },
  });
}
```

Create `frontend/app/shared/types/patients.ts` with manually typed interfaces matching the Phase 02 contracts (camelCase, matching the FastAPI response — note FastAPI returns snake_case by default unless aliases are set; verify actual response keys from backend).

**`PatientCard` component:**
```tsx
// frontend/app/components/doctor/PatientCard.tsx
interface PatientCardProps { patient: PatientOut; onClick?: () => void; }

export function PatientCard({ patient, onClick }: PatientCardProps) {
  return (
    <div
      className="flex items-center gap-3 p-4 bg-white rounded-lg border border-border
                 shadow-(--shadow-sm) cursor-pointer hover:shadow-(--shadow-md) transition-shadow"
      onClick={onClick}
    >
      <div className="w-1 self-stretch rounded-full bg-gray-300" /> {/* Phase 06 color */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{patient.full_name}</p>
        <p className="text-xs text-gray-500">{patient.birth_date ?? '—'}</p>
      </div>
    </div>
  );
}
```

**Roster route (`frontend/app/routes/doctor/_index.tsx`):**
```tsx
import { useNavigate } from 'react-router';
import { useState } from 'react';
import { usePatients } from '@shared/api/patients';
import { PatientCard } from '@/components/doctor/PatientCard';
import { AddPatientModal } from '@/components/doctor/AddPatientModal';

export default function DoctorIndexRoute() {
  const { data: patients = [], isLoading } = usePatients();
  const [showAdd, setShowAdd] = useState(false);
  const navigate = useNavigate();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-semibold">Patients</h1>
        <button onClick={() => setShowAdd(true)}>+ Add Patient</button>
      </div>
      {patients.length === 0
        ? <p className="text-muted-foreground">No patients yet.</p>
        : <div className="grid gap-3">{patients.map(p =>
            <PatientCard key={p.id} patient={p} onClick={() => navigate(`/doctor/patients/${p.id}`)} />
          )}</div>
      }
      {showAdd && <AddPatientModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
```

**Steps:**
1. Create `frontend/app/shared/types/patients.ts` with `PatientOut`, `PatientCreatedOut` interfaces.
2. Create `frontend/app/shared/api/patients.ts` with `usePatients` and `patientQueryKeys`.
3. Create `frontend/app/components/doctor/PatientCard.tsx`.
4. Replace the body of `frontend/app/routes/doctor/_index.tsx` with the roster implementation above.

### Decisions & Notes

---

## [F2] — Add patient modal (form + temp credential display)
**Depends on:** B1

### Exploration

### Implementation Plan

**Done when:** Clicking "+ Add Patient" opens a modal; filling the form and submitting creates a patient via `POST /doctor/patients`; the modal then displays the `temp_login` and `temp_password` with a copy-to-clipboard button; closing the modal invalidates the patient list query so the new patient appears; `pnpm typecheck` passes.

**Follows pattern:** `frontend/app/features/auth/login-form.tsx` (form + useMutation pattern)

**Files:**
- create `frontend/app/components/doctor/AddPatientModal.tsx`
- modify `frontend/app/shared/api/patients.ts` (add `useCreatePatientMutation`)

**Mutation hook (add to `frontend/app/shared/api/patients.ts`):**
```typescript
export function useCreatePatientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { full_name: string; birth_date?: string; gender?: string }) => {
      const token = jwtService.read()?.access_token;
      const res = await fetch('/api/v1/doctor/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create patient');
      return res.json() as Promise<PatientCreatedOut>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.list });
    },
  });
}
```

**`AddPatientModal` component — two phases: form, then credentials display:**
```tsx
type Step = 'form' | 'credentials';

export function AddPatientModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('form');
  const [created, setCreated] = useState<PatientCreatedOut | null>(null);
  const mutation = useCreatePatientMutation();

  // form fields: full_name (required), birth_date (date input), gender (select: male/female/other)
  // onSubmit: mutation.mutate(data), onSuccess: setCreated(result); setStep('credentials')

  if (step === 'credentials' && created) {
    return (
      <ModalOverlay>
        <h2>Patient created</h2>
        <p>Share these credentials with the patient. They will not be shown again.</p>
        <CopyField label="Login" value={created.temp_login} />
        <CopyField label="Password" value={created.temp_password} />
        <button onClick={onClose}>Done</button>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2>Add Patient</h2>
      {/* form with full_name, birth_date, gender inputs */}
      <button type="submit" disabled={mutation.isPending}>Create</button>
    </ModalOverlay>
  );
}
```

**`ModalOverlay`**: a simple `<div>` with a backdrop overlay using Tailwind — `fixed inset-0 bg-black/40 flex items-center justify-center z-50`. Inner content: `bg-white rounded-(--radius-xl) p-6 shadow-(--shadow-lg) w-[400px]`.

**`CopyField`**: displays value in a monospace box with a "Copy" button that calls `navigator.clipboard.writeText(value)`.

**Steps:**
1. Add `useCreatePatientMutation` to `frontend/app/shared/api/patients.ts`.
2. Create `frontend/app/components/doctor/AddPatientModal.tsx` with form + credentials display.
3. Import and render in `frontend/app/routes/doctor/_index.tsx` (already referenced in F1 plan).

### Decisions & Notes

---

## [F3] — Patient detail shell (/doctor/patients/:id)
**Depends on:** B1, B2

### Exploration

### Implementation Plan

**Done when:** Navigating to `/doctor/patients/:id` renders the patient's name, birth date, gender; an "Edit" button toggles inline editing; "Archive" with confirmation calls `POST /archive`; the page redirects to `/doctor` after archiving. `pnpm typecheck` passes.

**Follows pattern:** `frontend/app/routes/doctor/_index.tsx` (React Router v7 route with React Query)

**Files:**
- modify `frontend/app/routes.ts` (add patient detail route)
- create `frontend/app/routes/doctor/patients.$id.tsx`
- create `frontend/app/components/doctor/PatientHeader.tsx`
- modify `frontend/app/shared/api/patients.ts` (add `usePatient`, `useUpdatePatient`, `useArchivePatient`)

**Route registration (modify `frontend/app/routes.ts`):**
```typescript
layout('./layouts/doctor-layout.tsx', [
  route('doctor', './routes/doctor/_index.tsx'),
  route('doctor/patients/:id', './routes/doctor/patients.$id.tsx'),
]),
```

**Hooks (add to `frontend/app/shared/api/patients.ts`):**
```typescript
export function usePatient(id: string) {
  return useQuery({
    queryKey: patientQueryKeys.detail(id),
    queryFn: async () => {
      const token = jwtService.read()?.access_token;
      const res = await fetch(`/api/v1/doctor/patients/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Patient not found');
      return res.json() as Promise<PatientOut>;
    },
  });
}

export function useUpdatePatientMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PatientOut>) => { /* PATCH */ },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: patientQueryKeys.detail(id) }),
  });
}

export function useArchivePatientMutation(id: string) {
  return useMutation({
    mutationFn: async () => { /* POST /archive */ },
  });
}
```

**Route component (`frontend/app/routes/doctor/patients.$id.tsx`):**
```tsx
import { useParams, useNavigate } from 'react-router';

export default function PatientDetailRoute() {
  const { id } = useParams<{ id: string }>();
  const { data: patient, isLoading } = usePatient(id!);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const updateMutation = useUpdatePatientMutation(id!);
  const archiveMutation = useArchivePatientMutation(id!);

  if (isLoading) return <div>Loading...</div>;
  if (!patient) return <div>Patient not found</div>;

  return (
    <div className="p-6 space-y-6">
      <PatientHeader patient={patient} onEdit={() => setEditing(true)} onArchive={() => {
        if (confirm(`Archive ${patient.full_name}?`)) {
          archiveMutation.mutate(undefined, { onSuccess: () => navigate('/doctor') });
        }
      }} />
      {/* Diagnosis and medication sections rendered by F4, F5 */}
    </div>
  );
}
```

**`PatientHeader` component:**
```tsx
// frontend/app/components/doctor/PatientHeader.tsx
export function PatientHeader({ patient, onEdit, onArchive }: { patient: PatientOut; onEdit: () => void; onArchive: () => void; }) {
  return (
    <div className="flex items-start justify-between bg-white p-6 rounded-(--radius-lg) border border-border">
      <div>
        <h1 className="text-2xl font-semibold">{patient.full_name}</h1>
        <p className="text-sm text-muted-foreground">{patient.birth_date} · {patient.gender ?? '—'}</p>
        {patient.archived_at && <span className="text-xs text-danger-500">Archived</span>}
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit}>Edit</button>
        {!patient.archived_at && <button onClick={onArchive} className="text-danger">Archive</button>}
      </div>
    </div>
  );
}
```

**Steps:**
1. Add `usePatient`, `useUpdatePatientMutation`, `useArchivePatientMutation` to `patients.ts`.
2. Create `frontend/app/routes/doctor/patients.$id.tsx`.
3. Create `frontend/app/components/doctor/PatientHeader.tsx`.
4. Add the `doctor/patients/:id` route to `frontend/app/routes.ts`.

### Decisions & Notes

---

## [F4] — Diagnoses section within patient detail
**Depends on:** B3, F3

### Exploration

### Implementation Plan

**Done when:** The patient detail page shows a "Diagnoses" section listing all diagnoses; an "+ Add" button opens an inline form; submitting creates a diagnosis via `POST /doctor/patients/{id}/diagnoses` and the list refreshes; the `is_primary` checkbox is visible and functionally set. `pnpm typecheck` passes.

**Follows pattern:** F2 (`AddPatientModal` — mutation + form pattern) · F1 (`usePatients` — list query pattern)

**Files:**
- create `frontend/app/shared/api/diagnoses.ts`
- create `frontend/app/components/doctor/DiagnosisList.tsx`
- create `frontend/app/components/doctor/DiagnosisForm.tsx`
- modify `frontend/app/routes/doctor/patients.$id.tsx` (import and render the section)

**Types (`frontend/app/shared/types/patients.ts` — add):**
```typescript
export interface DiagnosisOut {
  id: string;
  patient_id: string;
  icd_code: string;
  name: string;
  is_primary: boolean;
  date_diagnosed: string | null;
  notes: string | null;
  created_at: string;
}
```

**Hooks (`frontend/app/shared/api/diagnoses.ts`):**
```typescript
export const diagnosisQueryKeys = {
  list: (patientId: string) => ['diagnoses', patientId] as const,
};

export function useDiagnoses(patientId: string) {
  return useQuery({
    queryKey: diagnosisQueryKeys.list(patientId),
    queryFn: async () => { /* GET /doctor/patients/{id}/diagnoses */ },
  });
}

export function useCreateDiagnosisMutation(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { icd_code: string; name: string; is_primary?: boolean; date_diagnosed?: string; notes?: string }) => {
      /* POST /doctor/patients/{patientId}/diagnoses */
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: diagnosisQueryKeys.list(patientId) }),
  });
}

export function useUpdateDiagnosisMutation(patientId: string, diagnosisId: string) { /* PATCH */ }
```

**Note:** The backend returns snake_case JSON (FastAPI default). The type interfaces should use `snake_case` to match the actual response, not camelCase. The TypeScript type in Phase 02 contracts uses camelCase for documentation purposes, but the actual implementation should match whatever the API returns.

**`DiagnosisList` component:**
```tsx
export function DiagnosisList({ patientId }: { patientId: string }) {
  const { data: diagnoses = [] } = useDiagnoses(patientId);
  const [adding, setAdding] = useState(false);

  return (
    <section className="bg-white rounded-(--radius-lg) border border-border p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-sm">Diagnoses</h2>
        <button className="text-xs text-primary" onClick={() => setAdding(true)}>+ Add</button>
      </div>
      {diagnoses.map(d => (
        <div key={d.id} className="flex items-center justify-between py-2 border-t border-border first:border-0">
          <div>
            <span className="font-mono text-xs text-gray-500 mr-2">{d.icd_code}</span>
            <span className="text-sm">{d.name}</span>
            {d.is_primary && <span className="ml-2 text-xs text-primary">Primary</span>}
          </div>
        </div>
      ))}
      {adding && (
        <DiagnosisForm
          patientId={patientId}
          onSuccess={() => setAdding(false)}
          onCancel={() => setAdding(false)}
        />
      )}
    </section>
  );
}
```

**`DiagnosisForm` component:** controlled form with `icd_code`, `name`, `is_primary` (checkbox), `date_diagnosed` (date input), `notes` (textarea); calls `useCreateDiagnosisMutation`.

**Steps:**
1. Add `DiagnosisOut` to `frontend/app/shared/types/patients.ts`.
2. Create `frontend/app/shared/api/diagnoses.ts` with query/mutation hooks.
3. Create `DiagnosisList.tsx` and `DiagnosisForm.tsx`.
4. Import and render `<DiagnosisList patientId={id!} />` in `patients.$id.tsx` below `PatientHeader`.

### Decisions & Notes

---

## [F5] — Medication assignment section within patient detail
**Depends on:** B4, B5, F3

### Exploration

### Implementation Plan

**Done when:** The patient detail page shows a "Medications" section; a typeahead input searches `GET /ref/medications?q=...` and lets the doctor pick a medication; submitting the form calls `POST /doctor/patients/{id}/medications` and the list refreshes with the new row (including `inn`, `dose_mg`, `frequency`). `pnpm typecheck` passes.

**Follows pattern:** F4 (DiagnosisList/DiagnosisForm structure)

**Files:**
- create `frontend/app/shared/api/medications.ts`
- create `frontend/app/components/doctor/MedicationAssignForm.tsx`
- modify `frontend/app/routes/doctor/patients.$id.tsx` (render medication section)

**Types (add to `frontend/app/shared/types/patients.ts`):**
```typescript
export interface MedicationReferenceOut {
  id: string;
  inn: string;
  brand_names: string[];
}

export interface PatientMedicationOut {
  id: string;
  patient_id: string;
  medication_id: string;
  medication: MedicationReferenceOut;
  dose_mg: number | null;
  unit: string | null;
  frequency: string | null;
  started_at: string | null;
  ended_at: string | null;
  dose_precision: 'exact' | 'approx' | 'range' | null;
  created_by_role: string | null;
  created_at: string;
}
```

**Hooks (`frontend/app/shared/api/medications.ts`):**
```typescript
export const medicationQueryKeys = {
  ref: (q?: string) => ['medications', 'ref', q ?? ''] as const,
  patientMeds: (patientId: string) => ['medications', 'patient', patientId] as const,
};

export function useMedicationSearch(q: string) {
  return useQuery({
    queryKey: medicationQueryKeys.ref(q),
    queryFn: async () => { /* GET /ref/medications?q={q} */ },
    enabled: q.length >= 2,  // only search when user has typed ≥ 2 chars
  });
}

export function usePatientMedications(patientId: string) {
  return useQuery({
    queryKey: medicationQueryKeys.patientMeds(patientId),
    queryFn: async () => { /* GET /doctor/patients/{patientId}/medications */ },
  });
}

export function useAssignMedicationMutation(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { medication_id: string; dose_mg?: number; unit?: string; frequency?: string; dose_precision?: string }) => {
      /* POST /doctor/patients/{patientId}/medications */
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: medicationQueryKeys.patientMeds(patientId) }),
  });
}
```

**`MedicationAssignForm` — typeahead pattern:**
```tsx
export function MedicationAssignForm({ patientId, onSuccess, onCancel }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<MedicationReferenceOut | null>(null);
  const [doseMg, setDoseMg] = useState('');
  const [unit, setUnit] = useState('mg');
  const [frequency, setFrequency] = useState('');
  const { data: results = [] } = useMedicationSearch(query);
  const mutation = useAssignMedicationMutation(patientId);

  // Show dropdown of results when query.length >= 2 and no item selected
  // On select: set selected, clear query, hide dropdown
  // On submit: mutation.mutate({ medication_id: selected.id, dose_mg: parseFloat(doseMg), unit, frequency })
}
```

**Medication list rendering (add to `patients.$id.tsx`):**
```tsx
<section className="bg-white rounded-(--radius-lg) border border-border p-4">
  <div className="flex justify-between items-center mb-3">
    <h2 className="font-semibold text-sm">Medications</h2>
    <button className="text-xs text-primary" onClick={() => setAddingMed(true)}>+ Assign</button>
  </div>
  {meds.map(m => (
    <div key={m.id} className="py-2 border-t border-border first:border-0 text-sm">
      <span className="font-medium">{m.medication.inn}</span>
      {m.dose_mg && <span className="text-gray-500 ml-2">{m.dose_mg} {m.unit}</span>}
      {m.frequency && <span className="text-gray-500 ml-2">· {m.frequency}</span>}
    </div>
  ))}
  {addingMed && <MedicationAssignForm patientId={id!} onSuccess={() => setAddingMed(false)} onCancel={() => setAddingMed(false)} />}
</section>
```

**Steps:**
1. Add `MedicationReferenceOut`, `PatientMedicationOut` to `frontend/app/shared/types/patients.ts`.
2. Create `frontend/app/shared/api/medications.ts` with hooks.
3. Create `frontend/app/components/doctor/MedicationAssignForm.tsx`.
4. Add `usePatientMedications` call and medication section rendering to `patients.$id.tsx`.

### Decisions & Notes

---

## [F6] — API service layer (patients.ts, diagnoses.ts, medications.ts)
**Depends on:** B1, B3, B4, B5

### Exploration

### Implementation Plan

**Done when:** All hooks used in F1–F5 are defined and exported from their respective service files; `pnpm typecheck` reports zero errors in the service files; no raw `fetch` calls exist outside the service files (components only import hooks, not fetch directly).

**Follows pattern:** `frontend/app/shared/api/auth.ts` (useQuery + useMutation pattern, token injection via `jwtService`)

**Files:** (all created inline during F1–F5 — this task is a consolidation/verification step)
- `frontend/app/shared/api/patients.ts`
- `frontend/app/shared/api/diagnoses.ts`
- `frontend/app/shared/api/medications.ts`
- `frontend/app/shared/types/patients.ts`

**Shared fetch helper (add to `frontend/app/shared/api/patients.ts` or a new `frontend/app/shared/api/internal-fetch.ts`):**
```typescript
import { jwtService } from '@shared/services/jwt-service';
import { queryClient } from '@shared/api/query-client';

export async function authedFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = jwtService.readAccessToken(queryClient);
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => res.statusText);
    throw Object.assign(new Error('API error'), { status: res.status, detail });
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
```

This helper mirrors the auth-header logic in `frontend/app/shared/api/client.ts` but without the schema-type constraint, allowing use with Phase 02 endpoints before schema regeneration.

**Checklist for F6 sign-off:**
- [ ] `patients.ts` exports: `usePatients`, `usePatient`, `useCreatePatientMutation`, `useUpdatePatientMutation`, `useArchivePatientMutation`, `patientQueryKeys`
- [ ] `diagnoses.ts` exports: `useDiagnoses`, `useCreateDiagnosisMutation`, `useUpdateDiagnosisMutation`, `diagnosisQueryKeys`
- [ ] `medications.ts` exports: `useMedicationSearch`, `usePatientMedications`, `useAssignMedicationMutation`, `useUpdatePatientMedicationMutation`, `medicationQueryKeys`
- [ ] `patients.ts` type file exports: `PatientOut`, `PatientCreatedOut`, `DiagnosisOut`, `MedicationReferenceOut`, `PatientMedicationOut`
- [ ] `pnpm typecheck` passes with no errors

**Note on schema regeneration:** Once B6 is complete and the backend is running, regenerate the OpenAPI schema to get full type safety for new endpoints in the schema-typed `api` client. Until then, use `authedFetch`.

### Decisions & Notes
