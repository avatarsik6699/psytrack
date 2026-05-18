from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.events.repository import EventLogRepository
from app.modules.side_effects.repository import (
    PatientSideEffectRepository,
    SeDictionaryRepository,
    SeMonitoringRuleRepository,
)
from app.modules.side_effects.service import (
    PatientSideEffectService,
    SeDictionaryService,
    SeMonitoringRuleService,
    SeSeverityChartService,
)


def get_se_dictionary_repository(session: AsyncSession = Depends(get_db)) -> SeDictionaryRepository:
    return SeDictionaryRepository(session)


def get_se_dictionary_service(
    repository: SeDictionaryRepository = Depends(get_se_dictionary_repository),
) -> SeDictionaryService:
    return SeDictionaryService(repository)


def get_patient_se_repository(session: AsyncSession = Depends(get_db)) -> PatientSideEffectRepository:
    return PatientSideEffectRepository(session)


def get_patient_se_service(
    repository: PatientSideEffectRepository = Depends(get_patient_se_repository),
) -> PatientSideEffectService:
    return PatientSideEffectService(repository)


def get_se_monitoring_rule_repository(
    session: AsyncSession = Depends(get_db),
) -> SeMonitoringRuleRepository:
    return SeMonitoringRuleRepository(session)


def get_se_monitoring_rule_service(
    repository: SeMonitoringRuleRepository = Depends(get_se_monitoring_rule_repository),
) -> SeMonitoringRuleService:
    return SeMonitoringRuleService(repository)


def get_se_chart_service() -> SeSeverityChartService:
    return SeSeverityChartService()


def get_event_log_repository(session: AsyncSession = Depends(get_db)) -> EventLogRepository:
    return EventLogRepository(session)
