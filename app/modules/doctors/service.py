from uuid import UUID

from app.modules.doctors.models import DoctorProfile
from app.modules.doctors.repository import DoctorRepository


class DoctorService:
    def __init__(self, repository: DoctorRepository) -> None:
        self._repository = repository

    async def create_profile(self, user_id: UUID, full_name: str) -> DoctorProfile:
        profile = DoctorProfile(user_id=user_id, full_name=full_name)
        return await self._repository.add(profile)
