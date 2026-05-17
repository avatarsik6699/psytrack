"""Tests for diagnoses endpoints."""

from __future__ import annotations

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


async def _register_doctor(client: AsyncClient, suffix: str) -> str:
    resp = await client.post(
        "/api/v1/public/auth/register",
        json={
            "email": f"dxdoc_{suffix}@test.com",
            "password": "Pass1234!",
            "full_name": f"Dr {suffix}",
            "consent_152fz": True,
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


async def _create_patient(client: AsyncClient, token: str, name: str = "Test Patient") -> dict:
    resp = await client.post(
        "/api/v1/doctor/patients",
        headers={"Authorization": f"Bearer {token}"},
        json={"full_name": name},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


async def test_create_diagnosis(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await _register_doctor(client, "diag01")
    patient = await _create_patient(client, token)
    pid = patient["id"]

    resp = await client.post(
        f"/api/v1/doctor/patients/{pid}/diagnoses",
        headers={"Authorization": f"Bearer {token}"},
        json={"icd_code": "F32.1", "name": "Moderate depressive episode", "is_primary": True},
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["icd_code"] == "F32.1"
    assert data["name"] == "Moderate depressive episode"
    assert data["is_primary"] is True
    assert data["patient_id"] == pid


async def test_update_diagnosis(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await _register_doctor(client, "diag02")
    patient = await _create_patient(client, token)
    pid = patient["id"]

    diag = (
        await client.post(
            f"/api/v1/doctor/patients/{pid}/diagnoses",
            headers={"Authorization": f"Bearer {token}"},
            json={"icd_code": "F41.1", "name": "Generalized anxiety disorder"},
        )
    ).json()

    resp = await client.patch(
        f"/api/v1/doctor/patients/{pid}/diagnoses/{diag['id']}",
        headers={"Authorization": f"Bearer {token}"},
        json={"notes": "Onset 2023"},
    )
    assert resp.status_code == 200
    assert resp.json()["notes"] == "Onset 2023"


async def test_cross_doctor_diagnosis_returns_404(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token1 = await _register_doctor(client, "dxd01")
    token2 = await _register_doctor(client, "dxd02")
    patient = await _create_patient(client, token1)
    pid = patient["id"]

    diag = (
        await client.post(
            f"/api/v1/doctor/patients/{pid}/diagnoses",
            headers={"Authorization": f"Bearer {token1}"},
            json={"icd_code": "F20.0", "name": "Paranoid schizophrenia"},
        )
    ).json()

    resp = await client.patch(
        f"/api/v1/doctor/patients/{pid}/diagnoses/{diag['id']}",
        headers={"Authorization": f"Bearer {token2}"},
        json={"notes": "Unauthorized"},
    )
    assert resp.status_code == 404
