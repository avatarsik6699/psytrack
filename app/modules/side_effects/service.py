from datetime import datetime, timezone
from uuid import UUID

from app.modules.events.repository import EventLogRepository
from app.modules.side_effects.exceptions import PatientSideEffectNotFound, SeMonitoringRuleNotFound
from app.modules.side_effects.models import PatientSideEffect, SeDictionary, SeMonitoringRule
from app.modules.side_effects.repository import (
    PatientSideEffectRepository,
    SeDictionaryRepository,
    SeMonitoringRuleRepository,
)
from app.modules.side_effects.schemas import (
    PatientSideEffectIn,
    PatientSideEffectUpdate,
    SeDictionaryOut,
    SeDictionaryPage,
    SeMonitoringRuleIn,
    SeSeverityDataPoint,
)


class SeDictionaryService:
    def __init__(self, repository: SeDictionaryRepository) -> None:
        self._repository = repository

    async def search(
        self,
        q: str | None,
        body_system: str | None,
        page: int,
        size: int,
    ) -> SeDictionaryPage:
        items, total = await self._repository.search(q, body_system, page, size)
        return SeDictionaryPage(
            items=[SeDictionaryOut.model_validate(i) for i in items],
            total=total,
        )

    async def get_by_id(self, se_id: UUID) -> SeDictionary:
        entry = await self._repository.get_by_id(se_id)
        if entry is None:
            from app.modules.side_effects.exceptions import SeDictionaryEntryNotFound
            raise SeDictionaryEntryNotFound()
        return entry


class PatientSideEffectService:
    def __init__(self, repository: PatientSideEffectRepository) -> None:
        self._repository = repository

    async def list_for_patient(self, patient_id: UUID) -> list[PatientSideEffect]:
        return await self._repository.list_active_by_patient(patient_id)

    async def list_all_for_chart(self, patient_id: UUID) -> list[PatientSideEffect]:
        return await self._repository.list_all_by_patient(patient_id)

    async def get_for_patient(self, patient_id: UUID, pse_id: UUID) -> PatientSideEffect:
        pse = await self._repository.get_by_patient_and_id(patient_id, pse_id)
        if pse is None:
            raise PatientSideEffectNotFound()
        return pse

    async def create(
        self,
        data: PatientSideEffectIn,
        patient_id: UUID,
        created_by: UUID,
        event_repo: EventLogRepository,
    ) -> PatientSideEffect:
        now = datetime.now(timezone.utc)
        pse = PatientSideEffect(
            patient_id=patient_id,
            se_id=data.se_id,
            severity=data.severity,
            started_at=data.started_at,
            ended_at=data.ended_at,
            date_precision=data.date_precision,
            duration_label=data.duration_label,
            notes=data.notes,
            resolved=False,
            created_at=now,
        )
        pse = await self._repository.add(pse)
        await event_repo.emit(
            patient_id=patient_id,
            event_type="se_reported_start",
            payload={"se_id": str(data.se_id), "severity": data.severity},
            occurred_at=now,
            created_by=created_by,
        )
        result = await self._repository.get_with_se(pse.id)
        return result  # type: ignore[return-value]

    async def update(
        self,
        pse: PatientSideEffect,
        data: PatientSideEffectUpdate,
        patient_id: UUID,
        created_by: UUID,
        event_repo: EventLogRepository,
    ) -> PatientSideEffect:
        updates = data.model_dump(exclude_unset=True)
        was_resolved = pse.resolved
        old_severity = pse.severity

        for field, value in updates.items():
            setattr(pse, field, value)
        await self._repository.flush()

        now = datetime.now(timezone.utc)
        if not was_resolved and pse.resolved:
            event_type = "se_resolved"
        elif "severity" in updates and pse.severity != old_severity:
            event_type = "se_severity_updated"
        else:
            event_type = "se_correction"

        await event_repo.emit(
            patient_id=patient_id,
            event_type=event_type,
            payload={"se_id": str(pse.se_id), "severity": pse.severity, "resolved": pse.resolved},
            occurred_at=now,
            created_by=created_by,
        )
        result = await self._repository.get_with_se(pse.id)
        return result  # type: ignore[return-value]

    async def soft_delete(
        self,
        pse: PatientSideEffect,
        patient_id: UUID,
        created_by: UUID,
        event_repo: EventLogRepository,
    ) -> None:
        now = datetime.now(timezone.utc)
        pse.deleted_at = now
        await self._repository.flush()


class SeMonitoringRuleService:
    def __init__(self, repository: SeMonitoringRuleRepository) -> None:
        self._repository = repository

    async def list_for_patient(self, patient_id: UUID) -> list[SeMonitoringRule]:
        return await self._repository.list_by_patient(patient_id)

    async def create(
        self,
        data: SeMonitoringRuleIn,
        patient_id: UUID,
        doctor_profile_id: UUID,
        event_repo: EventLogRepository,
        created_by: UUID | None = None,
    ) -> SeMonitoringRule:
        now = datetime.now(timezone.utc)
        rule = SeMonitoringRule(
            patient_id=patient_id,
            se_id=data.se_id,
            frequency_days=data.frequency_days,
            assigned_by=doctor_profile_id,
            created_at=now,
        )
        rule = await self._repository.add(rule)
        await event_repo.emit(
            patient_id=patient_id,
            event_type="monitoring_rule_changed",
            payload={"action": "added", "se_id": str(data.se_id), "rule_id": str(rule.id)},
            occurred_at=now,
            created_by=created_by,
        )
        result = await self._repository.get_by_patient_and_id(patient_id, rule.id)
        return result  # type: ignore[return-value]

    async def delete(
        self,
        patient_id: UUID,
        rule_id: UUID,
        doctor_profile_id: UUID,
        event_repo: EventLogRepository,
        created_by: UUID | None = None,
    ) -> None:
        rule = await self._repository.get_by_patient_and_id(patient_id, rule_id)
        if rule is None:
            raise SeMonitoringRuleNotFound()
        now = datetime.now(timezone.utc)
        await event_repo.emit(
            patient_id=patient_id,
            event_type="monitoring_rule_changed",
            payload={"action": "removed", "se_id": str(rule.se_id), "rule_id": str(rule.id)},
            occurred_at=now,
            created_by=created_by,
        )
        await self._repository.delete(rule)


class SeSeverityChartService:
    def build_chart(
        self,
        pses: list[PatientSideEffect],
        locale: str = "ru",
    ) -> list[SeSeverityDataPoint]:
        points: list[SeSeverityDataPoint] = []
        for pse in pses:
            if pse.severity is None or pse.deleted_at is not None:
                continue
            date_str = (pse.started_at or pse.created_at).date().isoformat()
            se_name = pse.se.name_ru if locale == "ru" else pse.se.name_en
            points.append(
                SeSeverityDataPoint(
                    date=date_str,
                    se_id=str(pse.se_id),
                    se_name=se_name,
                    severity=pse.severity,
                )
            )
        return sorted(points, key=lambda p: p.date)
