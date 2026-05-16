from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.doctors.repository import DoctorRepository
from app.modules.doctors.service import DoctorService


def get_doctor_repository(session: AsyncSession = Depends(get_db)) -> DoctorRepository:
    return DoctorRepository(session)


def get_doctor_service(
    repository: DoctorRepository = Depends(get_doctor_repository),
) -> DoctorService:
    return DoctorService(repository)
