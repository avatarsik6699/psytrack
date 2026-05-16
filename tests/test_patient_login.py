"""Tests for patient-login endpoint and role guards."""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth import create_access_token, hash_password
from app.modules.doctors.models import DoctorProfile
from app.modules.patients.models import Patient
from app.modules.users import User, UserRole


@pytest.fixture()
async def doctor_user(db_session: AsyncSession) -> User:
    from uuid import uuid4

    unique = uuid4().hex[:8]
    user = User(
        email=f"doctor_{unique}@example.com",
        hashed_password=hash_password("doctorpass123"),
        role=UserRole.doctor,
        is_active=True,
        consent_152fz=True,
    )
    db_session.add(user)
    await db_session.flush()
    profile = DoctorProfile(user_id=user.id, full_name="Test Doctor")
    db_session.add(profile)
    await db_session.flush()
    return user


@pytest.fixture()
async def patient_with_temp_login(
    db_session: AsyncSession, doctor_user: User
) -> tuple[Patient, User]:
    from uuid import uuid4
    from sqlalchemy import select as sa_select

    unique = uuid4().hex[:8]
    patient_user = User(
        email=None,
        hashed_password=hash_password("patientpass123"),
        role=UserRole.patient,
        is_active=True,
        consent_152fz=True,
    )
    db_session.add(patient_user)
    await db_session.flush()

    doctor_profile = await db_session.scalar(
        sa_select(DoctorProfile).where(DoctorProfile.user_id == doctor_user.id)
    )
    assert doctor_profile is not None

    patient = Patient(
        user_id=patient_user.id,
        doctor_id=doctor_profile.id,
        full_name="Test Patient",
        temp_login=f"tmp_{unique}",
        temp_password_hash=hash_password("patientpass123"),
    )
    db_session.add(patient)
    await db_session.flush()
    return patient, patient_user


async def test_patient_login_with_temp_credentials(
    client: AsyncClient, patient_with_temp_login: tuple[Patient, User]
) -> None:
    patient, _ = patient_with_temp_login
    response = await client.post(
        "/api/v1/public/auth/patient-login",
        json={"temp_login": patient.temp_login, "password": "patientpass123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["token_type"] == "bearer"


async def test_patient_login_wrong_password(
    client: AsyncClient, patient_with_temp_login: tuple[Patient, User]
) -> None:
    patient, _ = patient_with_temp_login
    response = await client.post(
        "/api/v1/public/auth/patient-login",
        json={"temp_login": patient.temp_login, "password": "wrongpassword"},
    )
    assert response.status_code == 401


async def test_patient_login_unknown_temp_login(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/public/auth/patient-login",
        json={"temp_login": "nonexistent_login", "password": "somepassword"},
    )
    assert response.status_code == 401


async def test_role_guard_rejects_patient_on_doctor_endpoint(
    client: AsyncClient, patient_with_temp_login: tuple[Patient, User]
) -> None:
    _, patient_user = patient_with_temp_login
    token = create_access_token({"sub": str(patient_user.id), "role": patient_user.role.value})
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get("/api/v1/public/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "patient"
