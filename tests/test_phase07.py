"""Integration tests for Phase 07: score chart, therapy goals, PatientOut extras."""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _register_doctor(client: AsyncClient, suffix: str) -> str:
    resp = await client.post(
        "/api/v1/public/auth/register",
        json={
            "email": f"p07doc_{suffix}@test.com",
            "password": "Pass1234!",
            "full_name": f"Dr P07 {suffix}",
            "consent_152fz": True,
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


async def _create_patient(client: AsyncClient, token: str, name: str = "P07 Patient") -> dict:
    resp = await client.post(
        "/api/v1/doctor/patients",
        headers={"Authorization": f"Bearer {token}"},
        json={"full_name": name},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


# ---------------------------------------------------------------------------
# B1 — score chart endpoint
# ---------------------------------------------------------------------------


async def test_score_chart_empty(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await _register_doctor(client, "sc01")
    patient = await _create_patient(client, token, "ScoreChart Patient")
    resp = await client.get(
        f"/api/v1/doctor/patients/{patient['id']}/charts/scores",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json() == []


# ---------------------------------------------------------------------------
# B2 — therapy goals CRUD
# ---------------------------------------------------------------------------


async def test_therapy_goals_list_empty(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await _register_doctor(client, "tg01")
    patient = await _create_patient(client, token, "Goals Patient")
    resp = await client.get(
        f"/api/v1/doctor/patients/{patient['id']}/goals",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json() == []


async def test_therapy_goals_create(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await _register_doctor(client, "tg02")
    patient = await _create_patient(client, token, "Goals Patient 2")
    resp = await client.post(
        f"/api/v1/doctor/patients/{patient['id']}/goals",
        headers={"Authorization": f"Bearer {token}"},
        json={"description": "Reduce PHQ-9 score to below 5"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["description"] == "Reduce PHQ-9 score to below 5"
    assert data["is_completed"] is False
    assert data["patient_id"] == patient["id"]


async def test_therapy_goals_patch(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await _register_doctor(client, "tg03")
    patient = await _create_patient(client, token, "Goals Patient 3")
    create_resp = await client.post(
        f"/api/v1/doctor/patients/{patient['id']}/goals",
        headers={"Authorization": f"Bearer {token}"},
        json={"description": "Initial goal"},
    )
    assert create_resp.status_code == 201
    goal_id = create_resp.json()["id"]

    patch_resp = await client.patch(
        f"/api/v1/doctor/patients/{patient['id']}/goals/{goal_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"is_completed": True},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["is_completed"] is True


async def test_therapy_goals_404_wrong_patient(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token = await _register_doctor(client, "tg04")
    patient = await _create_patient(client, token, "Goals Patient 4")
    resp = await client.patch(
        f"/api/v1/doctor/patients/{patient['id']}/goals/00000000-0000-0000-0000-000000000000",
        headers={"Authorization": f"Bearer {token}"},
        json={"is_completed": True},
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# B3 — PatientOut extra fields
# ---------------------------------------------------------------------------


async def test_patient_out_includes_b3_fields(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token = await _register_doctor(client, "b301")
    patient = await _create_patient(client, token, "B3 Patient")
    resp = await client.get(
        f"/api/v1/doctor/patients/{patient['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "adherence_percent" in data
    assert "latest_scores" in data
    assert "active_medications_summary" in data
    assert data["adherence_percent"] is None  # no dose events yet
    assert data["latest_scores"] == []
    assert data["active_medications_summary"] == []


async def test_roster_includes_b3_fields(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await _register_doctor(client, "b302")
    await _create_patient(client, token, "B3 Roster Patient")
    resp = await client.get(
        "/api/v1/doctor/patients",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    patients = resp.json()
    assert len(patients) >= 1
    for p in patients:
        assert "adherence_percent" in p
        assert "latest_scores" in p
        assert "active_medications_summary" in p


# ---------------------------------------------------------------------------
# severity helper (unit)
# ---------------------------------------------------------------------------


def test_severity_label_phq9() -> None:
    from app.modules.scales.severity import compute_severity_label

    assert compute_severity_label("PHQ-9", 3) == "Minimal"
    assert compute_severity_label("PHQ-9", 7) == "Mild"
    assert compute_severity_label("PHQ-9", 12) == "Moderate"
    assert compute_severity_label("PHQ-9", 17) == "Mod. Severe"
    assert compute_severity_label("PHQ-9", 22) == "Severe"


def test_severity_label_gad7() -> None:
    from app.modules.scales.severity import compute_severity_label

    assert compute_severity_label("GAD-7", 2) == "Minimal"
    assert compute_severity_label("GAD-7", 6) == "Mild"
    assert compute_severity_label("GAD-7", 11) == "Moderate"
    assert compute_severity_label("GAD-7", 15) == "Severe"


def test_severity_label_unknown() -> None:
    from app.modules.scales.severity import compute_severity_label

    assert compute_severity_label("UNKNOWN", 10) == "N/A"
