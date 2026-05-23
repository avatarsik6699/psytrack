"""Integration tests for TaskGenerationService business logic (Phase 06).

These tests verify that the service creates the right tasks, respects
filtering conditions, and deduplicates correctly — things the HTTP-layer
tests in test_phase06.py do not cover.
"""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from uuid import UUID

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.diagnoses.models import Diagnosis
from app.modules.medications.models import MedicationReference, PatientMedication
from app.modules.patients.models import Patient
from app.modules.scales.models import PatientScale, Scale, TestCompletion
from app.modules.side_effects.models import SeDictionary, SeMonitoringRule
from app.modules.tasks.models import Task
from app.modules.tasks.service import TaskGenerationService


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------


async def _register_doctor(client: AsyncClient, suffix: str) -> str:
    return await client.create_doctor_token(f"tgen_{suffix}@test.com", f"Dr TGen {suffix}")


async def _create_patient(client: AsyncClient, token: str, name: str = "TGen Patient") -> UUID:
    resp = await client.post(
        "/api/v1/doctor/patients",
        headers={"Authorization": f"Bearer {token}"},
        json={"full_name": name},
    )
    assert resp.status_code == 201, resp.text
    return UUID(resp.json()["id"])


async def _get_doctor_profile_id(session: AsyncSession, patient_id: UUID) -> UUID:
    """Return the DoctorProfile.id that owns the given patient."""
    patient = await session.scalar(select(Patient).where(Patient.id == patient_id))
    assert patient is not None
    return patient.doctor_id


async def _create_med_ref(session: AsyncSession, inn: str) -> UUID:
    ref = MedicationReference(inn=inn)
    session.add(ref)
    await session.flush()
    return ref.id


async def _create_scale(session: AsyncSession, code: str) -> UUID:
    scale = Scale(
        code=code,
        name=f"Scale {code}",
        score_min=0,
        score_max=100,
        questions_json=[],
    )
    session.add(scale)
    await session.flush()
    return scale.id


async def _create_se_dict(session: AsyncSession, uku_code: str) -> UUID:
    se = SeDictionary(uku_code=uku_code, name_ru="Тестовый НЯ", name_en="Test SE")
    session.add(se)
    await session.flush()
    return se.id


# ---------------------------------------------------------------------------
# Medication log tests
# ---------------------------------------------------------------------------


