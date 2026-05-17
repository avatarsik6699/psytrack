from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.events.models import EventLog


class EventLogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, event: EventLog) -> EventLog:
        self._session.add(event)
        await self._session.flush()
        return event
