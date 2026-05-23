from __future__ import annotations

from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User, UserRole


async def test_register_requires_152fz_consent(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/public/auth/register",
        json={
            "email": "new-user@example.com",
            "password": "password123",
            "full_name": "Test Doctor",
            "consent_152fz": False,
        },
    )

    assert response.status_code == 422


async def test_register_is_disabled_and_persists_no_user(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    before_count = await db_session.scalar(select(func.count()).select_from(User))
    response = await client.post(
        "/api/v1/public/auth/register",
        json={
            "email": "registered@example.com",
            "password": "password123",
            "full_name": "Dr. Registered",
            "consent_152fz": True,
        },
    )

    assert response.status_code == 403
    assert response.json() == {"detail": "Public registration is disabled"}

    user = await db_session.scalar(
        select(User).where(User.email == "registered@example.com")
    )
    after_count = await db_session.scalar(select(func.count()).select_from(User))
    assert user is None
    assert after_count == before_count


async def test_register_disabled_response_takes_precedence_over_duplicate_email(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    db_session.add(
        User(
            email="duplicate@example.com",
            hashed_password="hashed",
            role=UserRole.doctor,
            consent_152fz=True,
            is_active=True,
        )
    )
    await db_session.flush()

    response = await client.post(
        "/api/v1/public/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "password123",
            "full_name": "Dr. Duplicate",
            "consent_152fz": True,
        },
    )

    assert response.status_code == 403
    assert response.json() == {"detail": "Public registration is disabled"}
