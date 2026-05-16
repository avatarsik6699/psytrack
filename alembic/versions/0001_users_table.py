"""Phase 01 baseline: user_role enum + users table + seeded admin

Revision ID: 0001_users_table
Revises:
Create Date: 2026-04-26

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001_users_table"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    op.execute("CREATE EXTENSION IF NOT EXISTS citext")

    user_role = postgresql.ENUM("doctor", "patient", name="user_role", create_type=False)
    user_role.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("email", postgresql.CITEXT(), nullable=True),
        sa.Column("hashed_password", sa.String(length=100), nullable=False),
        sa.Column[postgresql.ENUM]("role", user_role, nullable=False, server_default="doctor"),
        sa.Column("consent_152fz", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("consent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    # Password: changeme123 (bcrypt rounds=12)
    admin_hash = "$2b$12$JUH0ENl95Y26jqTeiVPWi.PpsvrCT.ema92b.rd/.bXedDhfsi5mu"
    admin_email = "admin@example.com"
    op.execute(
        sa.text(
            """
            INSERT INTO users (
                id, email, hashed_password, role,
                consent_152fz, consent_at, is_active
            )
            VALUES (
                gen_random_uuid(), :email, :pw, 'doctor',
                true, now(), true
            )
            ON CONFLICT (email) DO NOTHING
            """
        ).bindparams(
            email=admin_email,
            pw=admin_hash,
        )
    )


def downgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS user_role")
