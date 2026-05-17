from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.modules.auth.dependencies import get_current_user, require_doctor, require_patient
from app.modules.doctors.dependencies import get_doctor_service
from app.modules.doctors.service import DoctorService
from app.modules.events.repository import EventLogRepository
from app.modules.medications.dependencies import (
    get_event_log_repository,
    get_medication_service,
    get_patient_medication_service,
)
from app.modules.medications.schemas import (
    EventLogOut,
    MedicationChartSeries,
    MedicationLogIn,
    MedicationReferenceOut,
    PatientMedicationCreate,
    PatientMedicationOut,
    PatientMedicationUpdate,
)
from app.modules.medications.service import MedicationService, PatientMedicationService
from app.modules.patients.dependencies import get_patient_repository, get_patient_service
from app.modules.patients.repository import PatientRepository
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


# --- Doctor: medication chart ---

doctor_chart_router = APIRouter(
    prefix="/doctor/patients/{patient_id}/charts/medications", tags=["doctor-charts"]
)


@doctor_chart_router.get("", response_model=list[MedicationChartSeries])
async def get_medication_chart(
    patient_id: UUID,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    pm_service: PatientMedicationService = Depends(get_patient_medication_service),
) -> list[MedicationChartSeries]:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    meds = await pm_service.list_by_patient(patient_id)
    return pm_service.build_chart_series(meds)


# --- Patient: own medications ---

patient_med_router = APIRouter(prefix="/patient/medications", tags=["patient-medications"])


@patient_med_router.get("", response_model=list[PatientMedicationOut])
async def list_my_medications(
    current_user: User = Depends(require_patient),
    patient_repo: PatientRepository = Depends(get_patient_repository),
    pm_service: PatientMedicationService = Depends(get_patient_medication_service),
) -> list[PatientMedicationOut]:
    patient = await patient_repo.get_by_user_id(current_user.id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    meds = await pm_service.list_active_for_patient(patient.id)
    return [PatientMedicationOut.model_validate(m) for m in meds]


@patient_med_router.post("", response_model=PatientMedicationOut, status_code=status.HTTP_201_CREATED)
async def add_my_medication(
    body: PatientMedicationCreate,
    current_user: User = Depends(require_patient),
    patient_repo: PatientRepository = Depends(get_patient_repository),
    pm_service: PatientMedicationService = Depends(get_patient_medication_service),
    event_repo: EventLogRepository = Depends(get_event_log_repository),
) -> PatientMedicationOut:
    patient = await patient_repo.get_by_user_id(current_user.id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    pm = await pm_service.add_by_patient(body, patient.id, current_user.id, event_repo)
    return PatientMedicationOut.model_validate(pm)


@patient_med_router.patch("/{medication_id}/log", response_model=EventLogOut)
async def log_dose(
    medication_id: UUID,
    body: MedicationLogIn,
    current_user: User = Depends(require_patient),
    patient_repo: PatientRepository = Depends(get_patient_repository),
    pm_service: PatientMedicationService = Depends(get_patient_medication_service),
    event_repo: EventLogRepository = Depends(get_event_log_repository),
) -> EventLogOut:
    patient = await patient_repo.get_by_user_id(current_user.id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    pm = await pm_service.get_for_patient(patient.id, medication_id)
    return await pm_service.log_dose(pm, body, patient.id, current_user.id, event_repo)


@patient_med_router.patch("/{medication_id}", response_model=PatientMedicationOut)
async def edit_my_medication(
    medication_id: UUID,
    body: PatientMedicationUpdate,
    current_user: User = Depends(require_patient),
    patient_repo: PatientRepository = Depends(get_patient_repository),
    pm_service: PatientMedicationService = Depends(get_patient_medication_service),
    event_repo: EventLogRepository = Depends(get_event_log_repository),
) -> PatientMedicationOut:
    patient = await patient_repo.get_by_user_id(current_user.id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    pm = await pm_service.get_for_patient(patient.id, medication_id)
    pm = await pm_service.edit_by_patient(pm, body, patient.id, current_user.id, event_repo)
    return PatientMedicationOut.model_validate(pm)


@patient_med_router.delete("/{medication_id}", response_model=dict)
async def stop_my_medication(
    medication_id: UUID,
    current_user: User = Depends(require_patient),
    patient_repo: PatientRepository = Depends(get_patient_repository),
    pm_service: PatientMedicationService = Depends(get_patient_medication_service),
    event_repo: EventLogRepository = Depends(get_event_log_repository),
) -> dict:
    patient = await patient_repo.get_by_user_id(current_user.id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    pm = await pm_service.get_for_patient(patient.id, medication_id)
    await pm_service.stop_by_patient(pm, patient.id, current_user.id, event_repo)
    return {"ok": True}
