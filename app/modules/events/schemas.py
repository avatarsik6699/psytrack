from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class EventLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    event_type: str
    payload: dict[str, Any] | None
    occurred_at: datetime
    created_at: datetime
    created_by: UUID | None
