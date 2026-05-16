"""Add doctor_profiles and patients tables

Revision ID: 0002_doctor_profile_patient
Revises: 0001_users_table
Create Date: 2026-05-10

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0002_doctor_profile_patient"
down_revision: str | None = "0001_users_table"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SEED_PATIENT_EMAIL = "patient@example.com"
SEED_PASSWORD_HASH = "$2b$12$JUH0ENl95Y26jqTeiVPWi.PpsvrCT.ema92b.rd/.bXedDhfsi5mu"  # changeme123


def upgrade() -> None:
    op.create_table(
        "doctor_profiles",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("specialty", sa.String(length=100), nullable=True),
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
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )

    op.create_table(
        "patients",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "doctor_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("birth_date", sa.Date(), nullable=True),
        sa.Column("gender", sa.String(length=20), nullable=True),
        sa.Column("temp_login", sa.String(length=50), nullable=True),
        sa.Column("temp_password_hash", sa.String(length=100), nullable=True),
        sa.Column("email", postgresql.CITEXT(), nullable=True),
        sa.Column(
            "email_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "onboarding_complete",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.ForeignKeyConstraint(["doctor_id"], ["doctor_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("temp_login"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_patients_doctor_id", "patients", ["doctor_id"])

    # Seed: doctor_profile for the admin seed account from migration 0001
    op.execute(
        sa.text(
            """
            INSERT INTO doctor_profiles (id, user_id, full_name, specialty)
            SELECT gen_random_uuid(), u.id, 'Admin Doctor', 'General Psychiatry'
            FROM users u
            WHERE u.email = 'admin@example.com'
            ON CONFLICT (user_id) DO NOTHING
            """
        )
    )

    # Seed: test patient user + patient record
    op.execute(
        sa.text(
            """
            INSERT INTO users (id, email, hashed_password, role, consent_152fz, consent_at, is_active)
            VALUES (gen_random_uuid(), :email, :pw, 'patient', true, now(), true)
            ON CONFLICT (email) DO NOTHING
            """
        ).bindparams(pw=SEED_PASSWORD_HASH, email=SEED_PATIENT_EMAIL)
    )

    op.execute(
        sa.text(
            """
            INSERT INTO patients (
                id, user_id, doctor_id, full_name,
                temp_login, temp_password_hash,
                onboarding_complete, email_verified
            )
            SELECT
                gen_random_uuid(),
                u.id,
                dp.id,
                'Test Patient',
                'patient001',
                :pw,
                false,
                false
            FROM users u
            CROSS JOIN doctor_profiles dp
            WHERE u.email = :email
              AND dp.full_name = 'Admin Doctor'
            ON CONFLICT DO NOTHING
            """
        ).bindparams(pw=SEED_PASSWORD_HASH, email=SEED_PATIENT_EMAIL)
    )


def downgrade() -> None:
    op.drop_index("ix_patients_doctor_id", table_name="patients")
    op.drop_table("patients")
    op.drop_table("doctor_profiles")
