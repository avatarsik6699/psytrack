from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDMixin


class Task(UUIDMixin, Base):
    __tablename__ = "tasks"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending','done','missed','snoozed')",
            name="ck_tasks_status",
        ),
    )

    patient_id: Mapped[UUID] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    task_type: Mapped[str] = mapped_column(Text, nullable=False)
    reference_id: Mapped[UUID | None] = mapped_column(nullable=True)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    status: Mapped[str] = mapped_column(Text, server_default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
