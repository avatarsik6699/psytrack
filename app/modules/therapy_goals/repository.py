from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.therapy_goals.models import TherapyGoal


class TherapyGoalRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, goal: TherapyGoal) -> TherapyGoal:
        self._session.add(goal)
        await self._session.flush()
        return goal

    async def get_by_patient_and_id(self, patient_id: UUID, goal_id: UUID) -> TherapyGoal | None:
        return await self._session.scalar(
            select(TherapyGoal).where(
                TherapyGoal.id == goal_id,
                TherapyGoal.patient_id == patient_id,
            )
        )

    async def list_by_patient(self, patient_id: UUID) -> list[TherapyGoal]:
        result = await self._session.scalars(
            select(TherapyGoal)
            .where(TherapyGoal.patient_id == patient_id)
            .order_by(TherapyGoal.created_at.asc())
        )
        return list(result)
