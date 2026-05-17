"""Add scales, clinical_rules, patient_scales, test_completions tables

Revision ID: 0004_scales_patient_scales
Revises: 0003_diagnoses_medications
Create Date: 2026-05-17

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0004_scales_patient_scales"
down_revision: str | None = "0003_diagnoses_medications"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "scales",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("code", sa.Text(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("score_min", sa.Integer(), nullable=False),
        sa.Column("score_max", sa.Integer(), nullable=False),
        sa.Column(
            "improvement_direction",
            sa.Text(),
            nullable=True,
        ),
        sa.Column("domains_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("questions_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.CheckConstraint(
            "improvement_direction IN ('lower','higher')",
            name="ck_scales_improvement_direction",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_scales_code"),
    )

    op.create_table(
        "clinical_rules",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("diagnosis_icd", sa.Text(), nullable=False),
        sa.Column("scale_id", sa.UUID(), nullable=False),
        sa.Column("control_point_days", sa.Integer(), nullable=False),
        sa.Column("response_threshold_pct", sa.Integer(), nullable=False),
        sa.Column("response_threshold_abs", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["scale_id"], ["scales.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "patient_scales",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("patient_id", sa.UUID(), nullable=False),
        sa.Column("diagnosis_id", sa.UUID(), nullable=False),
        sa.Column("scale_id", sa.UUID(), nullable=False),
        sa.Column("frequency_days", sa.Integer(), nullable=False),
        sa.Column("assigned_by", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["diagnosis_id"], ["diagnoses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["scale_id"], ["scales.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["assigned_by"], ["doctor_profiles.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_patient_scales_patient_id", "patient_scales", ["patient_id"])

    op.create_table(
        "test_completions",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("patient_id", sa.UUID(), nullable=False),
        sa.Column("patient_scale_id", sa.UUID(), nullable=False),
        sa.Column("scale_id", sa.UUID(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("answers_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("baseline", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["patient_scale_id"], ["patient_scales.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["scale_id"], ["scales.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_test_completions_patient_id", "test_completions", ["patient_id"])


def downgrade() -> None:
    op.drop_index("ix_test_completions_patient_id", table_name="test_completions")
    op.drop_table("test_completions")
    op.drop_index("ix_patient_scales_patient_id", table_name="patient_scales")
    op.drop_table("patient_scales")
    op.drop_table("clinical_rules")
    op.drop_table("scales")
