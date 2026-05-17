from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.medications.models import MedicationReference, PatientMedication


class MedicationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def search(self, q: str | None, limit: int, offset: int) -> list[MedicationReference]:
        stmt = select(MedicationReference)
        if q:
            stmt = stmt.where(MedicationReference.inn.ilike(f"%{q}%"))
        result = await self._session.scalars(stmt.limit(limit).offset(offset))
        return list(result)

    async def get_by_id(self, med_id: UUID) -> MedicationReference | None:
        return await self._session.scalar(
            select(MedicationReference).where(MedicationReference.id == med_id)
        )


class PatientMedicationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, pm: PatientMedication) -> PatientMedication:
        self._session.add(pm)
        await self._session.flush()
        return pm

    async def get_with_medication(self, pm_id: UUID) -> PatientMedication | None:
        return await self._session.scalar(
            select(PatientMedication)
            .where(PatientMedication.id == pm_id)
            .options(selectinload(PatientMedication.medication))
        )

    async def get_by_patient_and_id(self, patient_id: UUID, pm_id: UUID) -> PatientMedication | None:
        return await self._session.scalar(
            select(PatientMedication)
            .where(PatientMedication.id == pm_id, PatientMedication.patient_id == patient_id)
            .options(selectinload(PatientMedication.medication))
        )

    async def list_by_patient(self, patient_id: UUID) -> list[PatientMedication]:
        result = await self._session.scalars(
            select(PatientMedication)
            .where(PatientMedication.patient_id == patient_id)
            .options(selectinload(PatientMedication.medication))
        )
        return list(result)

    async def list_active_by_patient(self, patient_id: UUID) -> list[PatientMedication]:
        from datetime import date

        result = await self._session.scalars(
            select(PatientMedication)
            .where(
                PatientMedication.patient_id == patient_id,
                (PatientMedication.ended_at.is_(None)) | (PatientMedication.ended_at > date.today()),
            )
            .options(selectinload(PatientMedication.medication))
        )
        return list(result)

    async def update(self, pm: PatientMedication) -> None:
        await self._session.flush()
