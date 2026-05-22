from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.scales.models import PatientScale, Scale, TestCompletion


class ScaleRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[Scale]:
        result = await self._session.scalars(select(Scale))
        return list(result)

    async def get_by_id(self, scale_id: UUID) -> Scale | None:
        return await self._session.scalar(select(Scale).where(Scale.id == scale_id))


class PatientScaleRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, ps: PatientScale) -> PatientScale:
        self._session.add(ps)
        await self._session.flush()
        return ps

    async def get_by_id_with_scale(self, ps_id: UUID) -> PatientScale | None:
        return await self._session.scalar(
            select(PatientScale)
            .where(PatientScale.id == ps_id)
            .options(selectinload(PatientScale.scale))
        )

    async def get_by_patient_and_id(self, patient_id: UUID, ps_id: UUID) -> PatientScale | None:
        return await self._session.scalar(
            select(PatientScale)
            .where(PatientScale.id == ps_id, PatientScale.patient_id == patient_id)
            .options(selectinload(PatientScale.scale))
        )

    async def list_by_patient(self, patient_id: UUID) -> list[PatientScale]:
        result = await self._session.scalars(
            select(PatientScale)
            .where(PatientScale.patient_id == patient_id)
            .options(selectinload(PatientScale.scale))
            .order_by(PatientScale.created_at.desc())
        )
        return list(result)

    async def delete(self, ps: PatientScale) -> None:
        await self._session.delete(ps)
        await self._session.flush()


class TestCompletionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, tc: TestCompletion) -> TestCompletion:
        self._session.add(tc)
        await self._session.flush()
        return tc

    async def get_by_id_with_scale(self, tc_id: UUID) -> TestCompletion | None:
        return await self._session.scalar(
            select(TestCompletion)
            .where(TestCompletion.id == tc_id)
            .options(selectinload(TestCompletion.scale))
        )

    async def list_by_patient(
        self, patient_id: UUID, limit: int, offset: int
    ) -> list[TestCompletion]:
        result = await self._session.scalars(
            select(TestCompletion)
            .where(TestCompletion.patient_id == patient_id)
            .options(selectinload(TestCompletion.scale))
            .order_by(TestCompletion.completed_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result)

    async def count_by_patient(self, patient_id: UUID) -> int:
        result = await self._session.scalar(
            select(func.count()).select_from(TestCompletion).where(TestCompletion.patient_id == patient_id)
        )
        return result or 0

    async def has_completions(self, patient_scale_id: UUID) -> bool:
        result = await self._session.scalar(
            select(func.count()).select_from(TestCompletion).where(
                TestCompletion.patient_scale_id == patient_scale_id
            )
        )
        return (result or 0) > 0

    async def list_all_by_patient(self, patient_id: UUID) -> list[TestCompletion]:
        result = await self._session.scalars(
            select(TestCompletion)
            .where(TestCompletion.patient_id == patient_id)
            .options(selectinload(TestCompletion.scale))
            .order_by(TestCompletion.completed_at.asc())
        )
        return list(result)
