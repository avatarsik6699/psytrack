from __future__ import annotations

from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth import create_access_token, hash_password
from app.modules.auth.utils import verify_password
from app.modules.doctors.models import DoctorProfile
from app.modules.patients.models import Patient
from app.modules.users import User, UserRole


@pytest.fixture()
async def doctor_with_profile(db_session: AsyncSession) -> tuple[User, DoctorProfile]:
    unique = uuid4().hex[:8]
    user = User(
        email=f"phase09_doctor_{unique}@example.com",
        hashed_password=hash_password("doctorpass123"),
        role=UserRole.doctor,
        is_active=True,
        consent_152fz=True,
    )
    db_session.add(user)
    await db_session.flush()

    profile = DoctorProfile(
        user_id=user.id,
        full_name="Phase Nine Doctor",
        specialty="Psychiatrist",
    )
    db_session.add(profile)
    await db_session.flush()
    return user, profile


@pytest.fixture()
async def patient_with_credentials(
    db_session: AsyncSession,
    doctor_with_profile: tuple[User, DoctorProfile],
) -> tuple[Patient, User]:
    _, doctor_profile = doctor_with_profile
    unique = uuid4().hex[:8]
    password_hash = hash_password("patientpass123")
    user = User(
        email=None,
        hashed_password=password_hash,
        role=UserRole.patient,
        is_active=True,
        consent_152fz=True,
    )
    db_session.add(user)
    await db_session.flush()

    patient = Patient(
        user_id=user.id,
        doctor_id=doctor_profile.id,
        full_name="Phase Nine Patient",
        temp_login=f"phase09_{unique}",
        temp_password_hash=password_hash,
    )
    db_session.add(patient)
    await db_session.flush()
    return patient, user


def _auth_headers(user: User) -> dict[str, str]:
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"Authorization": f"Bearer {token}"}


async def test_current_session_for_doctor(
    client: AsyncClient,
    doctor_with_profile: tuple[User, DoctorProfile],
) -> None:
    user, profile = doctor_with_profile

    response = await client.get("/api/v1/public/auth/session", headers=_auth_headers(user))

    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == str(user.id)
    assert data["role"] == "doctor"
    assert data["email"] == user.email
    assert data["display_name"] == profile.full_name
    assert data["specialty"] == profile.specialty
    assert data["doctor_id"] == str(profile.id)
    assert data["patient_id"] is None


async def test_current_session_for_patient(
    client: AsyncClient,
    patient_with_credentials: tuple[Patient, User],
) -> None:
    patient, user = patient_with_credentials

    response = await client.get("/api/v1/public/auth/session", headers=_auth_headers(user))

    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == str(user.id)
    assert data["role"] == "patient"
    assert data["display_name"] == patient.full_name
    assert data["patient_id"] == str(patient.id)
    assert data["doctor_id"] == str(patient.doctor_id)


async def test_patient_me_includes_current_login(
    client: AsyncClient,
    patient_with_credentials: tuple[Patient, User],
) -> None:
    patient, user = patient_with_credentials

    response = await client.get("/api/v1/patient/me", headers=_auth_headers(user))

    assert response.status_code == 200
    assert response.json()["temp_login"] == patient.temp_login


async def test_patient_updates_own_login_and_password(
    client: AsyncClient,
    db_session: AsyncSession,
    patient_with_credentials: tuple[Patient, User],
) -> None:
    patient, user = patient_with_credentials
    new_login = f"updated_{uuid4().hex[:8]}"

    response = await client.patch(
        "/api/v1/patient/me/credentials",
        headers=_auth_headers(user),
        json={
            "current_password": "patientpass123",
            "new_login": new_login,
            "new_password": "newpatientpass123",
        },
    )

    assert response.status_code == 200
    assert response.json() == {"temp_login": new_login}

    await db_session.refresh(patient)
    await db_session.refresh(user)
    assert patient.temp_login == new_login
    assert verify_password("newpatientpass123", patient.temp_password_hash or "")
    assert verify_password("newpatientpass123", user.hashed_password)

    login = await client.post(
        "/api/v1/public/auth/patient-login",
        json={"temp_login": new_login.upper(), "password": "newpatientpass123"},
    )
    assert login.status_code == 200
    assert login.json()["access_token"]


