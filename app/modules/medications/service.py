from uuid import UUID

from fastapi import HTTPException

from app.modules.medications.models import MedicationReference, PatientMedication
from app.modules.medications.repository import MedicationRepository, PatientMedicationRepository
from app.modules.medications.schemas import PatientMedicationCreate, PatientMedicationUpdate


class MedicationService:
    def __init__(self, repository: MedicationRepository) -> None:
        self._repository = repository

    async def search(self, q: str | None, limit: int, offset: int) -> list[MedicationReference]:
        return await self._repository.search(q, limit, offset)

    async def get_by_id(self, med_id: UUID) -> MedicationReference:
        med = await self._repository.get_by_id(med_id)
        if med is None:
            raise HTTPException(status_code=404, detail="Medication not found")
        return med


class PatientMedicationService:
    def __init__(self, repository: PatientMedicationRepository) -> None:
        self._repository = repository

    async def assign(self, data: PatientMedicationCreate, patient_id: UUID) -> PatientMedication:
        pm = PatientMedication(
            patient_id=patient_id,
            medication_id=data.medication_id,
            dose_mg=data.dose_mg,
            unit=data.unit,
            frequency=data.frequency,
            started_at=data.started_at,
            ended_at=data.ended_at,
            dose_precision=data.dose_precision,
            created_by_role="doctor",
        )
        pm = await self._repository.add(pm)
        result = await self._repository.get_with_medication(pm.id)
        return result  # type: ignore[return-value]

    async def list_by_patient(self, patient_id: UUID) -> list[PatientMedication]:
        return await self._repository.list_by_patient(patient_id)

    async def get_for_patient(self, patient_id: UUID, pm_id: UUID) -> PatientMedication:
        pm = await self._repository.get_by_patient_and_id(patient_id, pm_id)
        if pm is None:
            raise HTTPException(status_code=404, detail="Patient medication not found")
        return pm

    async def update(self, pm: PatientMedication, data: PatientMedicationUpdate) -> PatientMedication:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(pm, field, value)
        await self._repository._session.flush()
        result = await self._repository.get_with_medication(pm.id)
        return result  # type: ignore[return-value]
