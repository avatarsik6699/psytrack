from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.modules.auth.dependencies import get_current_user, require_doctor, require_patient
from app.modules.doctors.dependencies import get_doctor_service
from app.modules.doctors.service import DoctorService
from app.modules.patients.dependencies import get_patient_repository, get_patient_service
from app.modules.patients.repository import PatientRepository
from app.modules.patients.service import PatientService
from app.modules.scales.charts import ScoreChartService
from app.modules.scales.dependencies import (
    get_patient_scale_service,
    get_scale_service,
    get_score_chart_service,
    get_test_completion_service,
)
from app.modules.scales.schemas import (
    PatientScaleCreate,
    PatientScaleOut,
    ScaleOut,
    ScaleQuestion,
    ScoreChartSeries,
    TestCompletionOut,
    TestCompletionPage,
    TestSubmitIn,
)
from app.modules.scales.service import PatientScaleService, ScaleService, TestCompletionService
from app.modules.users.models import User

# --- Reference endpoints (any authenticated user) ---

ref_scales_router = APIRouter(prefix="/ref/scales", tags=["reference"])


@ref_scales_router.get("", response_model=list[ScaleOut])
async def list_scales(
    _current_user: User = Depends(get_current_user),
    scale_service: ScaleService = Depends(get_scale_service),
) -> list[ScaleOut]:
    scales = await scale_service.list_all()
    return [ScaleOut.model_validate(s) for s in scales]


@ref_scales_router.get("/{scale_id}/questions", response_model=list[ScaleQuestion])
async def get_scale_questions(
    scale_id: UUID,
    _current_user: User = Depends(get_current_user),
    scale_service: ScaleService = Depends(get_scale_service),
) -> list[ScaleQuestion]:
    scale = await scale_service.get_by_id(scale_id)
    return scale.questions_json


# --- Doctor endpoints ---

doctor_scales_router = APIRouter(
    prefix="/doctor/patients/{patient_id}/scales", tags=["doctor-scales"]
)


@doctor_scales_router.post("", response_model=PatientScaleOut, status_code=status.HTTP_201_CREATED)
async def assign_scale(
    patient_id: UUID,
    body: PatientScaleCreate,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    scale_service: ScaleService = Depends(get_scale_service),
    ps_service: PatientScaleService = Depends(get_patient_scale_service),
) -> PatientScaleOut:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    await scale_service.get_by_id(body.scale_id)
    ps = await ps_service.assign(body, patient_id, profile.id)
    return PatientScaleOut.model_validate(ps)


@doctor_scales_router.get("", response_model=list[PatientScaleOut])
async def list_patient_scales(
    patient_id: UUID,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    ps_service: PatientScaleService = Depends(get_patient_scale_service),
) -> list[PatientScaleOut]:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    scales = await ps_service.list_for_patient(patient_id)
    return [PatientScaleOut.model_validate(ps) for ps in scales]


@doctor_scales_router.delete("/{patient_scale_id}", response_model=dict)
async def remove_scale(
    patient_id: UUID,
    patient_scale_id: UUID,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    ps_service: PatientScaleService = Depends(get_patient_scale_service),
) -> dict:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    await ps_service.remove(patient_id, patient_scale_id)
    return {"ok": True}


# --- Patient: submit test ---

patient_tests_router = APIRouter(prefix="/patient/tests", tags=["patient-tests"])


@patient_tests_router.post(
    "/{patient_scale_id}/submit",
    response_model=TestCompletionOut,
    status_code=status.HTTP_201_CREATED,
)
async def submit_test(
    patient_scale_id: UUID,
    body: TestSubmitIn,
    current_user: User = Depends(require_patient),
    patient_repo: PatientRepository = Depends(get_patient_repository),
    tc_service: TestCompletionService = Depends(get_test_completion_service),
) -> TestCompletionOut:
    patient = await patient_repo.get_by_user_id(current_user.id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    tc = await tc_service.submit(patient_scale_id, patient.id, body, created_by=current_user.id)
    return TestCompletionOut.model_validate(tc)


# --- Patient: history ---

patient_history_router = APIRouter(prefix="/patient", tags=["patient-history"])


@patient_history_router.get("/history", response_model=TestCompletionPage)
async def get_history(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(require_patient),
    patient_repo: PatientRepository = Depends(get_patient_repository),
    tc_service: TestCompletionService = Depends(get_test_completion_service),
) -> TestCompletionPage:
    patient = await patient_repo.get_by_user_id(current_user.id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    items, total = await tc_service.list_history(patient.id, limit, offset)
    return TestCompletionPage(
        items=[TestCompletionOut.model_validate(tc) for tc in items],
        total=total,
    )


# --- Patient: get single patient scale ---

patient_scales_router = APIRouter(prefix="/patient/scales", tags=["patient-scales"])


@patient_scales_router.get("", response_model=list[PatientScaleOut])
async def list_my_scales(
    current_user: User = Depends(require_patient),
    patient_repo: PatientRepository = Depends(get_patient_repository),
    ps_service: PatientScaleService = Depends(get_patient_scale_service),
) -> list[PatientScaleOut]:
    patient = await patient_repo.get_by_user_id(current_user.id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    scales = await ps_service.list_for_patient(patient.id)
    return [PatientScaleOut.model_validate(ps) for ps in scales]


@patient_scales_router.get("/{patient_scale_id}", response_model=PatientScaleOut)
async def get_patient_scale(
    patient_scale_id: UUID,
    current_user: User = Depends(require_patient),
    patient_repo: PatientRepository = Depends(get_patient_repository),
    ps_service: PatientScaleService = Depends(get_patient_scale_service),
) -> PatientScaleOut:
    patient = await patient_repo.get_by_user_id(current_user.id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    ps = await ps_service.get_for_patient(patient.id, patient_scale_id)
    return PatientScaleOut.model_validate(ps)


# --- Doctor: score chart ---

doctor_score_chart_router = APIRouter(
    prefix="/doctor/patients/{patient_id}/charts/scores", tags=["doctor-charts"]
)


@doctor_score_chart_router.get("", response_model=list[ScoreChartSeries])
async def get_score_chart(
    patient_id: UUID,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    chart_service: ScoreChartService = Depends(get_score_chart_service),
) -> list[ScoreChartSeries]:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    return await chart_service.get_series(patient_id)
