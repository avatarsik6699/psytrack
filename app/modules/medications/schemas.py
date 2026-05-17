from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class MedicationReferenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    inn: str
    brand_names: list[str]

    @classmethod
    def model_validate(cls, obj, **kwargs):  # type: ignore[override]
        if hasattr(obj, "brand_names") and obj.brand_names is None:
            obj.brand_names = []
        return super().model_validate(obj, **kwargs)


class PatientMedicationCreate(BaseModel):
    medication_id: UUID
    dose_mg: Decimal | None = None
    unit: str | None = None
    frequency: str | None = None
    started_at: date | None = None
    ended_at: date | None = None
    dose_precision: Literal["exact", "approx", "range"] | None = None


class PatientMedicationUpdate(BaseModel):
    dose_mg: Decimal | None = None
    unit: str | None = None
    frequency: str | None = None
    started_at: date | None = None
    ended_at: date | None = None
    dose_precision: Literal["exact", "approx", "range"] | None = None


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
