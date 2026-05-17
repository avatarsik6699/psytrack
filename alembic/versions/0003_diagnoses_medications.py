"""Add diagnoses, medications_reference, patient_medications tables

Revision ID: 0003_diagnoses_medications
Revises: 0002_doctor_profile_patient
Create Date: 2026-05-16

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0003_diagnoses_medications"
down_revision: str | None = "0002_doctor_profile_patient"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "medications_reference",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("inn", sa.String(200), nullable=False),
        sa.Column("brand_names", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("inn", name="uq_medications_reference_inn"),
    )
    op.create_index("ix_medications_reference_inn", "medications_reference", ["inn"])

    op.create_table(
        "diagnoses",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("patient_id", sa.UUID(), nullable=False),
        sa.Column("icd_code", sa.String(20), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("is_primary", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("date_diagnosed", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_diagnoses_patient_id", "diagnoses", ["patient_id"])

    op.create_table(
        "patient_medications",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("patient_id", sa.UUID(), nullable=False),
        sa.Column("medication_id", sa.UUID(), nullable=False),
        sa.Column("dose_mg", sa.Numeric(), nullable=True),
        sa.Column("unit", sa.String(20), nullable=True),
        sa.Column("frequency", sa.String(100), nullable=True),
        sa.Column("started_at", sa.Date(), nullable=True),
        sa.Column("ended_at", sa.Date(), nullable=True),
        sa.Column(
            "dose_precision",
            sa.String(10),
            sa.CheckConstraint("dose_precision IN ('exact','approx','range')", name="ck_patient_medications_dose_precision"),
            nullable=True,
        ),
        sa.Column(
            "created_by_role",
            sa.String(10),
            sa.CheckConstraint("created_by_role IN ('doctor','patient')", name="ck_patient_medications_created_by_role"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["medication_id"], ["medications_reference.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_patient_medications_patient_id", "patient_medications", ["patient_id"])


def downgrade() -> None:
    op.drop_table("patient_medications")
    op.drop_table("diagnoses")
    op.drop_table("medications_reference")
