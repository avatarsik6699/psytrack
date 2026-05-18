"""Add tasks table (Phase 06)

Revision ID: 0007_tasks
Revises: 0006_side_effects
Create Date: 2026-05-18

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0007_tasks"
down_revision: str | None = "0006_side_effects"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tasks",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("patient_id", sa.UUID(), nullable=False),
        sa.Column("task_type", sa.Text(), nullable=False),
        sa.Column("reference_id", sa.UUID(), nullable=True),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "status",
            sa.Text(),
            server_default="pending",
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "status IN ('pending','done','missed','snoozed')",
            name="ck_tasks_status",
        ),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tasks_patient_id", "tasks", ["patient_id"])
    op.create_index("ix_tasks_due_at", "tasks", ["due_at"])


def downgrade() -> None:
    op.drop_index("ix_tasks_due_at", table_name="tasks")
    op.drop_index("ix_tasks_patient_id", table_name="tasks")
    op.drop_table("tasks")
