from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.modules.auth.dependencies import require_doctor
from app.modules.diagnoses.dependencies import get_diagnosis_service
from app.modules.diagnoses.schemas import DiagnosisCreate, DiagnosisOut, DiagnosisUpdate
from app.modules.diagnoses.service import DiagnosisService
from app.modules.doctors.dependencies import get_doctor_service
from app.modules.doctors.service import DoctorService
from app.modules.patients.dependencies import get_patient_service
from app.modules.patients.service import PatientService
from app.modules.users.models import User

router = APIRouter(prefix="/doctor/patients/{patient_id}/diagnoses", tags=["diagnoses"])


@router.get("", response_model=list[DiagnosisOut])
async def list_diagnoses(
    patient_id: UUID,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    diagnosis_service: DiagnosisService = Depends(get_diagnosis_service),
) -> list[DiagnosisOut]:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    diagnoses = await diagnosis_service.list_by_patient(patient_id)
    return [DiagnosisOut.model_validate(d) for d in diagnoses]


@router.post("", response_model=DiagnosisOut, status_code=status.HTTP_201_CREATED)
async def create_diagnosis(
    patient_id: UUID,
    body: DiagnosisCreate,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    diagnosis_service: DiagnosisService = Depends(get_diagnosis_service),
) -> DiagnosisOut:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    diagnosis = await diagnosis_service.create(body, patient_id)
    return DiagnosisOut.model_validate(diagnosis)


@router.patch("/{diagnosis_id}", response_model=DiagnosisOut)
async def update_diagnosis(
    patient_id: UUID,
    diagnosis_id: UUID,
    body: DiagnosisUpdate,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    diagnosis_service: DiagnosisService = Depends(get_diagnosis_service),
) -> DiagnosisOut:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    diagnosis = await diagnosis_service.get(diagnosis_id)
    diagnosis = await diagnosis_service.update(diagnosis, body)
    return DiagnosisOut.model_validate(diagnosis)
