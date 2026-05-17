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
