from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class MedicationReference(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "medications_reference"

    inn: Mapped[str] = mapped_column(String(200), nullable=False, index=True, unique=True)
    brand_names: Mapped[list | None] = mapped_column(JSONB, nullable=True)


class PatientMedication(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "patient_medications"

    patient_id: Mapped[UUID] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    medication_id: Mapped[UUID] = mapped_column(
        ForeignKey("medications_reference.id", ondelete="RESTRICT"), nullable=False
    )
    dose_mg: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)
    unit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    frequency: Mapped[str | None] = mapped_column(String(100), nullable=True)
    started_at: Mapped[date | None] = mapped_column(nullable=True)
    ended_at: Mapped[date | None] = mapped_column(nullable=True)
    dose_precision: Mapped[str | None] = mapped_column(String(10), nullable=True)
    created_by_role: Mapped[str | None] = mapped_column(String(10), nullable=True)
    medication: Mapped["MedicationReference"] = relationship("MedicationReference", lazy="raise")
