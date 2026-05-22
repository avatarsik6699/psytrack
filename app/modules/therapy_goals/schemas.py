from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TherapyGoalCreate(BaseModel):
    description: str


class TherapyGoalUpdate(BaseModel):
    description: str | None = None
    is_completed: bool | None = None


class TherapyGoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    description: str
    is_completed: bool
    created_at: datetime
