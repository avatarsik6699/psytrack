from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.diagnoses.models import Diagnosis


class DiagnosisRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, diagnosis: Diagnosis) -> Diagnosis:
        self._session.add(diagnosis)
        await self._session.flush()
        return diagnosis

    async def get_by_id(self, diagnosis_id: UUID) -> Diagnosis | None:
        return await self._session.scalar(
            select(Diagnosis).where(Diagnosis.id == diagnosis_id)
        )

    async def list_by_patient(self, patient_id: UUID) -> list[Diagnosis]:
        result = await self._session.scalars(
            select(Diagnosis)
            .where(Diagnosis.patient_id == patient_id)
            .order_by(Diagnosis.created_at)
        )
        return list(result)
