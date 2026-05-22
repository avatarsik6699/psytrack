from uuid import UUID

from fastapi import HTTPException

from app.modules.therapy_goals.models import TherapyGoal
from app.modules.therapy_goals.repository import TherapyGoalRepository
from app.modules.therapy_goals.schemas import TherapyGoalCreate, TherapyGoalUpdate


class TherapyGoalService:
    def __init__(self, repository: TherapyGoalRepository) -> None:
        self._repository = repository

    async def list_for_patient(self, patient_id: UUID) -> list[TherapyGoal]:
        return await self._repository.list_by_patient(patient_id)

    async def create(self, data: TherapyGoalCreate, patient_id: UUID) -> TherapyGoal:
        goal = TherapyGoal(patient_id=patient_id, description=data.description)
        return await self._repository.add(goal)

    async def update(
        self, patient_id: UUID, goal_id: UUID, data: TherapyGoalUpdate
    ) -> TherapyGoal:
        goal = await self._repository.get_by_patient_and_id(patient_id, goal_id)
        if goal is None:
            raise HTTPException(status_code=404, detail="Therapy goal not found")
        if data.description is not None:
            goal.description = data.description
        if data.is_completed is not None:
            goal.is_completed = data.is_completed
        await self._repository._session.flush()
        return goal
