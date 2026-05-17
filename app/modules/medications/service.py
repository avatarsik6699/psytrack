from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException

from app.modules.events.repository import EventLogRepository
from app.modules.events.schemas import EventLogOut
from app.modules.medications.models import MedicationReference, PatientMedication
from app.modules.medications.repository import MedicationRepository, PatientMedicationRepository
from app.modules.medications.schemas import (
    MedicationChartPoint,
    MedicationChartSeries,
    MedicationLogIn,
    PatientMedicationCreate,
    PatientMedicationUpdate,
)


class MedicationService:
    def __init__(self, repository: MedicationRepository) -> None:
        self._repository = repository

    async def search(self, q: str | None, limit: int, offset: int) -> list[MedicationReference]:
        return await self._repository.search(q, limit, offset)

    async def get_by_id(self, med_id: UUID) -> MedicationReference:
        med = await self._repository.get_by_id(med_id)
        if med is None:
            raise HTTPException(status_code=404, detail="Medication not found")
        return med


class PatientMedicationService:
    def __init__(self, repository: PatientMedicationRepository) -> None:
        self._repository = repository

    async def assign(self, data: PatientMedicationCreate, patient_id: UUID) -> PatientMedication:
        pm = PatientMedication(
            patient_id=patient_id,
            medication_id=data.medication_id,
            dose_mg=data.dose_mg,
            unit=data.unit,
            frequency=data.frequency,
            started_at=data.started_at,
            ended_at=data.ended_at,
            dose_precision=data.dose_precision,
            created_by_role="doctor",
        )
        pm = await self._repository.add(pm)
        result = await self._repository.get_with_medication(pm.id)
        return result  # type: ignore[return-value]

    async def list_by_patient(self, patient_id: UUID) -> list[PatientMedication]:
        return await self._repository.list_by_patient(patient_id)

    async def get_for_patient(self, patient_id: UUID, pm_id: UUID) -> PatientMedication:
        pm = await self._repository.get_by_patient_and_id(patient_id, pm_id)
        if pm is None:
            raise HTTPException(status_code=404, detail="Patient medication not found")
        return pm

    async def update(self, pm: PatientMedication, data: PatientMedicationUpdate) -> PatientMedication:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(pm, field, value)
        await self._repository._session.flush()
        result = await self._repository.get_with_medication(pm.id)
        return result  # type: ignore[return-value]

    async def list_active_for_patient(self, patient_id: UUID) -> list[PatientMedication]:
        return await self._repository.list_active_by_patient(patient_id)

    async def log_dose(
        self,
        pm: PatientMedication,
        data: MedicationLogIn,
        patient_id: UUID,
        created_by: UUID,
        event_repo: EventLogRepository,
    ) -> EventLogOut:
        event_type = "dose_taken" if data.status == "taken" else "dose_missed"
        event = await event_repo.emit(
            patient_id=patient_id,
            event_type=event_type,
            payload={"medication_id": str(pm.id), "dose_mg": str(pm.dose_mg) if pm.dose_mg else None},
            occurred_at=data.occurred_at,
            created_by=created_by,
        )
        return EventLogOut.model_validate(event)

    async def add_by_patient(
        self,
        data: PatientMedicationCreate,
        patient_id: UUID,
        created_by: UUID,
        event_repo: EventLogRepository,
    ) -> PatientMedication:
        pm = PatientMedication(
            patient_id=patient_id,
            medication_id=data.medication_id,
            dose_mg=data.dose_mg,
            unit=data.unit,
            frequency=data.frequency,
            started_at=data.started_at,
            ended_at=data.ended_at,
            dose_precision=data.dose_precision,
            created_by_role="patient",
        )
        pm = await self._repository.add(pm)
        await event_repo.emit(
            patient_id=patient_id,
            event_type="drug_started",
            payload={"medication_id": str(pm.id)},
            occurred_at=datetime.now(timezone.utc),
            created_by=created_by,
        )
        result = await self._repository.get_with_medication(pm.id)
        return result  # type: ignore[return-value]

    async def edit_by_patient(
        self,
        pm: PatientMedication,
        data: PatientMedicationUpdate,
        patient_id: UUID,
        created_by: UUID,
        event_repo: EventLogRepository,
    ) -> PatientMedication:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(pm, field, value)
        await self._repository._session.flush()
        await event_repo.emit(
            patient_id=patient_id,
            event_type="dose_changed",
            payload={"medication_id": str(pm.id)},
            occurred_at=datetime.now(timezone.utc),
            created_by=created_by,
        )
        result = await self._repository.get_with_medication(pm.id)
        return result  # type: ignore[return-value]

    async def stop_by_patient(
        self,
        pm: PatientMedication,
        patient_id: UUID,
        created_by: UUID,
        event_repo: EventLogRepository,
    ) -> None:
        pm.ended_at = datetime.now(timezone.utc).date()
        await self._repository._session.flush()
        await event_repo.emit(
            patient_id=patient_id,
            event_type="drug_stopped",
            payload={"medication_id": str(pm.id)},
            occurred_at=datetime.now(timezone.utc),
            created_by=created_by,
        )

    def build_chart_series(self, meds: list[PatientMedication]) -> list[MedicationChartSeries]:
        series: list[MedicationChartSeries] = []
        for pm in meds:
            date_str = pm.started_at.isoformat() if pm.started_at else pm.created_at.date().isoformat()
            dose: Decimal | None = pm.dose_mg if pm.dose_mg is not None else None
            series.append(
                MedicationChartSeries(
                    inn=pm.medication.inn,
                    medication_id=pm.id,
                    points=[MedicationChartPoint(date=date_str, dose_mg=dose)],
                )
            )
        return series
