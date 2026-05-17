from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.events.repository import EventLogRepository
from app.modules.scales.repository import (
    PatientScaleRepository,
    ScaleRepository,
    TestCompletionRepository,
)
from app.modules.scales.service import PatientScaleService, ScaleService, TestCompletionService


def get_scale_repository(session: AsyncSession = Depends(get_db)) -> ScaleRepository:
    return ScaleRepository(session)


def get_scale_service(
    repository: ScaleRepository = Depends(get_scale_repository),
) -> ScaleService:
    return ScaleService(repository)


def get_patient_scale_repository(session: AsyncSession = Depends(get_db)) -> PatientScaleRepository:
    return PatientScaleRepository(session)


def get_test_completion_repository(
    session: AsyncSession = Depends(get_db),
) -> TestCompletionRepository:
    return TestCompletionRepository(session)


def get_patient_scale_service(
    repository: PatientScaleRepository = Depends(get_patient_scale_repository),
    tc_repository: TestCompletionRepository = Depends(get_test_completion_repository),
) -> PatientScaleService:
    return PatientScaleService(repository, tc_repository)


def get_event_log_repository(session: AsyncSession = Depends(get_db)) -> EventLogRepository:
    return EventLogRepository(session)


def get_test_completion_service(
    tc_repo: TestCompletionRepository = Depends(get_test_completion_repository),
    ps_repo: PatientScaleRepository = Depends(get_patient_scale_repository),
    event_repo: EventLogRepository = Depends(get_event_log_repository),
) -> TestCompletionService:
    return TestCompletionService(tc_repo, ps_repo, event_repo)
