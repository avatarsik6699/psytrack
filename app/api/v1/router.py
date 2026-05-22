"""Aggregator for all v1 module routers. Imported once by `app.main`."""

from fastapi import APIRouter

from app.core.constants import API_V1_PREFIX
from app.modules.auth.api import router as auth_router
from app.modules.diagnoses.api import router as diagnoses_router
from app.modules.events.api import router as events_router
from app.modules.health.api import router as health_router
from app.modules.medications.api import doctor_chart_router, doctor_med_router, patient_med_router
from app.modules.medications.api import ref_router as med_ref_router
from app.modules.patients.api import router as patients_router, patient_me_router
from app.modules.scales.api import (
    doctor_score_chart_router,
    doctor_scales_router,
    patient_history_router,
    patient_scales_router,
    patient_tests_router,
    ref_scales_router,
)
from app.modules.therapy_goals.router import router as therapy_goals_router
from app.modules.side_effects.api import (
    doctor_se_chart_router,
    doctor_se_rules_router,
    patient_se_router,
    ref_se_router,
)
from app.modules.tasks.api import router as tasks_router, patient_tasks_router

api_v1_router = APIRouter(prefix=API_V1_PREFIX)
api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(patients_router)
api_v1_router.include_router(patient_me_router)
api_v1_router.include_router(diagnoses_router)
api_v1_router.include_router(med_ref_router)
api_v1_router.include_router(doctor_med_router)
api_v1_router.include_router(doctor_chart_router)
api_v1_router.include_router(patient_med_router)
api_v1_router.include_router(ref_scales_router)
api_v1_router.include_router(doctor_scales_router)
api_v1_router.include_router(patient_tests_router)
api_v1_router.include_router(patient_history_router)
api_v1_router.include_router(patient_scales_router)
api_v1_router.include_router(ref_se_router)
api_v1_router.include_router(patient_se_router)
api_v1_router.include_router(doctor_se_rules_router)
api_v1_router.include_router(doctor_se_chart_router)
api_v1_router.include_router(events_router)
api_v1_router.include_router(tasks_router)
api_v1_router.include_router(patient_tasks_router)
api_v1_router.include_router(doctor_score_chart_router)
api_v1_router.include_router(therapy_goals_router)
