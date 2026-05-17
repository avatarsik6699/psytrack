from uuid import UUID

from fastapi import HTTPException

from app.modules.doctors.models import DoctorProfile
from app.modules.doctors.repository import DoctorRepository


class DoctorService:
    def __init__(self, repository: DoctorRepository) -> None:
        self._repository = repository

    async def create_profile(self, user_id: UUID, full_name: str) -> DoctorProfile:
        profile = DoctorProfile(user_id=user_id, full_name=full_name)
        return await self._repository.add(profile)

    async def get_for_user(self, user_id: UUID) -> DoctorProfile:
        profile = await self._repository.get_by_user_id(user_id)
        if profile is None:
            raise HTTPException(status_code=404, detail="Doctor profile not found")
        return profile
