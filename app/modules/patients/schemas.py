from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


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


class PatientCreatedOut(PatientOut):
    temp_login: str
    temp_password: str
