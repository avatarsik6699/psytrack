from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.diagnoses.repository import DiagnosisRepository
from app.modules.diagnoses.service import DiagnosisService


def get_diagnosis_repository(session: AsyncSession = Depends(get_db)) -> DiagnosisRepository:
    return DiagnosisRepository(session)


def get_diagnosis_service(
    repository: DiagnosisRepository = Depends(get_diagnosis_repository),
) -> DiagnosisService:
    return DiagnosisService(repository)
