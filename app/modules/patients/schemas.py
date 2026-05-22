from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ScoreSnapshot(BaseModel):
    scale_code: str
    scale_name: str
    score: int
    severity_label: str


class MedSummary(BaseModel):
    inn: str
    dose_mg: float | None
    unit: str | None
    frequency: str | None


class PatientCreate(BaseModel):
    full_name: str
    birth_date: date | None = None
    gender: str | None = None


class PatientUpdate(BaseModel):
    full_name: str | None = None
    birth_date: date | None = None
    gender: str | None = None
    email: str | None = None


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
    card_color: Literal["red", "yellow", "green", "gray"] = "gray"
    adherence_percent: float | None = None
    latest_scores: list[ScoreSnapshot] = []
    active_medications_summary: list[MedSummary] = []


class PatientCreatedOut(PatientOut):
    temp_login: str
    temp_password: str


class PatientMeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    email: str | None
    email_verified: bool
    onboarding_complete: bool
    doctor_full_name: str
    doctor_specialty: str | None
