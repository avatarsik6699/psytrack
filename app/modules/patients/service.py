from app.modules.patients.models import Patient
from app.modules.patients.repository import PatientRepository


class PatientService:
    def __init__(self, repository: PatientRepository) -> None:
        self._repository = repository

    async def get_by_temp_login(self, temp_login: str) -> Patient | None:
        return await self._repository.get_by_temp_login(temp_login)
