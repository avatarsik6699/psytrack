from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


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
    created_at: datetime
