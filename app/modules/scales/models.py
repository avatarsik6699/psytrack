from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin


class Scale(UUIDMixin, Base):
    __tablename__ = "scales"

    code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    name_ru: Mapped[str | None] = mapped_column(Text, nullable=True)
    score_min: Mapped[int] = mapped_column(Integer, nullable=False)
    score_max: Mapped[int] = mapped_column(Integer, nullable=False)
    improvement_direction: Mapped[str | None] = mapped_column(String(10), nullable=True)
    domains_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    questions_json: Mapped[list] = mapped_column(JSONB, nullable=False)


class ClinicalRule(UUIDMixin, Base):
    __tablename__ = "clinical_rules"

    diagnosis_icd: Mapped[str] = mapped_column(Text, nullable=False)
    scale_id: Mapped[UUID] = mapped_column(ForeignKey("scales.id", ondelete="CASCADE"), nullable=False)
    control_point_days: Mapped[int] = mapped_column(Integer, nullable=False)
    response_threshold_pct: Mapped[int] = mapped_column(Integer, nullable=False)
    response_threshold_abs: Mapped[int] = mapped_column(Integer, nullable=False)


class PatientScale(UUIDMixin, Base):
    __tablename__ = "patient_scales"

    patient_id: Mapped[UUID] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    diagnosis_id: Mapped[UUID] = mapped_column(
        ForeignKey("diagnoses.id", ondelete="CASCADE"), nullable=False
    )
    scale_id: Mapped[UUID] = mapped_column(
        ForeignKey("scales.id", ondelete="RESTRICT"), nullable=False
    )
    frequency_days: Mapped[int] = mapped_column(Integer, nullable=False)
    assigned_by: Mapped[UUID] = mapped_column(
        ForeignKey("doctor_profiles.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    scale: Mapped["Scale"] = relationship("Scale", lazy="raise")


class TestCompletion(UUIDMixin, Base):
    __tablename__ = "test_completions"

    patient_id: Mapped[UUID] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    patient_scale_id: Mapped[UUID] = mapped_column(
        ForeignKey("patient_scales.id", ondelete="CASCADE"), nullable=False
    )
    scale_id: Mapped[UUID] = mapped_column(
        ForeignKey("scales.id", ondelete="RESTRICT"), nullable=False
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    answers_json: Mapped[list] = mapped_column(JSONB, nullable=False)
    baseline: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), nullable=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    scale: Mapped["Scale"] = relationship("Scale", lazy="raise")