async def test_medication_task_created_for_active_medication(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Active medication (started_at set, ended_at None) gets a medication_log task."""
    token = await _register_doctor(client, "mlog01")
    patient_id = await _create_patient(client, token)
    med_ref_id = await _create_med_ref(db_session, "inn-mlog-01")

    db_session.add(
        PatientMedication(
            patient_id=patient_id,
            medication_id=med_ref_id,
            started_at=date.today(),
        )
    )
    await db_session.flush()

    svc = TaskGenerationService(db_session)
    generated = await svc.generate_all()

    assert generated >= 1
    tasks = list(
        await db_session.scalars(
            select(Task).where(
                Task.patient_id == patient_id,
                Task.task_type == "medication_log",
            )
        )
    )
    assert len(tasks) == 1
    assert tasks[0].status == "pending"
    assert tasks[0].reference_id is not None


async def test_medication_task_skipped_for_inactive_medication(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Medication with ended_at set is not active — no task must be generated."""
    token = await _register_doctor(client, "mlog02")
    patient_id = await _create_patient(client, token)
    med_ref_id = await _create_med_ref(db_session, "inn-mlog-02")

    db_session.add(
        PatientMedication(
            patient_id=patient_id,
            medication_id=med_ref_id,
            started_at=date.today() - timedelta(days=30),
            ended_at=date.today() - timedelta(days=1),
        )
    )
    await db_session.flush()

    svc = TaskGenerationService(db_session)
    await svc.generate_all()

    tasks = list(
        await db_session.scalars(
            select(Task).where(
                Task.patient_id == patient_id,
                Task.task_type == "medication_log",
            )
        )
    )
    assert len(tasks) == 0


# ---------------------------------------------------------------------------
# SE report tests
# ---------------------------------------------------------------------------


async def test_se_report_task_created_with_future_due_at(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """SE report task must be scheduled frequency_days into the future."""
    token = await _register_doctor(client, "se01")
    patient_id = await _create_patient(client, token)
    se_id = await _create_se_dict(db_session, "UKU-TST-SE01")
    now = datetime.now(UTC)

    db_session.add(
        SeMonitoringRule(
            patient_id=patient_id,
            se_id=se_id,
            frequency_days=7,
            created_at=now,
        )
    )
    await db_session.flush()

    svc = TaskGenerationService(db_session)
    generated = await svc.generate_all()

    assert generated >= 1
    tasks = list(
        await db_session.scalars(
            select(Task).where(
                Task.patient_id == patient_id,
                Task.task_type == "se_report",
            )
        )
    )
    assert len(tasks) == 1
    task = tasks[0]
    assert task.status == "pending"
    expected_due = now + timedelta(days=7)
    task_due = (
        task.due_at if task.due_at.tzinfo else task.due_at.replace(tzinfo=UTC)
    )
    assert abs((task_due - expected_due).total_seconds()) < 5


async def test_se_report_task_skipped_when_frequency_days_is_none(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """SeMonitoringRule with frequency_days=None must produce no task."""
    token = await _register_doctor(client, "se02")
    patient_id = await _create_patient(client, token)
    se_id = await _create_se_dict(db_session, "UKU-TST-SE02")
    now = datetime.now(UTC)

    db_session.add(
        SeMonitoringRule(
            patient_id=patient_id,
            se_id=se_id,
            frequency_days=None,
            created_at=now,
        )
    )
    await db_session.flush()

    svc = TaskGenerationService(db_session)
    await svc.generate_all()

    tasks = list(
        await db_session.scalars(
            select(Task).where(
                Task.patient_id == patient_id,
                Task.task_type == "se_report",
            )
        )
    )
    assert len(tasks) == 0


# ---------------------------------------------------------------------------
# Test reminder tests
# ---------------------------------------------------------------------------


async def test_test_reminder_created_for_scale_with_no_completions(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """PatientScale with no TestCompletion records always generates a test task."""
    token = await _register_doctor(client, "trem01")
    patient_id = await _create_patient(client, token)
    doctor_profile_id = await _get_doctor_profile_id(db_session, patient_id)
    scale_id = await _create_scale(db_session, "TST-TREM-01")

    diagnosis = Diagnosis(
        patient_id=patient_id,
        icd_code="F20.9",
        name="Test Diagnosis",
        is_primary=True,
    )
    db_session.add(diagnosis)
    await db_session.flush()

    db_session.add(
        PatientScale(
            patient_id=patient_id,
            diagnosis_id=diagnosis.id,
            scale_id=scale_id,
            frequency_days=28,
            assigned_by=doctor_profile_id,
        )
    )
    await db_session.flush()

    svc = TaskGenerationService(db_session)
    generated = await svc.generate_all()

    assert generated >= 1
    tasks = list(
        await db_session.scalars(
            select(Task).where(
                Task.patient_id == patient_id,
                Task.task_type == "test",
            )
        )
    )
    assert len(tasks) == 1


async def test_test_reminder_skipped_when_not_due_yet(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """PatientScale with a recent completion (next_due > now) must not get a task."""
    token = await _register_doctor(client, "trem02")
    patient_id = await _create_patient(client, token)
    doctor_profile_id = await _get_doctor_profile_id(db_session, patient_id)
    scale_id = await _create_scale(db_session, "TST-TREM-02")

    diagnosis = Diagnosis(
        patient_id=patient_id,
        icd_code="F20.9",
        name="Test Diagnosis 2",
        is_primary=True,
    )
    db_session.add(diagnosis)
    await db_session.flush()

    patient_scale = PatientScale(
        patient_id=patient_id,
        diagnosis_id=diagnosis.id,
        scale_id=scale_id,
        frequency_days=28,
        assigned_by=doctor_profile_id,
    )
    db_session.add(patient_scale)
    await db_session.flush()

    # Completed 1 day ago → next_due = 27 days from now → not yet due
    now = datetime.now(UTC)
    db_session.add(
        TestCompletion(
            patient_id=patient_id,
            patient_scale_id=patient_scale.id,
            scale_id=scale_id,
            score=50,
            answers_json=[],
            completed_at=now - timedelta(days=1),
        )
    )
    await db_session.flush()

    svc = TaskGenerationService(db_session)
    await svc.generate_all()

    tasks = list(
        await db_session.scalars(
            select(Task).where(
                Task.patient_id == patient_id,
                Task.task_type == "test",
            )
        )
    )
    assert len(tasks) == 0


# ---------------------------------------------------------------------------
# Service-level deduplication
# ---------------------------------------------------------------------------


async def test_service_level_deduplication(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Calling generate_all() twice must create tasks only on the first call."""
    token = await _register_doctor(client, "dedup01")
    patient_id = await _create_patient(client, token)
    med_ref_id = await _create_med_ref(db_session, "inn-dedup-01")

    db_session.add(
        PatientMedication(
            patient_id=patient_id,
            medication_id=med_ref_id,
            started_at=date.today(),
        )
    )
    await db_session.flush()

    svc = TaskGenerationService(db_session)
    first = await svc.generate_all()
    assert first >= 1

    second = await svc.generate_all()
    assert second == 0
