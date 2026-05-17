"""Tests for patient CRUD endpoints."""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.utils import create_access_token
from app.modules.doctors.models import DoctorProfile
from app.modules.patients.models import Patient
from app.modules.users.models import User, UserRole


async def _register_doctor(client: AsyncClient, suffix: str) -> str:
    resp = await client.post(
        "/api/v1/public/auth/register",
        json={
            "email": f"doc_{suffix}@test.com",
            "password": "Pass1234!",
            "full_name": f"Dr {suffix}",
            "consent_152fz": True,
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


async def test_create_patient_returns_temp_credentials(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token = await _register_doctor(client, "create01")
    resp = await client.post(
        "/api/v1/doctor/patients",
        headers={"Authorization": f"Bearer {token}"},
        json={"full_name": "Alice Smith", "birth_date": "1990-05-20", "gender": "female"},
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["full_name"] == "Alice Smith"
    assert "temp_login" in data
    assert "temp_password" in data
    assert len(data["temp_login"]) == 8
    assert len(data["temp_password"]) == 8


async def test_list_patients_returns_own_patients(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token = await _register_doctor(client, "list01")
    hdrs = {"Authorization": f"Bearer {token}"}
    await client.post("/api/v1/doctor/patients", headers=hdrs, json={"full_name": "Patient A"})
    await client.post("/api/v1/doctor/patients", headers=hdrs, json={"full_name": "Patient B"})

    resp = await client.get("/api/v1/doctor/patients", headers=hdrs)
    assert resp.status_code == 200
    names = [p["full_name"] for p in resp.json()]
    assert "Patient A" in names
    assert "Patient B" in names


async def test_get_patient(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await _register_doctor(client, "get01")
    hdrs = {"Authorization": f"Bearer {token}"}
    created = (
        await client.post("/api/v1/doctor/patients", headers=hdrs, json={"full_name": "Bob Jones"})
    ).json()

    resp = await client.get(f"/api/v1/doctor/patients/{created['id']}", headers=hdrs)
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Bob Jones"


async def test_update_patient(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await _register_doctor(client, "upd01")
    hdrs = {"Authorization": f"Bearer {token}"}
    created = (
        await client.post("/api/v1/doctor/patients", headers=hdrs, json={"full_name": "Carol Old"})
    ).json()

    resp = await client.patch(
        f"/api/v1/doctor/patients/{created['id']}",
        headers=hdrs,
        json={"full_name": "Carol New"},
    )
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Carol New"


async def test_archive_patient(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await _register_doctor(client, "arch01")
    hdrs = {"Authorization": f"Bearer {token}"}
    created = (
        await client.post("/api/v1/doctor/patients", headers=hdrs, json={"full_name": "Dave Archive"})
    ).json()

    resp = await client.post(
        f"/api/v1/doctor/patients/{created['id']}/archive", headers=hdrs
    )
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}

    list_resp = await client.get("/api/v1/doctor/patients", headers=hdrs)
    ids = [p["id"] for p in list_resp.json()]
    assert created["id"] not in ids


async def test_doctor_cannot_access_other_doctors_patient(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token1 = await _register_doctor(client, "xdoc1")
    token2 = await _register_doctor(client, "xdoc2")

    created = (
        await client.post(
            "/api/v1/doctor/patients",
            headers={"Authorization": f"Bearer {token1}"},
            json={"full_name": "Private Patient"},
        )
    ).json()

    resp = await client.get(
        f"/api/v1/doctor/patients/{created['id']}",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert resp.status_code == 404


async def test_non_doctor_cannot_create_patient(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    patient_user = User(
        hashed_password="hash",
        role=UserRole.patient,
        is_active=True,
        consent_152fz=True,
    )
    db_session.add(patient_user)
    await db_session.flush()
    token = create_access_token({"sub": str(patient_user.id)})

    resp = await client.post(
        "/api/v1/doctor/patients",
        headers={"Authorization": f"Bearer {token}"},
        json={"full_name": "Unauthorized"},
    )
    assert resp.status_code == 403
