from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.events.repository import EventLogRepository
from app.modules.medications.repository import MedicationRepository, PatientMedicationRepository
from app.modules.medications.service import MedicationService, PatientMedicationService


def get_medication_repository(session: AsyncSession = Depends(get_db)) -> MedicationRepository:
    return MedicationRepository(session)


def get_medication_service(
    repository: MedicationRepository = Depends(get_medication_repository),
) -> MedicationService:
    return MedicationService(repository)


def get_patient_medication_repository(
    session: AsyncSession = Depends(get_db),
) -> PatientMedicationRepository:
    return PatientMedicationRepository(session)


def get_patient_medication_service(
    repository: PatientMedicationRepository = Depends(get_patient_medication_repository),
) -> PatientMedicationService:
    return PatientMedicationService(repository)


def get_event_log_repository(session: AsyncSession = Depends(get_db)) -> EventLogRepository:
    return EventLogRepository(session)
