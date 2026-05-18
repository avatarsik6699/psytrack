from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    task_type: str
    reference_id: UUID | None
    due_at: datetime
    status: Literal["pending", "done", "missed", "snoozed"]
    created_at: datetime
    updated_at: datetime | None
