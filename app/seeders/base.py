from abc import ABC, abstractmethod

from sqlalchemy.ext.asyncio import AsyncSession


class BaseSeeder(ABC):
    name: str
    description: str

    @abstractmethod
    async def run(self, session: AsyncSession) -> int:
        """Insert seed data. Returns number of rows actually written (skips existing)."""
        ...
