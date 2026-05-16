from collections.abc import Callable, Coroutine
from typing import Any
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.modules.auth.constants import JWT_CLAIM_SUBJECT, TOKEN_TYPE_ACCESS
from app.modules.auth.exceptions import InsufficientRole, InvalidToken, NotAuthenticated
from app.modules.auth.service import AuthService
from app.modules.auth.utils import decode_token, ensure_token_type
from app.modules.doctors.dependencies import get_doctor_repository
from app.modules.doctors.repository import DoctorRepository
from app.modules.patients.dependencies import get_patient_repository
from app.modules.patients.repository import PatientRepository
from app.modules.users import User, UserNotFound, UserRole, UserService, get_user_service

bearer_scheme = HTTPBearer(auto_error=False)


def get_auth_service(
    user_service: UserService = Depends(get_user_service),
    doctor_repository: DoctorRepository = Depends(get_doctor_repository),
    patient_repository: PatientRepository = Depends(get_patient_repository),
) -> AuthService:
    return AuthService(
        user_service=user_service,
        doctor_repository=doctor_repository,
        patient_repository=patient_repository,
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    user_service: UserService = Depends(get_user_service),
) -> User:
    if credentials is None:
        raise NotAuthenticated()

    payload = decode_token(credentials.credentials)
    ensure_token_type(payload, TOKEN_TYPE_ACCESS)

    raw_sub = payload.get(JWT_CLAIM_SUBJECT)
    if not isinstance(raw_sub, str):
        raise InvalidToken()

    try:
        user_id = UUID(raw_sub)
    except ValueError as exc:
        raise InvalidToken() from exc

    try:
        return await user_service.get_by_id(user_id)
    except UserNotFound as exc:
        raise InvalidToken() from exc


def require_role(
    *roles: UserRole,
) -> Callable[[User], Coroutine[Any, Any, User]]:
    async def dependency(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if roles and current_user.role not in roles:
            raise InsufficientRole()
        return current_user

    return dependency


require_doctor = require_role(UserRole.doctor)
require_patient = require_role(UserRole.patient)
