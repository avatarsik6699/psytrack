from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.modules.auth.dependencies import require_doctor
from app.modules.doctors.dependencies import get_doctor_service
from app.modules.doctors.service import DoctorService
from app.modules.patients.dependencies import get_patient_service
from app.modules.patients.schemas import PatientCreate, PatientCreatedOut, PatientOut, PatientUpdate
from app.modules.patients.service import PatientService
from app.modules.users.models import User

router = APIRouter(prefix="/doctor/patients", tags=["doctor-patients"])


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
