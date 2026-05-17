"""Tests for scale assignment endpoints and delete business-logic guard."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.scales.models import PatientScale, Scale, TestCompletion


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _register_doctor(client: AsyncClient, suffix: str) -> str:
    resp = await client.post(
        "/api/v1/public/auth/register",
        json={
            "email": f"scaledoc_{suffix}@test.com",
            "password": "Pass1234!",
            "full_name": f"Dr Scale {suffix}",
            "consent_152fz": True,
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


async def _create_patient(client: AsyncClient, token: str, name: str = "Scale Patient") -> dict:
    resp = await client.post(
        "/api/v1/doctor/patients",
        headers={"Authorization": f"Bearer {token}"},
        json={"full_name": name},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


async def _add_diagnosis(client: AsyncClient, token: str, patient_id: str) -> dict:
    resp = await client.post(
        f"/api/v1/doctor/patients/{patient_id}/diagnoses",
        headers={"Authorization": f"Bearer {token}"},
        json={"icd_code": "F32.1", "name": "Depressive episode"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


@pytest.fixture()
async def scale(db_session: AsyncSession) -> Scale:
    s = Scale(
        code="TEST9",
        name="Test Scale 9",
        score_min=0,
        score_max=27,
        improvement_direction="lower",
        questions_json=[
            {
                "id": i,
                "text": f"Question {i}",
                "options": [{"value": 0, "label": "Not at all"}, {"value": 1, "label": "Several days"}],
            }
            for i in range(1, 10)
        ],
    )
    db_session.add(s)
    await db_session.flush()
    return s


# ---------------------------------------------------------------------------
# Tests: assign and list
# ---------------------------------------------------------------------------


async def test_assign_scale_to_patient(
    client: AsyncClient, db_session: AsyncSession, scale: Scale
) -> None:
    token = await _register_doctor(client, "asgn01")
    patient = await _create_patient(client, token)
    pid = patient["id"]
    diag = await _add_diagnosis(client, token, pid)

    resp = await client.post(
        f"/api/v1/doctor/patients/{pid}/scales",
        headers={"Authorization": f"Bearer {token}"},
        json={"scale_id": str(scale.id), "diagnosis_id": diag["id"], "frequency_days": 7},
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["scale_id"] == str(scale.id)
    assert data["frequency_days"] == 7
    assert data["patient_id"] == pid
    assert data["scale"]["code"] == "TEST9"


async def test_list_patient_scales_returns_assigned(
    client: AsyncClient, db_session: AsyncSession, scale: Scale
) -> None:
    token = await _register_doctor(client, "list01")
    patient = await _create_patient(client, token)
    pid = patient["id"]
    diag = await _add_diagnosis(client, token, pid)

    await client.post(
        f"/api/v1/doctor/patients/{pid}/scales",
        headers={"Authorization": f"Bearer {token}"},
        json={"scale_id": str(scale.id), "diagnosis_id": diag["id"], "frequency_days": 14},
    )

    resp = await client.get(
        f"/api/v1/doctor/patients/{pid}/scales",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200, resp.text
    items = resp.json()
    assert len(items) == 1
    assert items[0]["scale_id"] == str(scale.id)


async def test_list_patient_scales_empty_by_default(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token = await _register_doctor(client, "list02")
    patient = await _create_patient(client, token)
    pid = patient["id"]

    resp = await client.get(
        f"/api/v1/doctor/patients/{pid}/scales",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json() == []


# ---------------------------------------------------------------------------
# Tests: delete — no completions (allowed)
# ---------------------------------------------------------------------------


async def test_delete_scale_without_completions_succeeds(
    client: AsyncClient, db_session: AsyncSession, scale: Scale
) -> None:
    token = await _register_doctor(client, "del01")
    patient = await _create_patient(client, token)
    pid = patient["id"]
    diag = await _add_diagnosis(client, token, pid)

    ps = (
        await client.post(
            f"/api/v1/doctor/patients/{pid}/scales",
            headers={"Authorization": f"Bearer {token}"},
            json={"scale_id": str(scale.id), "diagnosis_id": diag["id"], "frequency_days": 7},
        )
    ).json()

    resp = await client.delete(
        f"/api/v1/doctor/patients/{pid}/scales/{ps['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json() == {"ok": True}

    # Confirm it's gone from the list
    list_resp = await client.get(
        f"/api/v1/doctor/patients/{pid}/scales",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_resp.json() == []


# ---------------------------------------------------------------------------
# Tests: delete — with completions (blocked, 409)
# ---------------------------------------------------------------------------


async def test_delete_scale_with_completions_returns_409(
    client: AsyncClient, db_session: AsyncSession, scale: Scale
) -> None:
    """Doctor cannot delete a patient_scale that already has submitted assessments.

    ON DELETE CASCADE would silently destroy clinical history — the service
    blocks this at the application level and returns 409 Conflict.
    """
    token = await _register_doctor(client, "del02")
    patient = await _create_patient(client, token)
    pid = patient["id"]
    diag = await _add_diagnosis(client, token, pid)

    ps_resp = await client.post(
        f"/api/v1/doctor/patients/{pid}/scales",
        headers={"Authorization": f"Bearer {token}"},
        json={"scale_id": str(scale.id), "diagnosis_id": diag["id"], "frequency_days": 7},
    )
    ps_data = ps_resp.json()
    ps_id = ps_data["id"]

    # Simulate a submitted test completion directly in DB (avoids patient auth setup)
    from uuid import UUID

    tc = TestCompletion(
        patient_id=UUID(pid),
        patient_scale_id=UUID(ps_id),
        scale_id=scale.id,
        score=5,
        answers_json=[{"question_id": 1, "value": 1}],
        baseline=False,
        completed_at=datetime.now(timezone.utc),
    )
    db_session.add(tc)
    await db_session.flush()

    resp = await client.delete(
        f"/api/v1/doctor/patients/{pid}/scales/{ps_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 409, resp.text
    assert "completed assessments" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# Tests: delete — cross-doctor isolation
# ---------------------------------------------------------------------------


async def test_delete_scale_cross_doctor_returns_404(
    client: AsyncClient, db_session: AsyncSession, scale: Scale
) -> None:
    """A doctor cannot delete a scale assigned to another doctor's patient."""
    token1 = await _register_doctor(client, "xdel01")
    token2 = await _register_doctor(client, "xdel02")
    patient = await _create_patient(client, token1)
    pid = patient["id"]
    diag = await _add_diagnosis(client, token1, pid)

    ps = (
        await client.post(
            f"/api/v1/doctor/patients/{pid}/scales",
            headers={"Authorization": f"Bearer {token1}"},
            json={"scale_id": str(scale.id), "diagnosis_id": diag["id"], "frequency_days": 7},
        )
    ).json()

    resp = await client.delete(
        f"/api/v1/doctor/patients/{pid}/scales/{ps['id']}",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert resp.status_code == 404
