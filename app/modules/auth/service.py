from datetime import UTC, datetime
from uuid import UUID

from app.modules.auth.constants import JWT_CLAIM_ROLE, JWT_CLAIM_SUBJECT, TOKEN_TYPE_REFRESH
from app.modules.auth.exceptions import AccountDisabled, InvalidCredentials, InvalidToken
from app.modules.auth.schemas import CurrentSessionOut, TokenPair
from app.modules.auth.utils import (
    create_access_token,
    create_refresh_token,
    decode_token,
    ensure_token_type,
    hash_password,
    verify_password,
)
from app.modules.doctors.models import DoctorProfile
from app.modules.doctors.repository import DoctorRepository
from app.modules.patients.repository import PatientRepository
from app.modules.users import EmailAlreadyExists, User, UserNotFound, UserRole, UserService


class AuthService:
    def __init__(
        self,
        user_service: UserService,
        doctor_repository: DoctorRepository,
        patient_repository: PatientRepository,
    ) -> None:
        self._user_service = user_service
        self._doctor_repository = doctor_repository
        self._patient_repository = patient_repository

    async def register(self, email: str, password: str, full_name: str) -> TokenPair:
        existing = await self._user_service.find_by_email(email)
        if existing is not None:
            raise EmailAlreadyExists()

        user = await self._user_service.add(
            User(
                email=email,
                hashed_password=hash_password(password),
                role=UserRole.doctor,
                consent_152fz=True,
                consent_at=datetime.now(UTC),
                is_active=True,
            )
        )

        await self._doctor_repository.add(
            DoctorProfile(user_id=user.id, full_name=full_name)
        )

        claims = {
            JWT_CLAIM_SUBJECT: str(user.id),
            JWT_CLAIM_ROLE: user.role.value,
        }
        return TokenPair(
            access_token=create_access_token(claims),
            refresh_token=create_refresh_token(claims),
        )

    async def login(self, email: str, password: str) -> TokenPair:
        try:
            user = await self._user_service.get_by_email(email)
        except UserNotFound as exc:
            raise InvalidCredentials() from exc

        if user.role != UserRole.doctor:
            raise InvalidCredentials()

        if not verify_password(password, user.hashed_password):
            raise InvalidCredentials()

        if not user.is_active:
            raise AccountDisabled()

        claims = {
            JWT_CLAIM_SUBJECT: str(user.id),
            JWT_CLAIM_ROLE: user.role.value,
        }
        
        return TokenPair(
            access_token=create_access_token(claims),
            refresh_token=create_refresh_token(claims),
        )

    async def patient_login(self, temp_login: str, password: str) -> TokenPair:
        patient = await self._patient_repository.get_by_temp_login(temp_login)
        if patient is None or not verify_password(password, patient.temp_password_hash or ""):
            raise InvalidCredentials()

        try:
            user = await self._user_service.get_by_id(patient.user_id)
        except UserNotFound as exc:
            raise InvalidCredentials() from exc

        if not user.is_active:
            raise AccountDisabled()

        claims = {
            JWT_CLAIM_SUBJECT: str(user.id),
            JWT_CLAIM_ROLE: user.role.value,
        }
        return TokenPair(
            access_token=create_access_token(claims),
            refresh_token=create_refresh_token(claims),
        )

    async def current_session(self, user: User) -> CurrentSessionOut:
        if user.role == UserRole.doctor:
            profile = await self._doctor_repository.get_by_user_id(user.id)
            return CurrentSessionOut(
                user_id=user.id,
                role=user.role,
                email=user.email,
                display_name=profile.full_name if profile is not None else None,
                specialty=profile.specialty if profile is not None else None,
                doctor_id=profile.id if profile is not None else None,
            )

        patient = await self._patient_repository.get_by_user_id(user.id)
        return CurrentSessionOut(
            user_id=user.id,
            role=user.role,
            email=patient.email if patient is not None else user.email,
            display_name=patient.full_name if patient is not None else None,
            patient_id=patient.id if patient is not None else None,
            doctor_id=patient.doctor_id if patient is not None else None,
        )

    async def change_password(self, user: User, current: str, new: str) -> None:
        if not verify_password(current, user.hashed_password):
            raise InvalidCredentials()
        user.hashed_password = hash_password(new)
        await self._user_service.add(user)

    async def update_email(self, user: User, new_email: str) -> None:
        if user.role == UserRole.doctor:
            user.email = new_email
            await self._user_service.add(user)
        else:
            patient = await self._patient_repository.get_by_user_id(user.id)
            if patient is not None:
                patient.email = new_email
                await self._patient_repository._session.flush()

    async def delete_account(self, user: User) -> None:
        await self._user_service.delete(user)

    async def refresh(self, refresh_token: str) -> TokenPair:
        payload = decode_token(refresh_token)
        ensure_token_type(payload, TOKEN_TYPE_REFRESH)

        raw_sub = payload.get(JWT_CLAIM_SUBJECT)
        if not isinstance(raw_sub, str):
            raise InvalidToken()

        try:
            user_id = UUID(raw_sub)
        except ValueError as exc:
            raise InvalidToken() from exc

        try:
            user = await self._user_service.get_by_id(user_id)
        except UserNotFound as exc:
            raise InvalidToken() from exc

        if not user.is_active:
            raise AccountDisabled()

        claims = {
            JWT_CLAIM_SUBJECT: str(user.id),
            JWT_CLAIM_ROLE: user.role.value,
        }
        return TokenPair(
            access_token=create_access_token(claims),
            refresh_token=create_refresh_token(claims),
        )
