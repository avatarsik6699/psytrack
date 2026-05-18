"""Dev/demo data seeder.

Creates one doctor account and five patients with realistic clinical data.
Idempotent: skips if demo doctor already exists (keyed on email).

Fixed credentials
-----------------
Doctor  : email=demo@docassist.dev  password=Demo1234!
Patient1: temp_login=demo.p1        password=Patient1!   (richest data)
Patient2: temp_login=demo.p2        password=Patient2!
Patient3: temp_login=demo.p3        password=Patient3!
Patient4: temp_login=demo.p4        password=Patient4!
Patient5: temp_login=demo.p5        password=Patient5!
"""

from datetime import UTC, date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.utils import hash_password
from app.modules.diagnoses.models import Diagnosis
from app.modules.doctors.models import DoctorProfile
from app.modules.events.models import EventLog
from app.modules.medications.models import MedicationReference, PatientMedication
from app.modules.patients.models import Patient
from app.modules.scales.models import PatientScale, Scale, TestCompletion
from app.modules.side_effects.models import PatientSideEffect, SeDictionary, SeMonitoringRule
from app.modules.tasks.models import Task
from app.modules.users.models import User, UserRole
from app.seeders.base import BaseSeeder


class DemoDataSeeder(BaseSeeder):
    name = "demo_data"
    description = "Demo doctor + 5 patients with full clinical data for development"

    DOCTOR_EMAIL = "demo@docassist.dev"
    DOCTOR_PASSWORD = "Demo1234!"

    _PATIENTS = [
        {"temp_login": "demo.p1", "password": "Patient1!", "full_name": "Anna Kowalski", "birth_date": date(1985, 3, 15), "gender": "female"},
        {"temp_login": "demo.p2", "password": "Patient2!", "full_name": "Boris Ivanov", "birth_date": date(1972, 7, 22), "gender": "male"},
        {"temp_login": "demo.p3", "password": "Patient3!", "full_name": "Maria Petrova", "birth_date": date(1990, 11, 5), "gender": "female"},
        {"temp_login": "demo.p4", "password": "Patient4!", "full_name": "Dmitri Volkov", "birth_date": date(1965, 1, 30), "gender": "male"},
        {"temp_login": "demo.p5", "password": "Patient5!", "full_name": "Elena Sokolova", "birth_date": date(2001, 6, 18), "gender": "female"},
    ]

    async def run(self, session: AsyncSession) -> int:
        now = datetime.now(UTC)

        existing = await session.scalar(select(User).where(User.email == self.DOCTOR_EMAIL))
        if existing is not None:
            return 0

        count = 0

        # ── Reference data ────────────────────────────────────────────
        rows = await session.scalars(select(Scale).where(Scale.code.in_(["PHQ9", "GAD7", "YMRS"])))
        scale_map = {s.code: s for s in rows}

        se_rows = await session.scalars(
            select(SeDictionary).where(
                SeDictionary.uku_code.in_(["1.2", "1.3", "2.5", "3.4", "3.6", "4.3"])
            )
        )
        se_map = {s.uku_code: s for s in se_rows}

        med_rows = await session.scalars(
            select(MedicationReference).where(
                MedicationReference.inn.in_(["sertraline", "quetiapine", "escitalopram", "clonazepam", "lithium"])
            )
        )
        med_map = {m.inn: m for m in med_rows}

        # ── Doctor ────────────────────────────────────────────────────
        doctor_user = User(
            email=self.DOCTOR_EMAIL,
            hashed_password=hash_password(self.DOCTOR_PASSWORD),
            role=UserRole.doctor,
            consent_152fz=True,
            consent_at=now - timedelta(days=180),
            is_active=True,
        )
        session.add(doctor_user)
        await session.flush()
        count += 1

        doctor_profile = DoctorProfile(
            user_id=doctor_user.id,
            full_name="Dr. Alexandra Demo",
            specialty="Psychiatry",
        )
        session.add(doctor_profile)
        await session.flush()
        count += 1

        # ── Patients ──────────────────────────────────────────────────
        patients: list[Patient] = []
        for p_data in self._PATIENTS:
            p_user = User(
                role=UserRole.patient,
                hashed_password=hash_password(p_data["password"]),
                is_active=True,
                consent_152fz=True,
                consent_at=now - timedelta(days=90),
            )
            session.add(p_user)
            await session.flush()

            patient = Patient(
                user_id=p_user.id,
                doctor_id=doctor_profile.id,
                full_name=p_data["full_name"],
                birth_date=p_data["birth_date"],
                gender=p_data["gender"],
                temp_login=p_data["temp_login"],
                temp_password_hash=hash_password(p_data["password"]),
                onboarding_complete=True,
            )
            session.add(patient)
            await session.flush()
            patients.append(patient)
            count += 2

        p1, p2, p3, p4, p5 = patients

        # ═════════════════════════════════════════════════════════════
        # Patient 1 — Anna Kowalski (depression + anxiety, richest data)
        # ═════════════════════════════════════════════════════════════

        diag_p1_mdd = Diagnosis(
            patient_id=p1.id,
            icd_code="F32",
            name="Major Depressive Disorder",
            is_primary=True,
            date_diagnosed=date.today() - timedelta(days=180),
            notes="Moderate severity, first episode. Good treatment response observed.",
        )
        diag_p1_gad = Diagnosis(
            patient_id=p1.id,
            icd_code="F41.1",
            name="Generalized Anxiety Disorder",
            is_primary=False,
            date_diagnosed=date.today() - timedelta(days=150),
            notes="Comorbid with MDD.",
        )
        session.add_all([diag_p1_mdd, diag_p1_gad])
        await session.flush()
        count += 2

        med_p1_sert = PatientMedication(
            patient_id=p1.id,
            medication_id=med_map["sertraline"].id,
            dose_mg=100,
            unit="mg",
            frequency="1x daily morning",
            started_at=date.today() - timedelta(days=150),
            dose_precision="exact",
            created_by_role="doctor",
        )
        med_p1_clon = PatientMedication(
            patient_id=p1.id,
            medication_id=med_map["clonazepam"].id,
            dose_mg=0.5,
            unit="mg",
            frequency="2x daily",
            started_at=date.today() - timedelta(days=120),
            dose_precision="exact",
            created_by_role="doctor",
        )
        session.add_all([med_p1_sert, med_p1_clon])
        await session.flush()
        count += 2

        ps_p1_phq9 = PatientScale(
            patient_id=p1.id,
            diagnosis_id=diag_p1_mdd.id,
            scale_id=scale_map["PHQ9"].id,
            frequency_days=14,
            assigned_by=doctor_profile.id,
            created_at=now - timedelta(days=150),
        )
        ps_p1_gad7 = PatientScale(
            patient_id=p1.id,
            diagnosis_id=diag_p1_gad.id,
            scale_id=scale_map["GAD7"].id,
            frequency_days=14,
            assigned_by=doctor_profile.id,
            created_at=now - timedelta(days=120),
        )
        session.add_all([ps_p1_phq9, ps_p1_gad7])
        await session.flush()
        count += 2

        # PHQ-9: baseline 18 → gradual improvement to 5 (10 assessments)
        for i, score in enumerate([18, 16, 15, 13, 11, 10, 8, 7, 6, 5]):
            days_ago = 150 - i * 14
            session.add(TestCompletion(
                patient_id=p1.id,
                patient_scale_id=ps_p1_phq9.id,
                scale_id=scale_map["PHQ9"].id,
                score=score,
                answers_json=[{"id": q + 1, "value": max(0, score // 9 - (1 if q > 6 else 0))} for q in range(9)],
                baseline=(i == 0),
                completed_at=now - timedelta(days=max(0, days_ago)),
            ))
        count += 10

        # GAD-7: baseline 14 → improvement to 4 (8 assessments)
        for i, score in enumerate([14, 12, 10, 9, 8, 7, 5, 4]):
            days_ago = 120 - i * 14
            session.add(TestCompletion(
                patient_id=p1.id,
                patient_scale_id=ps_p1_gad7.id,
                scale_id=scale_map["GAD7"].id,
                score=score,
                answers_json=[{"id": q + 1, "value": max(0, score // 7)} for q in range(7)],
                baseline=(i == 0),
                completed_at=now - timedelta(days=max(0, days_ago)),
            ))
        count += 8

        await session.flush()

        pse_p1_tremor = PatientSideEffect(
            patient_id=p1.id,
            se_id=se_map["2.5"].id,
            severity=2,
            started_at=now - timedelta(days=120),
            date_precision="exact",
            resolved=False,
            notes="Fine tremor in hands, likely sertraline-related. Under observation.",
            created_at=now - timedelta(days=120),
        )
        pse_p1_nausea = PatientSideEffect(
            patient_id=p1.id,
            se_id=se_map["3.4"].id,
            severity=1,
            started_at=now - timedelta(days=145),
            ended_at=now - timedelta(days=130),
            date_precision="exact",
            resolved=True,
            notes="Initial nausea resolved spontaneously after 2 weeks.",
            created_at=now - timedelta(days=145),
        )
        pse_p1_drowsy = PatientSideEffect(
            patient_id=p1.id,
            se_id=se_map["1.3"].id,
            severity=1,
            started_at=now - timedelta(days=100),
            date_precision="exact",
            resolved=False,
            created_at=now - timedelta(days=100),
        )
        session.add_all([pse_p1_tremor, pse_p1_nausea, pse_p1_drowsy])
        await session.flush()
        count += 3

        smr_p1_tremor = SeMonitoringRule(
            patient_id=p1.id,
            se_id=se_map["2.5"].id,
            frequency_days=14,
            assigned_by=doctor_profile.id,
            created_at=now - timedelta(days=120),
        )
        smr_p1_drowsy = SeMonitoringRule(
            patient_id=p1.id,
            se_id=se_map["1.3"].id,
            frequency_days=14,
            assigned_by=doctor_profile.id,
            created_at=now - timedelta(days=100),
        )
        session.add_all([smr_p1_tremor, smr_p1_drowsy])
        await session.flush()
        count += 2

        session.add_all([
            EventLog(patient_id=p1.id, event_type="drug_started", payload={"medication": "sertraline", "dose_mg": 50}, occurred_at=now - timedelta(days=150), created_at=now - timedelta(days=150), created_by=doctor_user.id),
            EventLog(patient_id=p1.id, event_type="dose_changed", payload={"medication": "sertraline", "old_dose_mg": 50, "new_dose_mg": 100}, occurred_at=now - timedelta(days=120), created_at=now - timedelta(days=120), created_by=doctor_user.id),
            EventLog(patient_id=p1.id, event_type="drug_started", payload={"medication": "clonazepam", "dose_mg": 0.5}, occurred_at=now - timedelta(days=120), created_at=now - timedelta(days=120), created_by=doctor_user.id),
            EventLog(patient_id=p1.id, event_type="se_reported_start", payload={"uku_code": "3.4", "name": "Nausea/Vomiting", "severity": 1}, occurred_at=now - timedelta(days=145), created_at=now - timedelta(days=145), created_by=doctor_user.id),
            EventLog(patient_id=p1.id, event_type="se_resolved", payload={"uku_code": "3.4", "name": "Nausea/Vomiting"}, occurred_at=now - timedelta(days=130), created_at=now - timedelta(days=130), created_by=doctor_user.id),
            EventLog(patient_id=p1.id, event_type="se_reported_start", payload={"uku_code": "2.5", "name": "Tremor", "severity": 2}, occurred_at=now - timedelta(days=120), created_at=now - timedelta(days=120), created_by=doctor_user.id),
            EventLog(patient_id=p1.id, event_type="test_completed", payload={"scale": "PHQ-9", "score": 18, "baseline": True}, occurred_at=now - timedelta(days=150), created_at=now - timedelta(days=150), created_by=None),
            EventLog(patient_id=p1.id, event_type="test_completed", payload={"scale": "PHQ-9", "score": 10}, occurred_at=now - timedelta(days=10), created_at=now - timedelta(days=10), created_by=None),
            EventLog(patient_id=p1.id, event_type="test_completed", payload={"scale": "GAD-7", "score": 14, "baseline": True}, occurred_at=now - timedelta(days=120), created_at=now - timedelta(days=120), created_by=None),
            EventLog(patient_id=p1.id, event_type="test_completed", payload={"scale": "GAD-7", "score": 7}, occurred_at=now - timedelta(days=10), created_at=now - timedelta(days=10), created_by=None),
        ])
        count += 10

        session.add_all([
            Task(patient_id=p1.id, task_type="medication_log", reference_id=med_p1_sert.id, due_at=now, status="pending", created_at=now),
            Task(
                patient_id=p1.id, task_type="test", reference_id=ps_p1_phq9.id,
                due_at=now + timedelta(days=4), status="pending", created_at=now,
            ),
            Task(patient_id=p1.id, task_type="se_report", reference_id=smr_p1_tremor.id, due_at=now + timedelta(days=7), status="pending", created_at=now),
            Task(patient_id=p1.id, task_type="medication_log", reference_id=med_p1_clon.id, due_at=now, status="done", created_at=now - timedelta(days=1)),
            Task(
                patient_id=p1.id, task_type="test", reference_id=ps_p1_gad7.id,
                due_at=now - timedelta(days=3), status="done", created_at=now - timedelta(days=14),
            ),
        ])
        await session.flush()
        count += 5

        # ═════════════════════════════════════════════════════════════
        # Patient 2 — Boris Ivanov (bipolar I, lithium, YMRS history)
        # ═════════════════════════════════════════════════════════════

        diag_p2 = Diagnosis(
            patient_id=p2.id,
            icd_code="F30",
            name="Bipolar I Disorder — Manic Episode",
            is_primary=True,
            date_diagnosed=date.today() - timedelta(days=365),
            notes="Second episode. Stable on lithium.",
        )
        session.add(diag_p2)
        await session.flush()
        count += 1

        med_p2 = PatientMedication(
            patient_id=p2.id,
            medication_id=med_map["lithium"].id,
            dose_mg=400,
            unit="mg",
            frequency="2x daily",
            started_at=date.today() - timedelta(days=340),
            dose_precision="exact",
            created_by_role="doctor",
        )
        session.add(med_p2)
        await session.flush()
        count += 1

        ps_p2_ymrs = PatientScale(
            patient_id=p2.id,
            diagnosis_id=diag_p2.id,
            scale_id=scale_map["YMRS"].id,
            frequency_days=21,
            assigned_by=doctor_profile.id,
            created_at=now - timedelta(days=340),
        )
        session.add(ps_p2_ymrs)
        await session.flush()
        count += 1

        # YMRS: baseline 34 → remission at 6 (7 assessments)
        for i, score in enumerate([34, 28, 22, 18, 14, 10, 6]):
            days_ago = 340 - i * 21
            session.add(TestCompletion(
                patient_id=p2.id,
                patient_scale_id=ps_p2_ymrs.id,
                scale_id=scale_map["YMRS"].id,
                score=score,
                answers_json=[{"id": q + 1, "value": max(0, score // 11)} for q in range(11)],
                baseline=(i == 0),
                completed_at=now - timedelta(days=max(0, days_ago)),
            ))
        count += 7

        pse_p2 = PatientSideEffect(
            patient_id=p2.id,
            se_id=se_map["2.5"].id,
            severity=1,
            started_at=now - timedelta(days=300),
            date_precision="exact",
            resolved=False,
            notes="Mild lithium-induced tremor. Monitoring.",
            created_at=now - timedelta(days=300),
        )
        session.add(pse_p2)
        count += 1

        session.add_all([
            EventLog(patient_id=p2.id, event_type="drug_started", payload={"medication": "lithium", "dose_mg": 400}, occurred_at=now - timedelta(days=340), created_at=now - timedelta(days=340), created_by=doctor_user.id),
            EventLog(patient_id=p2.id, event_type="se_reported_start", payload={"uku_code": "2.5", "name": "Tremor", "severity": 1}, occurred_at=now - timedelta(days=300), created_at=now - timedelta(days=300), created_by=doctor_user.id),
            EventLog(patient_id=p2.id, event_type="test_completed", payload={"scale": "YMRS", "score": 34, "baseline": True}, occurred_at=now - timedelta(days=340), created_at=now - timedelta(days=340), created_by=None),
            EventLog(patient_id=p2.id, event_type="test_completed", payload={"scale": "YMRS", "score": 6}, occurred_at=now - timedelta(days=214), created_at=now - timedelta(days=214), created_by=None),
        ])
        count += 4

        session.add(Task(patient_id=p2.id, task_type="medication_log", reference_id=med_p2.id, due_at=now, status="pending", created_at=now))
        await session.flush()
        count += 1

        # ═════════════════════════════════════════════════════════════
        # Patient 3 — Maria Petrova (anxiety, escitalopram, early stage)
        # ═════════════════════════════════════════════════════════════

        diag_p3 = Diagnosis(
            patient_id=p3.id,
            icd_code="F41.1",
            name="Generalized Anxiety Disorder",
            is_primary=True,
            date_diagnosed=date.today() - timedelta(days=60),
        )
        session.add(diag_p3)
        await session.flush()
        count += 1

        med_p3 = PatientMedication(
            patient_id=p3.id,
            medication_id=med_map["escitalopram"].id,
            dose_mg=10,
            unit="mg",
            frequency="1x daily",
            started_at=date.today() - timedelta(days=45),
            dose_precision="exact",
            created_by_role="doctor",
        )
        session.add(med_p3)
        await session.flush()
        count += 1

        ps_p3_gad7 = PatientScale(
            patient_id=p3.id,
            diagnosis_id=diag_p3.id,
            scale_id=scale_map["GAD7"].id,
            frequency_days=14,
            assigned_by=doctor_profile.id,
            created_at=now - timedelta(days=45),
        )
        session.add(ps_p3_gad7)
        await session.flush()
        count += 1

        for i, score in enumerate([16, 13, 11]):
            days_ago = 45 - i * 14
            session.add(TestCompletion(
                patient_id=p3.id,
                patient_scale_id=ps_p3_gad7.id,
                scale_id=scale_map["GAD7"].id,
                score=score,
                answers_json=[{"id": q + 1, "value": max(0, score // 7)} for q in range(7)],
                baseline=(i == 0),
                completed_at=now - timedelta(days=max(0, days_ago)),
            ))
        count += 3

        pse_p3 = PatientSideEffect(
            patient_id=p3.id,
            se_id=se_map["3.4"].id,
            severity=1,
            started_at=now - timedelta(days=40),
            date_precision="exact",
            resolved=False,
            created_at=now - timedelta(days=40),
        )
        session.add(pse_p3)
        count += 1

        session.add_all([
            EventLog(patient_id=p3.id, event_type="drug_started", payload={"medication": "escitalopram", "dose_mg": 10}, occurred_at=now - timedelta(days=45), created_at=now - timedelta(days=45), created_by=doctor_user.id),
            EventLog(patient_id=p3.id, event_type="se_reported_start", payload={"uku_code": "3.4", "name": "Nausea/Vomiting", "severity": 1}, occurred_at=now - timedelta(days=40), created_at=now - timedelta(days=40), created_by=doctor_user.id),
            EventLog(patient_id=p3.id, event_type="test_completed", payload={"scale": "GAD-7", "score": 16, "baseline": True}, occurred_at=now - timedelta(days=45), created_at=now - timedelta(days=45), created_by=None),
        ])
        count += 3

        session.add(Task(
            patient_id=p3.id, task_type="test", reference_id=ps_p3_gad7.id,
            due_at=now + timedelta(days=3), status="pending", created_at=now,
        ))
        await session.flush()
        count += 1

        # ═════════════════════════════════════════════════════════════
        # Patient 4 — Dmitri Volkov (depression, quetiapine, new patient)
        # ═════════════════════════════════════════════════════════════

        diag_p4 = Diagnosis(
            patient_id=p4.id,
            icd_code="F32",
            name="Major Depressive Disorder",
            is_primary=True,
            date_diagnosed=date.today() - timedelta(days=20),
        )
        session.add(diag_p4)
        await session.flush()
        count += 1

        med_p4 = PatientMedication(
            patient_id=p4.id,
            medication_id=med_map["quetiapine"].id,
            dose_mg=50,
            unit="mg",
            frequency="1x daily at night",
            started_at=date.today() - timedelta(days=10),
            dose_precision="exact",
            created_by_role="doctor",
        )
        session.add(med_p4)
        await session.flush()
        count += 1

        ps_p4_phq9 = PatientScale(
            patient_id=p4.id,
            diagnosis_id=diag_p4.id,
            scale_id=scale_map["PHQ9"].id,
            frequency_days=14,
            assigned_by=doctor_profile.id,
            created_at=now - timedelta(days=10),
        )
        session.add(ps_p4_phq9)
        await session.flush()
        count += 1

        session.add(TestCompletion(
            patient_id=p4.id,
            patient_scale_id=ps_p4_phq9.id,
            scale_id=scale_map["PHQ9"].id,
            score=20,
            answers_json=[{"id": q + 1, "value": 2} for q in range(9)],
            baseline=True,
            completed_at=now - timedelta(days=10),
        ))
        count += 1

        pse_p4 = PatientSideEffect(
            patient_id=p4.id,
            se_id=se_map["4.3"].id,
            severity=1,
            started_at=now - timedelta(days=5),
            date_precision="exact",
            resolved=False,
            notes="Weight gain concern — monitoring.",
            created_at=now - timedelta(days=5),
        )
        session.add(pse_p4)
        count += 1

        session.add_all([
            EventLog(patient_id=p4.id, event_type="drug_started", payload={"medication": "quetiapine", "dose_mg": 50}, occurred_at=now - timedelta(days=10), created_at=now - timedelta(days=10), created_by=doctor_user.id),
            EventLog(patient_id=p4.id, event_type="test_completed", payload={"scale": "PHQ-9", "score": 20, "baseline": True}, occurred_at=now - timedelta(days=10), created_at=now - timedelta(days=10), created_by=None),
        ])
        count += 2

        session.add_all([
            Task(patient_id=p4.id, task_type="medication_log", reference_id=med_p4.id, due_at=now, status="pending", created_at=now),
            Task(
                patient_id=p4.id, task_type="test", reference_id=ps_p4_phq9.id,
                due_at=now + timedelta(days=4), status="pending", created_at=now,
            ),
        ])
        await session.flush()
        count += 2

        # ═════════════════════════════════════════════════════════════
        # Patient 5 — Elena Sokolova (new intake, no meds yet)
        # ═════════════════════════════════════════════════════════════

        diag_p5 = Diagnosis(
            patient_id=p5.id,
            icd_code="F32",
            name="Mild Depressive Episode",
            is_primary=True,
            date_diagnosed=date.today() - timedelta(days=3),
            notes="First visit. Watchful waiting — no pharmacotherapy started.",
        )
        session.add(diag_p5)
        await session.flush()
        count += 1

        session.add(EventLog(
            patient_id=p5.id,
            event_type="patient_created",
            payload={"note": "Initial intake"},
            occurred_at=now - timedelta(days=3),
            created_at=now - timedelta(days=3),
            created_by=doctor_user.id,
        ))
        count += 1

        await session.commit()
        return count
