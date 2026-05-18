from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.modules.auth.dependencies import get_current_user, require_doctor, require_patient
from app.modules.doctors.dependencies import get_doctor_service
from app.modules.doctors.service import DoctorService
from app.modules.events.repository import EventLogRepository
from app.modules.patients.dependencies import get_patient_repository, get_patient_service
from app.modules.patients.repository import PatientRepository
from app.modules.patients.service import PatientService
from app.modules.side_effects.dependencies import (
    get_event_log_repository,
    get_patient_se_service,
    get_se_chart_service,
    get_se_dictionary_service,
    get_se_monitoring_rule_service,
)
from app.modules.side_effects.schemas import (
    PatientSideEffectIn,
    PatientSideEffectOut,
    PatientSideEffectUpdate,
    SeDictionaryPage,
    SeMonitoringRuleIn,
    SeMonitoringRuleOut,
    SeSeverityDataPoint,
)
from app.modules.side_effects.service import (
    PatientSideEffectService,
    SeDictionaryService,
    SeMonitoringRuleService,
    SeSeverityChartService,
)
from app.modules.users.models import User

# ── B3: Reference endpoint ────────────────────────────────────────────────────

ref_se_router = APIRouter(prefix="/ref/se-dictionary", tags=["reference"])


@ref_se_router.get("", response_model=SeDictionaryPage)
async def list_se_dictionary(
    q: str | None = None,
    body_system: str | None = None,
    page: int = 1,
    size: int = 20,
    _current_user: User = Depends(get_current_user),
    se_service: SeDictionaryService = Depends(get_se_dictionary_service),
) -> SeDictionaryPage:
    return await se_service.search(q, body_system, page, size)


# ── B4: Patient SE endpoints ──────────────────────────────────────────────────

patient_se_router = APIRouter(prefix="/patient/side-effects", tags=["patient-side-effects"])


@patient_se_router.get("", response_model=list[PatientSideEffectOut])
async def list_my_side_effects(
    current_user: User = Depends(require_patient),
    patient_repo: PatientRepository = Depends(get_patient_repository),
    se_service: PatientSideEffectService = Depends(get_patient_se_service),
) -> list[PatientSideEffectOut]:
    patient = await patient_repo.get_by_user_id(current_user.id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    pses = await se_service.list_for_patient(patient.id)
    return [PatientSideEffectOut.model_validate(p) for p in pses]


@patient_se_router.post("", response_model=PatientSideEffectOut, status_code=status.HTTP_201_CREATED)
async def report_side_effect(
    body: PatientSideEffectIn,
    current_user: User = Depends(require_patient),
    patient_repo: PatientRepository = Depends(get_patient_repository),
    se_service: PatientSideEffectService = Depends(get_patient_se_service),
    event_repo: EventLogRepository = Depends(get_event_log_repository),
) -> PatientSideEffectOut:
    patient = await patient_repo.get_by_user_id(current_user.id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    pse = await se_service.create(body, patient.id, current_user.id, event_repo)
    return PatientSideEffectOut.model_validate(pse)


@patient_se_router.patch("/{se_record_id}", response_model=PatientSideEffectOut)
async def update_side_effect(
    se_record_id: UUID,
    body: PatientSideEffectUpdate,
    current_user: User = Depends(require_patient),
    patient_repo: PatientRepository = Depends(get_patient_repository),
    se_service: PatientSideEffectService = Depends(get_patient_se_service),
    event_repo: EventLogRepository = Depends(get_event_log_repository),
) -> PatientSideEffectOut:
    patient = await patient_repo.get_by_user_id(current_user.id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    pse = await se_service.get_for_patient(patient.id, se_record_id)
    pse = await se_service.update(pse, body, patient.id, current_user.id, event_repo)
    return PatientSideEffectOut.model_validate(pse)


@patient_se_router.delete("/{se_record_id}", response_model=dict)
async def delete_side_effect(
    se_record_id: UUID,
    current_user: User = Depends(require_patient),
    patient_repo: PatientRepository = Depends(get_patient_repository),
    se_service: PatientSideEffectService = Depends(get_patient_se_service),
    event_repo: EventLogRepository = Depends(get_event_log_repository),
) -> dict:
    patient = await patient_repo.get_by_user_id(current_user.id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    pse = await se_service.get_for_patient(patient.id, se_record_id)
    await se_service.soft_delete(pse, patient.id, current_user.id, event_repo)
    return {"ok": True}


# ── B5: Doctor SE monitoring rule endpoints ───────────────────────────────────

doctor_se_rules_router = APIRouter(
    prefix="/doctor/patients/{patient_id}/se-rules", tags=["doctor-se-rules"]
)


@doctor_se_rules_router.get("", response_model=list[SeMonitoringRuleOut])
async def list_se_rules(
    patient_id: UUID,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    rule_service: SeMonitoringRuleService = Depends(get_se_monitoring_rule_service),
) -> list[SeMonitoringRuleOut]:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    rules = await rule_service.list_for_patient(patient_id)
    return [SeMonitoringRuleOut.model_validate(r) for r in rules]


@doctor_se_rules_router.post(
    "", response_model=SeMonitoringRuleOut, status_code=status.HTTP_201_CREATED
)
async def add_se_rule(
    patient_id: UUID,
    body: SeMonitoringRuleIn,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    rule_service: SeMonitoringRuleService = Depends(get_se_monitoring_rule_service),
    event_repo: EventLogRepository = Depends(get_event_log_repository),
) -> SeMonitoringRuleOut:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    rule = await rule_service.create(body, patient_id, profile.id, event_repo, created_by=current_user.id)
    return SeMonitoringRuleOut.model_validate(rule)


@doctor_se_rules_router.delete("/{rule_id}", response_model=dict)
async def remove_se_rule(
    patient_id: UUID,
    rule_id: UUID,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    rule_service: SeMonitoringRuleService = Depends(get_se_monitoring_rule_service),
    event_repo: EventLogRepository = Depends(get_event_log_repository),
) -> dict:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    await rule_service.delete(patient_id, rule_id, profile.id, event_repo, created_by=current_user.id)
    return {"ok": True}


# ── B6: Doctor SE chart endpoint ──────────────────────────────────────────────

doctor_se_chart_router = APIRouter(
    prefix="/doctor/patients/{patient_id}/charts/side-effects", tags=["doctor-charts"]
)


@doctor_se_chart_router.get("", response_model=list[SeSeverityDataPoint])
async def get_se_chart(
    patient_id: UUID,
    locale: str = "ru",
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    se_service: PatientSideEffectService = Depends(get_patient_se_service),
    chart_service: SeSeverityChartService = Depends(get_se_chart_service),
) -> list[SeSeverityDataPoint]:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    pses = await se_service.list_all_for_chart(patient_id)
    return chart_service.build_chart(pses, locale)
