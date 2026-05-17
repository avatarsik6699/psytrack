"""Aggregator for all v1 module routers. Imported once by `app.main`."""

from fastapi import APIRouter

from app.core.constants import API_V1_PREFIX
from app.modules.auth.api import router as auth_router
from app.modules.diagnoses.api import router as diagnoses_router
from app.modules.health.api import router as health_router
from app.modules.medications.api import doctor_med_router
from app.modules.medications.api import ref_router as med_ref_router
from app.modules.patients.api import router as patients_router

api_v1_router = APIRouter(prefix=API_V1_PREFIX)
api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(patients_router)
api_v1_router.include_router(diagnoses_router)
api_v1_router.include_router(med_ref_router)
api_v1_router.include_router(doctor_med_router)
