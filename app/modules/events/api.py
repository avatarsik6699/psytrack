from uuid import UUID

from fastapi import APIRouter, Depends

from app.modules.auth.dependencies import require_doctor
from app.modules.doctors.dependencies import get_doctor_service
from app.modules.doctors.service import DoctorService
from app.modules.events.repository import EventLogRepository
from app.modules.events.schemas import EventLogOut, EventTimelinePage
from app.modules.patients.dependencies import get_patient_service
from app.modules.patients.service import PatientService
from app.modules.side_effects.dependencies import get_event_log_repository
from app.modules.users.models import User

router = APIRouter(
    prefix="/doctor/patients/{patient_id}/events", tags=["doctor-events"]
)


@router.get("", response_model=EventTimelinePage)
async def list_patient_events(
    patient_id: UUID,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    event_repo: EventLogRepository = Depends(get_event_log_repository),
) -> EventTimelinePage:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    items, total = await event_repo.paginate_by_patient(patient_id, page, size)
    return EventTimelinePage(
        items=[EventLogOut.model_validate(e) for e in items],
        total=total,
        page=page,
        size=size,
    )
