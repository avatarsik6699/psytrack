from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.dependencies import require_doctor
from app.modules.doctors.dependencies import get_doctor_service
from app.modules.doctors.service import DoctorService
from app.modules.patients.dependencies import get_patient_service
from app.modules.patients.service import PatientService
from app.modules.therapy_goals.repository import TherapyGoalRepository
from app.modules.therapy_goals.schemas import TherapyGoalCreate, TherapyGoalOut, TherapyGoalUpdate
from app.modules.therapy_goals.service import TherapyGoalService
from app.modules.users.models import User


def get_therapy_goal_service(session: AsyncSession = Depends(get_db)) -> TherapyGoalService:
    return TherapyGoalService(TherapyGoalRepository(session))


router = APIRouter(
    prefix="/doctor/patients/{patient_id}/goals", tags=["therapy-goals"]
)


@router.get("", response_model=list[TherapyGoalOut])
async def list_goals(
    patient_id: UUID,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    goal_service: TherapyGoalService = Depends(get_therapy_goal_service),
) -> list[TherapyGoalOut]:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    goals = await goal_service.list_for_patient(patient_id)
    return [TherapyGoalOut.model_validate(g) for g in goals]


@router.post("", response_model=TherapyGoalOut, status_code=status.HTTP_201_CREATED)
async def create_goal(
    patient_id: UUID,
    body: TherapyGoalCreate,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    goal_service: TherapyGoalService = Depends(get_therapy_goal_service),
) -> TherapyGoalOut:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    goal = await goal_service.create(body, patient_id)
    return TherapyGoalOut.model_validate(goal)


@router.patch("/{goal_id}", response_model=TherapyGoalOut)
async def update_goal(
    patient_id: UUID,
    goal_id: UUID,
    body: TherapyGoalUpdate,
    current_user: User = Depends(require_doctor),
    doctor_service: DoctorService = Depends(get_doctor_service),
    patient_service: PatientService = Depends(get_patient_service),
    goal_service: TherapyGoalService = Depends(get_therapy_goal_service),
) -> TherapyGoalOut:
    profile = await doctor_service.get_for_user(current_user.id)
    await patient_service.get_for_doctor(patient_id, profile.id)
    goal = await goal_service.update(patient_id, goal_id, body)
    return TherapyGoalOut.model_validate(goal)
