from datetime import datetime, timezone
from typing import Any
from uuid import UUID

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
