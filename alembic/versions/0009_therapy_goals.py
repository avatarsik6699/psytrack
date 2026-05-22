"""Add therapy_goals table (Phase 07)

Revision ID: 0009_therapy_goals
Revises: 0008_tasks_constraints
Create Date: 2026-05-18

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0009_therapy_goals"
down_revision: str | None = "0008_tasks_constraints"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "therapy_goals",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("patient_id", sa.UUID(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("is_completed", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_therapy_goals_patient_id", "therapy_goals", ["patient_id"])


def downgrade() -> None:
    op.drop_index("ix_therapy_goals_patient_id", table_name="therapy_goals")
    op.drop_table("therapy_goals")
