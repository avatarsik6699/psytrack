from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DoctorProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    full_name: str
    specialty: str | None
    created_at: datetime
