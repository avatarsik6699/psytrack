from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.side_effects.models import PatientSideEffect, SeDictionary, SeMonitoringRule


class SeDictionaryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def search(
        self,
        q: str | None,
        body_system: str | None,
        page: int,
        size: int,
    ) -> tuple[list[SeDictionary], int]:
        stmt = select(SeDictionary)
        if q:
            pattern = f"%{q}%"
            stmt = stmt.where(
                or_(
                    SeDictionary.name_ru.ilike(pattern),
                    SeDictionary.name_en.ilike(pattern),
                    SeDictionary.uku_code.ilike(pattern),
                )
            )
        if body_system:
            stmt = stmt.where(SeDictionary.body_system == body_system)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total: int = (await self._session.scalar(count_stmt)) or 0

        offset = (page - 1) * size
        rows = await self._session.scalars(stmt.order_by(SeDictionary.uku_code).offset(offset).limit(size))
        return list(rows), total

    async def get_by_id(self, se_id: UUID) -> SeDictionary | None:
        return await self._session.scalar(
            select(SeDictionary).where(SeDictionary.id == se_id)
        )


class PatientSideEffectRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, pse: PatientSideEffect) -> PatientSideEffect:
        self._session.add(pse)
        await self._session.flush()
        return pse

    async def get_with_se(self, pse_id: UUID) -> PatientSideEffect | None:
        return await self._session.scalar(
            select(PatientSideEffect)
            .where(PatientSideEffect.id == pse_id, PatientSideEffect.deleted_at.is_(None))
            .options(selectinload(PatientSideEffect.se))
        )

    async def get_by_patient_and_id(self, patient_id: UUID, pse_id: UUID) -> PatientSideEffect | None:
        return await self._session.scalar(
            select(PatientSideEffect)
            .where(
                PatientSideEffect.id == pse_id,
                PatientSideEffect.patient_id == patient_id,
                PatientSideEffect.deleted_at.is_(None),
            )
            .options(selectinload(PatientSideEffect.se))
        )

    async def list_active_by_patient(self, patient_id: UUID) -> list[PatientSideEffect]:
        rows = await self._session.scalars(
            select(PatientSideEffect)
            .where(
                PatientSideEffect.patient_id == patient_id,
                PatientSideEffect.deleted_at.is_(None),
            )
            .options(selectinload(PatientSideEffect.se))
            .order_by(PatientSideEffect.created_at.desc())
        )
        return list(rows)

    async def list_all_by_patient(self, patient_id: UUID) -> list[PatientSideEffect]:
        rows = await self._session.scalars(
            select(PatientSideEffect)
            .where(PatientSideEffect.patient_id == patient_id)
            .options(selectinload(PatientSideEffect.se))
            .order_by(PatientSideEffect.created_at.asc())
        )
        return list(rows)

    async def flush(self) -> None:
        await self._session.flush()


class SeMonitoringRuleRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, rule: SeMonitoringRule) -> SeMonitoringRule:
        self._session.add(rule)
        await self._session.flush()
        return rule

    async def get_by_patient_and_id(self, patient_id: UUID, rule_id: UUID) -> SeMonitoringRule | None:
        return await self._session.scalar(
            select(SeMonitoringRule)
            .where(
                SeMonitoringRule.id == rule_id,
                SeMonitoringRule.patient_id == patient_id,
            )
            .options(selectinload(SeMonitoringRule.se))
        )

    async def list_by_patient(self, patient_id: UUID) -> list[SeMonitoringRule]:
        rows = await self._session.scalars(
            select(SeMonitoringRule)
            .where(SeMonitoringRule.patient_id == patient_id)
            .options(selectinload(SeMonitoringRule.se))
            .order_by(SeMonitoringRule.created_at.desc())
        )
        return list(rows)

    async def delete(self, rule: SeMonitoringRule) -> None:
        await self._session.delete(rule)
        await self._session.flush()
