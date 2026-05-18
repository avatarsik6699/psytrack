from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.events.models import EventLog


class EventLogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, event: EventLog) -> EventLog:
        self._session.add(event)
        await self._session.flush()
        return event

    async def emit(
        self,
        patient_id: UUID,
        event_type: str,
        payload: dict[str, Any] | None = None,
        occurred_at: datetime | None = None,
        created_by: UUID | None = None,
    ) -> EventLog:
        event = EventLog(
            patient_id=patient_id,
            event_type=event_type,
            payload=payload,
            occurred_at=occurred_at or datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
            created_by=created_by,
        )
        return await self.add(event)

    async def paginate_by_patient(
        self,
        patient_id: UUID,
        page: int,
        size: int,
    ) -> tuple[list[EventLog], int]:
        stmt = select(EventLog).where(EventLog.patient_id == patient_id)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total: int = (await self._session.scalar(count_stmt)) or 0

        offset = (page - 1) * size
        rows = await self._session.scalars(
            stmt.order_by(EventLog.occurred_at.desc()).offset(offset).limit(size)
        )
        return list(rows), total
