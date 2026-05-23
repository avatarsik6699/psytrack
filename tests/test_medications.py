"""Tests for medications reference and patient medication assignment endpoints."""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.medications.models import MedicationReference


async def _register_doctor(client: AsyncClient, suffix: str) -> str:
    return await client.create_doctor_token(f"meddoc_{suffix}@test.com", f"Dr {suffix}")


async def _create_patient(client: AsyncClient, token: str, name: str = "Med Patient") -> dict:
    resp = await client.post(
        "/api/v1/doctor/patients",
        headers={"Authorization": f"Bearer {token}"},
        json={"full_name": name},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


@pytest.fixture()
async def medication_ref(db_session: AsyncSession) -> MedicationReference:
    med = MedicationReference(inn="sertraline", brand_names=["Zoloft"])
    db_session.add(med)
    await db_session.flush()
    return med


async def test_list_ref_medications(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await _register_doctor(client, "ref01")
    resp = await client.get(
        "/api/v1/ref/medications",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_search_ref_medications(
    client: AsyncClient, db_session: AsyncSession, medication_ref: MedicationReference
) -> None:
    token = await _register_doctor(client, "ref02")
    resp = await client.get(
        "/api/v1/ref/medications?q=sertr",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert any(m["inn"] == "sertraline" for m in data)


async def test_assign_medication_to_patient(
    client: AsyncClient, db_session: AsyncSession, medication_ref: MedicationReference
) -> None:
    token = await _register_doctor(client, "assign01")
    patient = await _create_patient(client, token)
    pid = patient["id"]

    resp = await client.post(
        f"/api/v1/doctor/patients/{pid}/medications",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "medication_id": str(medication_ref.id),
            "dose_mg": "50",
            "unit": "mg",
            "frequency": "once daily",
            "dose_precision": "exact",
        },
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["medication"]["inn"] == "sertraline"
    assert data["frequency"] == "once daily"
    assert data["created_by_role"] == "doctor"


async def test_update_patient_medication(
    client: AsyncClient, db_session: AsyncSession, medication_ref: MedicationReference
) -> None:
    token = await _register_doctor(client, "updmed01")
    patient = await _create_patient(client, token)
    pid = patient["id"]

    pm = (
        await client.post(
            f"/api/v1/doctor/patients/{pid}/medications",
            headers={"Authorization": f"Bearer {token}"},
            json={"medication_id": str(medication_ref.id), "frequency": "twice daily"},
        )
    ).json()

    resp = await client.patch(
        f"/api/v1/doctor/patients/{pid}/medications/{pm['id']}",
        headers={"Authorization": f"Bearer {token}"},
        json={"frequency": "once daily"},
    )
    assert resp.status_code == 200
    assert resp.json()["frequency"] == "once daily"


async def test_cross_doctor_medication_returns_404(
    client: AsyncClient, db_session: AsyncSession, medication_ref: MedicationReference
) -> None:
    token1 = await _register_doctor(client, "xmed01")
    token2 = await _register_doctor(client, "xmed02")
    patient = await _create_patient(client, token1)
    pid = patient["id"]

    pm = (
        await client.post(
            f"/api/v1/doctor/patients/{pid}/medications",
            headers={"Authorization": f"Bearer {token1}"},
            json={"medication_id": str(medication_ref.id)},
        )
    ).json()

    resp = await client.patch(
        f"/api/v1/doctor/patients/{pid}/medications/{pm['id']}",
        headers={"Authorization": f"Bearer {token2}"},
        json={"frequency": "PRN"},
    )
    assert resp.status_code == 404
