from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.tasks.models import Task


class TaskRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, task: Task) -> Task:
        self._session.add(task)
        await self._session.flush()
        return task

    async def add_many(self, tasks: list[Task]) -> int:
        for task in tasks:
            self._session.add(task)
        await self._session.flush()
        return len(tasks)

    async def list_pending_by_patient(self, patient_id: UUID) -> list[Task]:
        rows = await self._session.scalars(
            select(Task)
            .where(Task.patient_id == patient_id, Task.status == "pending")
            .order_by(Task.due_at)
        )
        return list(rows)

    async def has_pending_task(
        self,
        patient_id: UUID,
        task_type: str,
        reference_id: UUID | None,
        due_after: datetime,
    ) -> bool:
        stmt = select(Task).where(
            Task.patient_id == patient_id,
            Task.task_type == task_type,
            Task.status == "pending",
            Task.due_at >= due_after,
        )
        if reference_id is not None:
            stmt = stmt.where(Task.reference_id == reference_id)
        result = await self._session.scalar(stmt)
        return result is not None
