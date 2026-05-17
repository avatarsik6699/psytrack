import secrets
import string
from datetime import datetime, timezone
from uuid import UUID

from app.modules.patients.exceptions import PatientNotFound
from app.modules.patients.models import Patient
from app.modules.patients.repository import PatientRepository
from app.modules.patients.schemas import PatientCreate, PatientUpdate
from app.modules.users.models import User, UserRole
from app.modules.users.service import UserService


def _generate_temp_credentials() -> tuple[str, str]:
    alphabet = string.ascii_lowercase + string.digits
    login = "".join(secrets.choice(alphabet) for _ in range(8))
    password = "".join(secrets.choice(alphabet) for _ in range(8))
    return login, password


class PatientService:
    def __init__(self, repository: PatientRepository, user_service: UserService) -> None:
        self._repository = repository
        self._user_service = user_service

    async def get_by_temp_login(self, temp_login: str) -> Patient | None:
        return await self._repository.get_by_temp_login(temp_login)

    async def create(self, data: PatientCreate, doctor_id: UUID) -> tuple[Patient, str]:
        from app.modules.auth.utils import hash_password  # lazy import breaks circular dep

        temp_login, temp_password = _generate_temp_credentials()
        user = User(
            role=UserRole.patient,
            hashed_password=hash_password(temp_password),
            is_active=True,
            consent_152fz=False,
        )
        user = await self._user_service.add(user)
        patient = Patient(
            user_id=user.id,
            doctor_id=doctor_id,
            full_name=data.full_name,
            birth_date=data.birth_date,
            gender=data.gender,
            temp_login=temp_login,
            temp_password_hash=hash_password(temp_password),  # same import above
        )
        patient = await self._repository.add(patient)
        return patient, temp_password

    async def list_by_doctor(self, doctor_id: UUID) -> list[Patient]:
        return await self._repository.list_by_doctor(doctor_id)

    async def get_for_doctor(self, patient_id: UUID, doctor_id: UUID) -> Patient:
        patient = await self._repository.get_by_doctor_and_id(doctor_id, patient_id)
        if patient is None:
            raise PatientNotFound()
        return patient

    async def update(self, patient: Patient, data: PatientUpdate) -> Patient:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(patient, field, value)
        await self._repository._session.flush()
        return patient

    async def archive(self, patient: Patient) -> Patient:
        patient.archived_at = datetime.now(timezone.utc)
        await self._repository._session.flush()
        return patient
