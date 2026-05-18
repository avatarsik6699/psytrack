from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin


class SeDictionary(UUIDMixin, Base):
    __tablename__ = "se_dictionary"

    uku_code: Mapped[str] = mapped_column(Text, nullable=False, unique=True, index=True)
    name_ru: Mapped[str] = mapped_column(Text, nullable=False)
    name_en: Mapped[str] = mapped_column(Text, nullable=False)
    body_system: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity_min: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    severity_max: Mapped[int] = mapped_column(Integer, server_default="4", nullable=False)


class PatientSideEffect(UUIDMixin, Base):
    __tablename__ = "patient_side_effects"
    __table_args__ = (
        CheckConstraint("severity BETWEEN 0 AND 4", name="ck_pse_severity"),
        CheckConstraint(
            "date_precision IN ('exact','lt_24h','month','year','range')",
            name="ck_pse_date_precision",
        ),
    )

    patient_id: Mapped[UUID] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    se_id: Mapped[UUID] = mapped_column(
        ForeignKey("se_dictionary.id", ondelete="RESTRICT"), nullable=False
    )
    severity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    date_precision: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_label: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved: Mapped[bool] = mapped_column(Boolean, server_default="false", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    se: Mapped["SeDictionary"] = relationship("SeDictionary", lazy="raise")


class SeMonitoringRule(UUIDMixin, Base):
    __tablename__ = "se_monitoring_rules"

    patient_id: Mapped[UUID] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    se_id: Mapped[UUID] = mapped_column(
        ForeignKey("se_dictionary.id", ondelete="RESTRICT"), nullable=False
    )
    frequency_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    assigned_by: Mapped[UUID | None] = mapped_column(
        ForeignKey("doctor_profiles.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    se: Mapped["SeDictionary"] = relationship("SeDictionary", lazy="raise")
