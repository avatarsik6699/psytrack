from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SeDictionaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    uku_code: str
    name_ru: str
    name_en: str
    body_system: str | None
    severity_min: int
    severity_max: int


class SeDictionaryPage(BaseModel):
    items: list[SeDictionaryOut]
    total: int


class PatientSideEffectIn(BaseModel):
    se_id: UUID
    severity: int | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None
    date_precision: Literal["exact", "lt_24h", "month", "year", "range"] | None = None
    duration_label: str | None = None
    notes: str | None = None


class PatientSideEffectUpdate(BaseModel):
    severity: int | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None
    date_precision: Literal["exact", "lt_24h", "month", "year", "range"] | None = None
    duration_label: str | None = None
    resolved: bool | None = None
    notes: str | None = None


class PatientSideEffectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    se_id: UUID
    se: SeDictionaryOut
    severity: int | None
    started_at: datetime | None
    ended_at: datetime | None
    date_precision: str | None
    duration_label: str | None
    resolved: bool
    notes: str | None
    created_at: datetime


class SeMonitoringRuleIn(BaseModel):
    se_id: UUID
    frequency_days: int | None = None


class SeMonitoringRuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    se_id: UUID
    se: SeDictionaryOut
    frequency_days: int | None
    assigned_by: UUID | None
    created_at: datetime


class SeSeverityDataPoint(BaseModel):
    date: str
    se_id: str
    se_name: str
    severity: int
