from uuid import UUID

from app.modules.diagnoses.exceptions import DiagnosisNotFound
from app.modules.diagnoses.models import Diagnosis
from app.modules.diagnoses.repository import DiagnosisRepository
from app.modules.diagnoses.schemas import DiagnosisCreate, DiagnosisUpdate


class DiagnosisService:
    def __init__(self, repository: DiagnosisRepository) -> None:
        self._repository = repository

    async def create(self, data: DiagnosisCreate, patient_id: UUID) -> Diagnosis:
        diagnosis = Diagnosis(
            patient_id=patient_id,
            icd_code=data.icd_code,
            name=data.name,
            is_primary=data.is_primary,
            date_diagnosed=data.date_diagnosed,
            notes=data.notes,
        )
        return await self._repository.add(diagnosis)

    async def get(self, diagnosis_id: UUID) -> Diagnosis:
        diagnosis = await self._repository.get_by_id(diagnosis_id)
        if diagnosis is None:
            raise DiagnosisNotFound()
        return diagnosis

    async def list_by_patient(self, patient_id: UUID) -> list[Diagnosis]:
        return await self._repository.list_by_patient(patient_id)

    async def update(self, diagnosis: Diagnosis, data: DiagnosisUpdate) -> Diagnosis:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(diagnosis, field, value)
        await self._repository._session.flush()
        return diagnosis
