from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.modules.auth.dependencies import get_current_user, require_doctor
from app.modules.doctors.dependencies import get_doctor_service
from app.modules.doctors.service import DoctorService
from app.modules.medications.dependencies import get_medication_service, get_patient_medication_service
from app.modules.medications.schemas import (
    MedicationReferenceOut,
    PatientMedicationCreate,
    PatientMedicationOut,
    PatientMedicationUpdate,
)
from app.modules.medications.service import MedicationService, PatientMedicationService
from app.modules.patients.dependencies import get_patient_service
from app.modules.patients.service import PatientService
from app.modules.users.models import User

ref_router = APIRouter(prefix="/ref/medications", tags=["reference"])


@ref_router.get("", response_model=list[MedicationReferenceOut])
async def list_medications(
    q: str | None = None,
    limit: int = 50,
    offset: int = 0,
    _current_user: User = Depends(get_current_user),
    medication_service: MedicationService = Depends(get_medication_service),
) -> list[MedicationReferenceOut]:
    meds = await medication_service.search(q, limit, offset)
    return [MedicationReferenceOut.model_validate(m) for m in meds]


doctor_med_router = APIRouter(
    prefix="/doctor/patients/{patient_id}/medications", tags=["doctor-medications"]
)


@doctor_med_router.get("", response_model=list[PatientMedicationOut])
async def list_patient_medications(
    patient_id: UUID,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    pm_service: PatientMedicationService = Depends(get_patient_medication_service),
) -> list[PatientMedicationOut]:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    meds = await pm_service.list_by_patient(patient_id)
    return [PatientMedicationOut.model_validate(m) for m in meds]


@doctor_med_router.post("", response_model=PatientMedicationOut, status_code=status.HTTP_201_CREATED)
async def assign_medication(
    patient_id: UUID,
    body: PatientMedicationCreate,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    pm_service: PatientMedicationService = Depends(get_patient_medication_service),
) -> PatientMedicationOut:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    pm = await pm_service.assign(body, patient_id)
    return PatientMedicationOut.model_validate(pm)


@doctor_med_router.patch("/{medication_id}", response_model=PatientMedicationOut)
async def update_patient_medication(
    patient_id: UUID,
    medication_id: UUID,
    body: PatientMedicationUpdate,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    pm_service: PatientMedicationService = Depends(get_patient_medication_service),
) -> PatientMedicationOut:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    pm = await pm_service.get_for_patient(patient_id, medication_id)
    pm = await pm_service.update(pm, body)
    return PatientMedicationOut.model_validate(pm)
