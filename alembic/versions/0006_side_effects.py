"""Add se_dictionary, patient_side_effects, se_monitoring_rules tables (Phase 05)

Revision ID: 0006_side_effects
Revises: 0005_event_log
Create Date: 2026-05-18

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0006_side_effects"
down_revision: str | None = "0005_event_log"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "se_dictionary",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("uku_code", sa.Text(), nullable=False),
        sa.Column("name_ru", sa.Text(), nullable=False),
        sa.Column("name_en", sa.Text(), nullable=False),
        sa.Column("body_system", sa.Text(), nullable=True),
        sa.Column("severity_min", sa.Integer(), server_default="0", nullable=False),
        sa.Column("severity_max", sa.Integer(), server_default="4", nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uku_code"),
    )
    op.create_index("ix_se_dictionary_uku_code", "se_dictionary", ["uku_code"])

    op.create_table(
        "patient_side_effects",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("patient_id", sa.UUID(), nullable=False),
        sa.Column("se_id", sa.UUID(), nullable=False),
        sa.Column("severity", sa.Integer(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("date_precision", sa.Text(), nullable=True),
        sa.Column("duration_label", sa.Text(), nullable=True),
        sa.Column("resolved", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("severity BETWEEN 0 AND 4", name="ck_pse_severity"),
        sa.CheckConstraint(
            "date_precision IN ('exact','lt_24h','month','year','range')",
            name="ck_pse_date_precision",
        ),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["se_id"], ["se_dictionary.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pse_patient_id", "patient_side_effects", ["patient_id"])

    op.create_table(
        "se_monitoring_rules",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("patient_id", sa.UUID(), nullable=False),
        sa.Column("se_id", sa.UUID(), nullable=False),
        sa.Column("frequency_days", sa.Integer(), nullable=True),
        sa.Column("assigned_by", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["se_id"], ["se_dictionary.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["assigned_by"], ["doctor_profiles.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_semr_patient_id", "se_monitoring_rules", ["patient_id"])


def downgrade() -> None:
    op.drop_index("ix_semr_patient_id", table_name="se_monitoring_rules")
    op.drop_table("se_monitoring_rules")
    op.drop_index("ix_pse_patient_id", table_name="patient_side_effects")
    op.drop_table("patient_side_effects")
    op.drop_index("ix_se_dictionary_uku_code", table_name="se_dictionary")
    op.drop_table("se_dictionary")
