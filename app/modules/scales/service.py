from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException

from app.modules.events.models import EventLog
from app.modules.events.repository import EventLogRepository
from app.modules.scales.models import PatientScale, TestCompletion
from app.modules.scales.repository import (
    PatientScaleRepository,
    ScaleRepository,
    TestCompletionRepository,
)
from app.modules.scales.schemas import PatientScaleCreate, TestSubmitIn


class ScaleService:
    def __init__(self, repository: ScaleRepository) -> None:
        self._repository = repository

    async def list_all(self):
        return await self._repository.list_all()

    async def get_by_id(self, scale_id: UUID):
        scale = await self._repository.get_by_id(scale_id)
        if scale is None:
            raise HTTPException(status_code=404, detail="Scale not found")
        return scale


class PatientScaleService:
    def __init__(
        self,
        repository: PatientScaleRepository,
        tc_repository: TestCompletionRepository,
    ) -> None:
        self._repository = repository
        self._tc_repository = tc_repository

    async def assign(
        self, data: PatientScaleCreate, patient_id: UUID, assigned_by: UUID
    ) -> PatientScale:
        ps = PatientScale(
            patient_id=patient_id,
            scale_id=data.scale_id,
            diagnosis_id=data.diagnosis_id,
            frequency_days=data.frequency_days,
            assigned_by=assigned_by,
        )
        ps = await self._repository.add(ps)
        result = await self._repository.get_by_id_with_scale(ps.id)
        return result  # type: ignore[return-value]

    async def remove(self, patient_id: UUID, ps_id: UUID) -> None:
        ps = await self._repository.get_by_patient_and_id(patient_id, ps_id)
        if ps is None:
            raise HTTPException(status_code=404, detail="Patient scale not found")
        # Protect completed clinical assessments from accidental deletion.
        # ON DELETE CASCADE would silently destroy test history — block instead.
        if await self._tc_repository.has_completions(ps_id):
            raise HTTPException(
                status_code=409,
                detail="Cannot remove scale: it has completed assessments. Archive the patient or contact support.",
            )
        await self._repository.delete(ps)

    async def get_for_patient(self, patient_id: UUID, ps_id: UUID) -> PatientScale:
        ps = await self._repository.get_by_patient_and_id(patient_id, ps_id)
        if ps is None:
            raise HTTPException(status_code=404, detail="Patient scale not found")
        return ps

    async def list_for_patient(self, patient_id: UUID) -> list[PatientScale]:
        return await self._repository.list_by_patient(patient_id)


class TestCompletionService:
    def __init__(
        self,
        tc_repo: TestCompletionRepository,
        ps_repo: PatientScaleRepository,
        event_repo: EventLogRepository,
    ) -> None:
        self._tc_repo = tc_repo
        self._ps_repo = ps_repo
        self._event_repo = event_repo

    async def submit(
        self,
        ps_id: UUID,
        patient_id: UUID,
        data: TestSubmitIn,
        created_by: UUID | None,
    ) -> TestCompletion:
        ps = await self._ps_repo.get_by_id_with_scale(ps_id)
        if ps is None or ps.patient_id != patient_id:
            raise HTTPException(status_code=404, detail="Patient scale not found")

        score = sum(a["value"] for a in data.answers)
        now = datetime.now(timezone.utc)

        tc = TestCompletion(
            patient_id=patient_id,
            patient_scale_id=ps_id,
            scale_id=ps.scale_id,
            score=score,
            answers_json=[{"question_id": a["question_id"], "value": a["value"]} for a in data.answers],
            baseline=data.baseline,
            completed_at=now,
        )
        tc = await self._tc_repo.add(tc)

        event = EventLog(
            patient_id=patient_id,
            event_type="test_completed",
            payload={"test_completion_id": str(tc.id), "score": score, "scale_code": ps.scale.code},
            occurred_at=now,
            created_at=now,
            created_by=created_by,
        )
        await self._event_repo.add(event)

        result = await self._tc_repo.get_by_id_with_scale(tc.id)
        return result  # type: ignore[return-value]

    async def list_history(
        self, patient_id: UUID, limit: int, offset: int
    ) -> tuple[list[TestCompletion], int]:
        items = await self._tc_repo.list_by_patient(patient_id, limit, offset)
        total = await self._tc_repo.count_by_patient(patient_id)
        return items, total
