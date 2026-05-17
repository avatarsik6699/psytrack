from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ScaleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    score_min: int
    score_max: int
    improvement_direction: str | None


class ScaleQuestion(BaseModel):
    id: int
    text: str
    options: list[dict]


class PatientScaleCreate(BaseModel):
    scale_id: UUID
    diagnosis_id: UUID
    frequency_days: int


class PatientScaleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    diagnosis_id: UUID
    scale_id: UUID
    frequency_days: int
    assigned_by: UUID
    created_at: datetime
    scale: ScaleOut | None = None


class TestSubmitIn(BaseModel):
    answers: list[dict]
    baseline: bool = False


class TestCompletionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    patient_scale_id: UUID
    scale_id: UUID
    score: int
    baseline: bool
    completed_at: datetime
    scale: ScaleOut | None = None


class TestCompletionPage(BaseModel):
    items: list[TestCompletionOut]
    total: int
