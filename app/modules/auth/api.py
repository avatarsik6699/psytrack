from fastapi import APIRouter, Depends, status

from app.modules.auth.dependencies import get_auth_service, get_current_user
from app.modules.auth.schemas import (
    AccountDeletionResponse,
    CurrentSessionOut,
    EmailUpdateIn,
    LoginRequest,
    PasswordChangeRequest,
    PatientTempLoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
)
from app.modules.auth.service import AuthService
from app.modules.users import User, UserOut

router = APIRouter(prefix="/public/auth", tags=["auth"])


@router.post("/login", response_model=TokenPair)
async def login(
    body: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenPair:
    return await service.login(body.email, body.password)


@router.post("/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenPair:
    return await service.register(body.email, body.password, body.full_name)


@router.post("/refresh", response_model=TokenPair)
async def refresh(
    body: RefreshRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenPair:
    return await service.refresh(body.refresh_token)


@router.post("/patient-login", response_model=TokenPair)
async def patient_login(
    body: PatientTempLoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenPair:
    return await service.patient_login(body.temp_login, body.password)


@router.get("/session", response_model=CurrentSessionOut)
async def session(
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> CurrentSessionOut:
    return await service.current_session(current_user)


@router.patch("/me/email", status_code=status.HTTP_200_OK)
async def update_email(
    body: EmailUpdateIn,
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> dict[str, bool]:
    await service.update_email(current_user, body.email)
    return {"ok": True}


@router.patch("/me/password", status_code=status.HTTP_200_OK)
async def change_password(
    body: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> dict[str, bool]:
    await service.change_password(current_user, body.current_password, body.new_password)
    return {"ok": True}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)


@router.delete("/me", response_model=AccountDeletionResponse)
async def delete_me(
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> AccountDeletionResponse:
    await service.delete_account(current_user)
    return AccountDeletionResponse(deleted=True)


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(_current_user: User = Depends(get_current_user)) -> dict[str, str]:
    return {"message": "Logged out"}
