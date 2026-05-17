from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.patients.models import Patient


class PatientRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_temp_login(self, temp_login: str) -> Patient | None:
        return await self._session.scalar(
            select(Patient).where(Patient.temp_login == temp_login)
        )

    async def add(self, patient: Patient) -> Patient:
        self._session.add(patient)
        await self._session.flush()
        return patient

    async def list_by_doctor(self, doctor_id: UUID) -> list[Patient]:
        result = await self._session.scalars(
            select(Patient)
            .where(Patient.doctor_id == doctor_id, Patient.archived_at.is_(None))
            .order_by(Patient.full_name)
        )
        return list(result)

    async def get_by_id(self, patient_id: UUID) -> Patient | None:
        return await self._session.scalar(select(Patient).where(Patient.id == patient_id))

    async def get_by_doctor_and_id(self, doctor_id: UUID, patient_id: UUID) -> Patient | None:
        return await self._session.scalar(
            select(Patient).where(Patient.id == patient_id, Patient.doctor_id == doctor_id)
        )

    async def get_by_user_id(self, user_id: UUID) -> Patient | None:
        return await self._session.scalar(select(Patient).where(Patient.user_id == user_id))
