from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.patients.repository import PatientRepository
from app.modules.patients.service import PatientService


def get_patient_repository(session: AsyncSession = Depends(get_db)) -> PatientRepository:
    return PatientRepository(session)


def get_patient_service(
    repository: PatientRepository = Depends(get_patient_repository),
) -> PatientService:
    return PatientService(repository)
