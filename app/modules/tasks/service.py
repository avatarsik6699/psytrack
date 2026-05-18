from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.medications.models import PatientMedication
from app.modules.scales.models import PatientScale, TestCompletion
from app.modules.side_effects.models import SeMonitoringRule
from app.modules.tasks.models import Task
from app.modules.tasks.repository import TaskRepository


class TaskGenerationService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = TaskRepository(session)

    async def generate_all(self) -> int:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        generated = 0

        generated += await self._generate_medication_log_tasks(now, today_start)
        generated += await self._generate_test_reminder_tasks(now, today_start)
        generated += await self._generate_se_report_tasks(now, today_start)

        return generated

    async def _generate_medication_log_tasks(
        self, now: datetime, today_start: datetime
    ) -> int:
        rows = await self._session.scalars(
            select(PatientMedication).where(
                PatientMedication.ended_at.is_(None),
                PatientMedication.started_at.is_not(None),
            )
        )
        meds = list(rows)
        count = 0
        for med in meds:
            already = await self._repo.has_pending_task(
                patient_id=med.patient_id,
                task_type="medication_log",
                reference_id=med.id,
                due_after=today_start,
            )
            if not already:
                self._session.add(
                    Task(
                        patient_id=med.patient_id,
                        task_type="medication_log",
                        reference_id=med.id,
                        due_at=now,
                        status="pending",
                        created_at=now,
                    )
                )
                count += 1
        await self._session.flush()
        return count

    async def _generate_test_reminder_tasks(
        self, now: datetime, today_start: datetime
    ) -> int:
        rows = await self._session.scalars(select(PatientScale))
        scales = list(rows)
        count = 0
        for ps in scales:
            last_completion = await self._session.scalar(
                select(TestCompletion.completed_at)
                .where(TestCompletion.patient_scale_id == ps.id)
                .order_by(TestCompletion.completed_at.desc())
                .limit(1)
            )
            if last_completion is not None:
                # SQLite returns naive datetimes; normalise before comparison
                if last_completion.tzinfo is None:
                    last_completion = last_completion.replace(tzinfo=timezone.utc)
                next_due = last_completion + timedelta(days=ps.frequency_days)
                if next_due > now:
                    continue

            already = await self._repo.has_pending_task(
                patient_id=ps.patient_id,
                task_type="test",
                reference_id=ps.id,
                due_after=today_start,
            )
            if not already:
                self._session.add(
                    Task(
                        patient_id=ps.patient_id,
                        task_type="test",
                        reference_id=ps.id,
                        due_at=now,
                        status="pending",
                        created_at=now,
                    )
                )
                count += 1
        await self._session.flush()
        return count

    async def _generate_se_report_tasks(
        self, now: datetime, today_start: datetime
    ) -> int:
        rows = await self._session.scalars(select(SeMonitoringRule))
        rules = list(rows)
        count = 0
        for rule in rules:
            if rule.frequency_days is None:
                continue
            window_start = now - timedelta(days=rule.frequency_days)
            already = await self._repo.has_pending_task(
                patient_id=rule.patient_id,
                task_type="se_report",
                reference_id=rule.id,
                due_after=window_start,
            )
            if not already:
                self._session.add(
                    Task(
                        patient_id=rule.patient_id,
                        task_type="se_report",
                        reference_id=rule.id,
                        due_at=now + timedelta(days=rule.frequency_days),
                        status="pending",
                        created_at=now,
                    )
                )
                count += 1
        await self._session.flush()
        return count
