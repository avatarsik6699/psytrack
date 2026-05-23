from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.modules.auth.dependencies import require_doctor, require_patient
from app.modules.doctors.dependencies import get_doctor_service
from app.modules.doctors.service import DoctorService
from app.modules.patients.dependencies import get_patient_repository, get_patient_service
from app.modules.patients.repository import PatientRepository
from app.modules.patients.schemas import (
    PatientCreate,
    PatientCreatedOut,
    PatientCredentialOut,
    PatientCredentialResetOut,
    PatientCredentialUpdateIn,
    PatientMeOut,
    PatientOut,
    PatientUpdate,
)
from app.modules.patients.service import PatientService
from app.modules.users.models import User

router = APIRouter(prefix="/doctor/patients", tags=["doctor-patients"])
patient_me_router = APIRouter(prefix="/patient", tags=["patient-me"])


@router.get("", response_model=list[PatientOut])
async def list_patients(
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
) -> list[PatientOut]:
    profile = await doctor_service.get_for_user(current_user.id)
    return await patient_service.list_with_colors(profile.id)


@router.post("", response_model=PatientCreatedOut, status_code=status.HTTP_201_CREATED)
async def create_patient(
    body: PatientCreate,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
) -> PatientCreatedOut:
    profile = await doctor_service.get_for_user(current_user.id)
    patient, plaintext_password = await patient_service.create(body, profile.id)
    base = PatientOut.model_validate(patient).model_dump()
    base["temp_login"] = patient.temp_login
    base["temp_password"] = plaintext_password
    return PatientCreatedOut.model_validate(base)


@router.get("/{patient_id}", response_model=PatientOut)
async def get_patient(
    patient_id: UUID,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
) -> PatientOut:
    profile = await doctor_service.get_for_user(current_user.id)
    patient = await patient_service.get_for_doctor(patient_id, profile.id)
    return await patient_service._build_with_extras(patient)


@router.patch("/{patient_id}", response_model=PatientOut)
async def update_patient(
    patient_id: UUID,
    body: PatientUpdate,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
) -> PatientOut:
    profile = await doctor_service.get_for_user(current_user.id)
    patient = await patient_service.get_for_doctor(patient_id, profile.id)
    patient = await patient_service.update(patient, body)
    return PatientOut.model_validate(patient)


@patient_me_router.get("/me", response_model=PatientMeOut)
async def patient_me(
    current_user: User = Depends(require_patient),
    patient_repo: PatientRepository = Depends(get_patient_repository),
) -> PatientMeOut:
    data = await patient_repo.get_me(current_user.id)
    if data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found",
        )
    return PatientMeOut.model_validate(data)


@patient_me_router.patch("/me/credentials", response_model=PatientCredentialOut)
async def update_patient_credentials(
    body: PatientCredentialUpdateIn,
    current_user: User = Depends(require_patient),
    patient_service: PatientService = Depends(get_patient_service),
) -> PatientCredentialOut:
    patient = await patient_service.update_own_credentials(current_user, body)
    return PatientCredentialOut(temp_login=patient.temp_login or "")


@router.post("/{patient_id}/credentials/reset", response_model=PatientCredentialResetOut)
async def reset_patient_credentials(
    patient_id: UUID,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
) -> PatientCredentialResetOut:
    profile = await doctor_service.get_for_user(current_user.id)
    patient = await patient_service.get_for_doctor(patient_id, profile.id)
    patient, plaintext_password = await patient_service.reset_credentials(patient)
    return PatientCredentialResetOut(
        temp_login=patient.temp_login or "",
        temp_password=plaintext_password,
    )


@router.post("/{patient_id}/archive", status_code=status.HTTP_200_OK)
async def archive_patient(
    patient_id: UUID,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
) -> dict[str, bool]:
    profile = await doctor_service.get_for_user(current_user.id)
    patient = await patient_service.get_for_doctor(patient_id, profile.id)
    await patient_service.archive(patient)
    return {"ok": True}
