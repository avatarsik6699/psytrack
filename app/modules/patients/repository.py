from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.patients.color_service import ColorInputs
from app.modules.patients.models import Patient


class PatientRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_temp_login(self, temp_login: str) -> Patient | None:
        return await self._session.scalar(
            select(Patient).where(Patient.temp_login == temp_login)
        )

    async def add(self, patient: Patient) -> Patient:
        self._session.add(patient)
        await self._session.flush()
        return patient

    async def list_by_doctor(self, doctor_id: UUID) -> list[Patient]:
        result = await self._session.scalars(
            select(Patient)
            .where(Patient.doctor_id == doctor_id, Patient.archived_at.is_(None))
            .order_by(Patient.full_name)
        )
        return list(result)

    async def get_by_id(self, patient_id: UUID) -> Patient | None:
        return await self._session.scalar(select(Patient).where(Patient.id == patient_id))

    async def get_by_doctor_and_id(self, doctor_id: UUID, patient_id: UUID) -> Patient | None:
        return await self._session.scalar(
            select(Patient).where(Patient.id == patient_id, Patient.doctor_id == doctor_id)
        )

    async def get_by_user_id(self, user_id: UUID) -> Patient | None:
        return await self._session.scalar(select(Patient).where(Patient.user_id == user_id))

    async def get_color_inputs(self, patient_id: UUID) -> ColorInputs:
        from app.modules.diagnoses.models import Diagnosis
        from app.modules.medications.models import PatientMedication
        from app.modules.scales.models import ClinicalRule, PatientScale, Scale, TestCompletion
        from app.modules.side_effects.models import PatientSideEffect

        # Active SE severities (not deleted, not resolved)
        se_rows = await self._session.scalars(
            select(PatientSideEffect.severity).where(
                PatientSideEffect.patient_id == patient_id,
                PatientSideEffect.deleted_at.is_(None),
                PatientSideEffect.resolved.is_(False),
                PatientSideEffect.severity.is_not(None),
            )
        )
        se_severities = [s for s in se_rows if s is not None]

        # Therapy start: earliest started_at from active patient_medications
        therapy_start_date = await self._session.scalar(
            select(func.min(PatientMedication.started_at)).where(
                PatientMedication.patient_id == patient_id,
                PatientMedication.ended_at.is_(None),
            )
        )
        therapy_start: datetime | None = None
        if therapy_start_date is not None:
            therapy_start = datetime(
                therapy_start_date.year,
                therapy_start_date.month,
                therapy_start_date.day,
                tzinfo=timezone.utc,
            )

        # Primary diagnosis ICD code
        primary_diag = await self._session.scalar(
            select(Diagnosis.icd_code).where(
                Diagnosis.patient_id == patient_id,
                Diagnosis.is_primary.is_(True),
            )
        )

        baseline_score: int | None = None
        latest_score: int | None = None
        control_point_days: int | None = None
        response_threshold_pct: int | None = None
        response_threshold_abs: int | None = None
        improvement_direction: str | None = None

        if primary_diag:
            # Clinical rule for the primary diagnosis's scale
            rule_row = await self._session.execute(
                select(
                    ClinicalRule.control_point_days,
                    ClinicalRule.response_threshold_pct,
                    ClinicalRule.response_threshold_abs,
                    Scale.improvement_direction,
                    ClinicalRule.scale_id,
                )
                .join(Scale, Scale.id == ClinicalRule.scale_id)
                .where(ClinicalRule.diagnosis_icd == primary_diag)
                .limit(1)
            )
            rule = rule_row.first()
            if rule is not None:
                control_point_days = rule.control_point_days
                response_threshold_pct = rule.response_threshold_pct
                response_threshold_abs = rule.response_threshold_abs
                improvement_direction = rule.improvement_direction
                scale_id = rule.scale_id

                # Baseline: most recent TestCompletion with baseline=True for this scale
                baseline_score = await self._session.scalar(
                    select(TestCompletion.score)
                    .join(PatientScale, PatientScale.id == TestCompletion.patient_scale_id)
                    .where(
                        TestCompletion.patient_id == patient_id,
                        TestCompletion.scale_id == scale_id,
                        TestCompletion.baseline.is_(True),
                    )
                    .order_by(TestCompletion.completed_at.desc())
                    .limit(1)
                )

                # Latest: most recent non-baseline TestCompletion
                latest_score = await self._session.scalar(
                    select(TestCompletion.score)
                    .where(
                        TestCompletion.patient_id == patient_id,
                        TestCompletion.scale_id == scale_id,
                        TestCompletion.baseline.is_(False),
                    )
                    .order_by(TestCompletion.completed_at.desc())
                    .limit(1)
                )

        return ColorInputs(
            se_severities=se_severities,
            therapy_start=therapy_start,
            baseline_score=baseline_score,
            latest_score=latest_score,
            control_point_days=control_point_days,
            response_threshold_pct=response_threshold_pct,
            response_threshold_abs=response_threshold_abs,
            improvement_direction=improvement_direction,
        )
