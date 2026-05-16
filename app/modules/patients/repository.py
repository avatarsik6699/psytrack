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
