from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.doctors.models import DoctorProfile


class DoctorRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_user_id(self, user_id: UUID) -> DoctorProfile | None:
        return await self._session.scalar(
            select(DoctorProfile).where(DoctorProfile.user_id == user_id)
        )

    async def add(self, profile: DoctorProfile) -> DoctorProfile:
        self._session.add(profile)
        await self._session.flush()
        return profile
