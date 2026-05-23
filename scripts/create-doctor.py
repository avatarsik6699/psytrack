"""Create a doctor account from an operator shell.

Usage:
    uv run python scripts/create-doctor.py --email doctor@example.com --full-name "Doctor Name"
"""

from __future__ import annotations

import argparse
import asyncio
import getpass
import sys
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.modules.doctors  # noqa: F401
import app.modules.users  # noqa: F401
from app.core.config import settings
from app.modules.auth.utils import hash_password
from app.modules.doctors.models import DoctorProfile
from app.modules.users.models import User, UserRole


async def create_doctor(email: str, full_name: str, password: str, specialty: str | None) -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    try:
        async with session_factory.begin() as session:
            existing = await session.scalar(select(User).where(User.email == email))
            if existing is not None:
                raise ValueError(f"doctor email already exists: {email}")

            user = User(
                email=email,
                hashed_password=hash_password(password),
                role=UserRole.doctor,
                consent_152fz=True,
                consent_at=datetime.now(UTC),
                is_active=True,
            )
            session.add(user)
            await session.flush()
            session.add(DoctorProfile(user_id=user.id, full_name=full_name, specialty=specialty))
    finally:
        await engine.dispose()


def read_password(args: argparse.Namespace) -> str:
    if args.password:
        return args.password

    password = getpass.getpass("Password: ")
    confirm = getpass.getpass("Confirm password: ")
    if password != confirm:
        raise ValueError("passwords do not match")
    return password


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a doctor account")
    parser.add_argument("--email", required=True, help="doctor email address")
    parser.add_argument("--full-name", required=True, help="doctor display name")
    parser.add_argument("--specialty", default=None, help="optional specialty")
    parser.add_argument(
        "--password",
        default=None,
        help="doctor password; omit to enter it interactively",
    )
    args = parser.parse_args()

    try:
        password = read_password(args)
        if len(password) < 8:
            raise ValueError("password must be at least 8 characters")
        asyncio.run(create_doctor(args.email, args.full_name, password, args.specialty))
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        sys.exit(1)

    print(f"created doctor account: {args.email}")


if __name__ == "__main__":
    main()
