import secrets
import string
from datetime import UTC, datetime
from uuid import UUID

from app.modules.patients.color_service import CardColor, compute_card_color
from app.modules.patients.exceptions import PatientNotFound
from app.modules.patients.models import Patient
from app.modules.patients.repository import PatientRepository
from app.modules.patients.schemas import (
    PatientCreate,
    PatientCredentialUpdateIn,
    PatientOut,
    PatientUpdate,
)
from app.modules.users.models import User, UserRole
from app.modules.users.service import UserService

_COLOR_ORDER: dict[CardColor, int] = {"red": 0, "yellow": 1, "green": 2, "gray": 3}


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

    async def _build_with_extras(self, patient: Patient) -> PatientOut:
        color_inputs = await self._repository.get_color_inputs(patient.id)
        color = compute_card_color(color_inputs)
        adherence = await self._repository.compute_adherence_percent(patient.id)
        latest_scores = await self._repository.get_latest_scores(patient.id)
        active_meds = await self._repository.get_active_medications_summary(patient.id)
        data = PatientOut.model_validate(patient).model_dump()
        data["card_color"] = color
        data["adherence_percent"] = adherence
        data["latest_scores"] = latest_scores
        data["active_medications_summary"] = active_meds
        return PatientOut.model_validate(data)

    async def list_with_colors(self, doctor_id: UUID) -> list[PatientOut]:
        patients = await self._repository.list_by_doctor(doctor_id)
        result: list[PatientOut] = []
        for patient in patients:
            result.append(await self._build_with_extras(patient))
        result.sort(key=lambda p: _COLOR_ORDER[p.card_color])
        return result

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
        patient.archived_at = datetime.now(UTC)
        await self._repository._session.flush()
        return patient

    async def update_own_credentials(
        self,
        user: User,
        data: PatientCredentialUpdateIn,
    ) -> Patient:
        from app.modules.auth.exceptions import InvalidCredentials, LoginUnavailable
        from app.modules.auth.utils import hash_password, verify_password

        patient = await self._repository.get_by_user_id(user.id)
        if patient is None:
            raise PatientNotFound()

        if not verify_password(data.current_password, patient.temp_password_hash or ""):
            raise InvalidCredentials()

        if data.new_login is not None:
            existing = await self._repository.find_by_temp_login(
                data.new_login,
                exclude_patient_id=patient.id,
            )
            if existing is not None:
                raise LoginUnavailable()
            patient.temp_login = data.new_login

        if data.new_password is not None:
            password_hash = hash_password(data.new_password)
            patient.temp_password_hash = password_hash
            user.hashed_password = password_hash
            await self._user_service.add(user)

        await self._repository._session.flush()
        return patient

    async def reset_credentials(self, patient: Patient) -> tuple[Patient, str]:
        from app.modules.auth.utils import hash_password

        temp_login, temp_password = _generate_temp_credentials()
        while (
            await self._repository.find_by_temp_login(
                temp_login,
                exclude_patient_id=patient.id,
            )
            is not None
        ):
            temp_login, temp_password = _generate_temp_credentials()

        password_hash = hash_password(temp_password)
        patient.temp_login = temp_login
        patient.temp_password_hash = password_hash

        user = await self._user_service.get_by_id(patient.user_id)
        user.hashed_password = password_hash
        await self._user_service.add(user)
        await self._repository._session.flush()
        return patient, temp_password
