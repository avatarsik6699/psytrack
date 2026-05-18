"""Add task_type check constraint and updated_at to tasks (Phase 06 fixup)

Revision ID: 0008_tasks_constraints
Revises: 0007_tasks
Create Date: 2026-05-18

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0008_tasks_constraints"
down_revision: str | None = "0007_tasks"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_check_constraint(
        "ck_tasks_task_type",
        "tasks",
        "task_type IN ('test', 'medication_log', 'se_report')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_tasks_task_type", "tasks", type_="check")
    op.drop_column("tasks", "updated_at")
