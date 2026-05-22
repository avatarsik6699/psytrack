from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.modules.auth.dependencies import require_patient
from app.modules.patients.dependencies import get_patient_repository
from app.modules.patients.repository import PatientRepository
from app.modules.tasks.repository import TaskRepository
from app.modules.tasks.schemas import TaskOut
from app.modules.tasks.service import TaskGenerationService
from app.modules.users.models import User

router = APIRouter(prefix="/system/tasks", tags=["system"])
patient_tasks_router = APIRouter(prefix="/patient/tasks", tags=["patient-tasks"])


@router.post("/generate", status_code=status.HTTP_200_OK)
async def generate_tasks(
    x_internal_key: str | None = Header(default=None),
    session: AsyncSession = Depends(get_db),
) -> dict[str, int]:
    if x_internal_key != settings.INTERNAL_KEY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    service = TaskGenerationService(session)
    generated = await service.generate_all()
    return {"generated": generated}


@patient_tasks_router.get("", response_model=list[TaskOut])
async def list_patient_tasks(
    current_user: User = Depends(require_patient),
    patient_repo: PatientRepository = Depends(get_patient_repository),
    session: AsyncSession = Depends(get_db),
) -> list[TaskOut]:
    patient = await patient_repo.get_by_user_id(current_user.id)
    if patient is None:
        return []
    task_repo = TaskRepository(session)
    tasks = await task_repo.list_pending_by_patient(patient.id)
    return [TaskOut.model_validate(t) for t in tasks]
