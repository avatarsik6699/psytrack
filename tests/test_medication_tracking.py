"""Tests for Phase 04: patient medication tracking and doctor chart endpoints."""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.medications.models import MedicationReference


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _register_doctor(client: AsyncClient, suffix: str) -> str:
    return await client.create_doctor_token(f"trackdoc_{suffix}@test.com", f"Dr {suffix}")


async def _create_patient(client: AsyncClient, doc_token: str) -> dict:
    resp = await client.post(
        "/api/v1/doctor/patients",
        headers={"Authorization": f"Bearer {doc_token}"},
        json={"full_name": "Track Patient"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


async def _patient_token(client: AsyncClient, patient_data: dict) -> str:
    resp = await client.post(
        "/api/v1/public/auth/patient-login",
        json={
            "temp_login": patient_data["temp_login"],
            "password": patient_data["temp_password"],
        },
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


async def _assign_medication(
    client: AsyncClient, doc_token: str, patient_id: str, med_id: str
) -> dict:
    resp = await client.post(
        f"/api/v1/doctor/patients/{patient_id}/medications",
        headers={"Authorization": f"Bearer {doc_token}"},
        json={"medication_id": med_id, "dose_mg": "50", "unit": "mg", "frequency": "once daily"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


@pytest.fixture()
async def medication_ref(db_session: AsyncSession) -> MedicationReference:
    from uuid import uuid4

    med = MedicationReference(inn=f"sertraline_{uuid4().hex[:6]}", brand_names=["Zoloft"])
    db_session.add(med)
    await db_session.flush()
    return med


# ---------------------------------------------------------------------------
# B1 — GET /patient/medications
# ---------------------------------------------------------------------------


async def test_patient_lists_own_medications(
    client: AsyncClient, db_session: AsyncSession, medication_ref: MedicationReference
) -> None:
    doc_token = await _register_doctor(client, "lst01")
    patient = await _create_patient(client, doc_token)
    p_token = await _patient_token(client, patient)

    await _assign_medication(client, doc_token, patient["id"], str(medication_ref.id))

    resp = await client.get(
        "/api/v1/patient/medications",
        headers={"Authorization": f"Bearer {p_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert any(m["medication"]["inn"] == medication_ref.inn for m in data)


async def test_patient_list_empty_without_meds(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    doc_token = await _register_doctor(client, "lst02")
    patient = await _create_patient(client, doc_token)
    p_token = await _patient_token(client, patient)

    resp = await client.get(
        "/api/v1/patient/medications",
        headers={"Authorization": f"Bearer {p_token}"},
    )
    assert resp.status_code == 200
    assert resp.json() == []


# ---------------------------------------------------------------------------
# B2 — PATCH /patient/medications/{id}/log
# ---------------------------------------------------------------------------


async def test_patient_logs_dose_taken(
    client: AsyncClient, db_session: AsyncSession, medication_ref: MedicationReference
) -> None:
    from datetime import datetime, timezone

    doc_token = await _register_doctor(client, "log01")
    patient = await _create_patient(client, doc_token)
    p_token = await _patient_token(client, patient)

    pm = await _assign_medication(client, doc_token, patient["id"], str(medication_ref.id))

    resp = await client.patch(
        f"/api/v1/patient/medications/{pm['id']}/log",
        headers={"Authorization": f"Bearer {p_token}"},
        json={"status": "taken", "occurred_at": datetime.now(timezone.utc).isoformat()},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["event_type"] == "dose_taken"
    assert data["patient_id"] == patient["id"]


async def test_patient_logs_dose_missed(
    client: AsyncClient, db_session: AsyncSession, medication_ref: MedicationReference
) -> None:
    from datetime import datetime, timezone

    doc_token = await _register_doctor(client, "log02")
    patient = await _create_patient(client, doc_token)
    p_token = await _patient_token(client, patient)

    pm = await _assign_medication(client, doc_token, patient["id"], str(medication_ref.id))

    resp = await client.patch(
        f"/api/v1/patient/medications/{pm['id']}/log",
        headers={"Authorization": f"Bearer {p_token}"},
        json={"status": "missed", "occurred_at": datetime.now(timezone.utc).isoformat()},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["event_type"] == "dose_missed"


async def test_patient_cannot_log_another_patients_medication(
    client: AsyncClient, db_session: AsyncSession, medication_ref: MedicationReference
) -> None:
    from datetime import datetime, timezone

    doc_token = await _register_doctor(client, "log03")
    patient1 = await _create_patient(client, doc_token)
    patient2 = await _create_patient(client, doc_token)
    p2_token = await _patient_token(client, patient2)

    pm = await _assign_medication(client, doc_token, patient1["id"], str(medication_ref.id))

    resp = await client.patch(
        f"/api/v1/patient/medications/{pm['id']}/log",
        headers={"Authorization": f"Bearer {p2_token}"},
        json={"status": "taken", "occurred_at": datetime.now(timezone.utc).isoformat()},
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# B3 — POST /patient/medications
# ---------------------------------------------------------------------------


async def test_patient_adds_own_medication(
    client: AsyncClient, db_session: AsyncSession, medication_ref: MedicationReference
) -> None:
    doc_token = await _register_doctor(client, "add01")
    patient = await _create_patient(client, doc_token)
    p_token = await _patient_token(client, patient)

    resp = await client.post(
        "/api/v1/patient/medications",
        headers={"Authorization": f"Bearer {p_token}"},
        json={"medication_id": str(medication_ref.id), "dose_mg": "25", "frequency": "twice daily"},
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["created_by_role"] == "patient"
    assert data["medication"]["inn"] == medication_ref.inn


# ---------------------------------------------------------------------------
# B4 — PATCH /patient/medications/{id}
# ---------------------------------------------------------------------------


async def test_patient_edits_own_medication(
    client: AsyncClient, db_session: AsyncSession, medication_ref: MedicationReference
) -> None:
    doc_token = await _register_doctor(client, "edit01")
    patient = await _create_patient(client, doc_token)
    p_token = await _patient_token(client, patient)

    pm = await _assign_medication(client, doc_token, patient["id"], str(medication_ref.id))

    resp = await client.patch(
        f"/api/v1/patient/medications/{pm['id']}",
        headers={"Authorization": f"Bearer {p_token}"},
        json={"frequency": "PRN"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["frequency"] == "PRN"


# ---------------------------------------------------------------------------
# B5 — DELETE /patient/medications/{id}
# ---------------------------------------------------------------------------


async def test_patient_stops_medication(
    client: AsyncClient, db_session: AsyncSession, medication_ref: MedicationReference
) -> None:
    doc_token = await _register_doctor(client, "stop01")
    patient = await _create_patient(client, doc_token)
    p_token = await _patient_token(client, patient)

    pm = await _assign_medication(client, doc_token, patient["id"], str(medication_ref.id))

    resp = await client.delete(
        f"/api/v1/patient/medications/{pm['id']}",
        headers={"Authorization": f"Bearer {p_token}"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json() == {"ok": True}

    list_resp = await client.get(
        "/api/v1/patient/medications",
        headers={"Authorization": f"Bearer {p_token}"},
    )
    assert not any(m["id"] == pm["id"] for m in list_resp.json())


# ---------------------------------------------------------------------------
# B6 — GET /doctor/patients/{id}/charts/medications
# ---------------------------------------------------------------------------


async def test_doctor_gets_medication_chart(
    client: AsyncClient, db_session: AsyncSession, medication_ref: MedicationReference
) -> None:
    doc_token = await _register_doctor(client, "chart01")
    patient = await _create_patient(client, doc_token)

    await _assign_medication(client, doc_token, patient["id"], str(medication_ref.id))

    resp = await client.get(
        f"/api/v1/doctor/patients/{patient['id']}/charts/medications",
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 1
    series = data[0]
    assert series["inn"] == medication_ref.inn
    assert isinstance(series["points"], list)


async def test_doctor_chart_empty_for_no_meds(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    doc_token = await _register_doctor(client, "chart02")
    patient = await _create_patient(client, doc_token)

    resp = await client.get(
        f"/api/v1/doctor/patients/{patient['id']}/charts/medications",
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert resp.status_code == 200
    assert resp.json() == []


async def test_cross_doctor_chart_returns_404(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    doc1_token = await _register_doctor(client, "chart03")
    doc2_token = await _register_doctor(client, "chart04")
    patient = await _create_patient(client, doc1_token)

    resp = await client.get(
        f"/api/v1/doctor/patients/{patient['id']}/charts/medications",
        headers={"Authorization": f"Bearer {doc2_token}"},
    )
    assert resp.status_code == 404