async def test_patient_credential_update_rejects_wrong_current_password(
    client: AsyncClient,
    patient_with_credentials: tuple[Patient, User],
) -> None:
    _patient, user = patient_with_credentials

    response = await client.patch(
        "/api/v1/patient/me/credentials",
        headers=_auth_headers(user),
        json={"current_password": "wrong-password", "new_password": "newpatientpass123"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid login or password"


async def test_patient_credential_update_rejects_unavailable_login(
    client: AsyncClient,
    db_session: AsyncSession,
    doctor_with_profile: tuple[User, DoctorProfile],
    patient_with_credentials: tuple[Patient, User],
) -> None:
    _, doctor_profile = doctor_with_profile
    patient, user = patient_with_credentials
    taken_login = f"taken_{uuid4().hex[:8]}"
    other_user = User(
        email=None,
        hashed_password=hash_password("patientpass123"),
        role=UserRole.patient,
        is_active=True,
        consent_152fz=True,
    )
    db_session.add(other_user)
    await db_session.flush()
    db_session.add(
        Patient(
            user_id=other_user.id,
            doctor_id=doctor_profile.id,
            full_name="Other Patient",
            temp_login=taken_login,
            temp_password_hash=hash_password("patientpass123"),
        )
    )
    await db_session.flush()

    response = await client.patch(
        "/api/v1/patient/me/credentials",
        headers=_auth_headers(user),
        json={"current_password": "patientpass123", "new_login": taken_login.upper()},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Login is unavailable"

    refreshed = await db_session.scalar(select(Patient).where(Patient.id == patient.id))
    assert refreshed is not None
    assert refreshed.temp_login == patient.temp_login


async def test_doctor_resets_patient_credentials(
    client: AsyncClient,
    db_session: AsyncSession,
    doctor_with_profile: tuple[User, DoctorProfile],
    patient_with_credentials: tuple[Patient, User],
) -> None:
    doctor, _profile = doctor_with_profile
    patient, user = patient_with_credentials
    old_login = patient.temp_login

    response = await client.post(
        f"/api/v1/doctor/patients/{patient.id}/credentials/reset",
        headers=_auth_headers(doctor),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["temp_login"]
    assert data["temp_password"]
    assert data["temp_login"] != old_login

    await db_session.refresh(patient)
    await db_session.refresh(user)
    assert patient.temp_login == data["temp_login"]
    assert verify_password(data["temp_password"], patient.temp_password_hash or "")
    assert verify_password(data["temp_password"], user.hashed_password)

    old_login_response = await client.post(
        "/api/v1/public/auth/patient-login",
        json={"temp_login": old_login, "password": "patientpass123"},
    )
    assert old_login_response.status_code == 401

    new_login_response = await client.post(
        "/api/v1/public/auth/patient-login",
        json={"temp_login": data["temp_login"], "password": data["temp_password"]},
    )
    assert new_login_response.status_code == 200


async def test_doctor_cannot_reset_credentials_for_other_doctors_patient(
    client: AsyncClient,
    db_session: AsyncSession,
    doctor_with_profile: tuple[User, DoctorProfile],
    patient_with_credentials: tuple[Patient, User],
) -> None:
    patient, _patient_user = patient_with_credentials
    other_user = User(
        email=f"other_doctor_{uuid4().hex[:8]}@example.com",
        hashed_password=hash_password("doctorpass123"),
        role=UserRole.doctor,
        is_active=True,
        consent_152fz=True,
    )
    db_session.add(other_user)
    await db_session.flush()
    db_session.add(DoctorProfile(user_id=other_user.id, full_name="Other Doctor"))
    await db_session.flush()

    response = await client.post(
        f"/api/v1/doctor/patients/{patient.id}/credentials/reset",
        headers=_auth_headers(other_user),
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Patient not found"
