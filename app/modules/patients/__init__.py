from app.modules.patients.dependencies import get_patient_repository, get_patient_service
from app.modules.patients.models import Patient
from app.modules.patients.repository import PatientRepository
from app.modules.patients.schemas import PatientOut
from app.modules.patients.service import PatientService

__all__ = [
    "Patient",
    "PatientOut",
    "PatientRepository",
    "PatientService",
    "get_patient_repository",
    "get_patient_service",
]
