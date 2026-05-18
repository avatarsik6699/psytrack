"""Tests for Phase 05: side effects — SE dictionary, patient SE reporting, doctor SE rules, chart."""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.side_effects.models import SeDictionary


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _register_doctor(client: AsyncClient, suffix: str) -> str:
    resp = await client.post(
        "/api/v1/public/auth/register",
        json={
            "email": f"sedoc_{suffix}@test.com",
            "password": "Pass1234!",
            "full_name": f"Dr SE {suffix}",
            "consent_152fz": True,
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


async def _create_patient(client: AsyncClient, doc_token: str, name: str = "SE Patient") -> dict:
    resp = await client.post(
        "/api/v1/doctor/patients",
        headers={"Authorization": f"Bearer {doc_token}"},
        json={"full_name": name},
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


@pytest.fixture()
async def se_entry(db_session: AsyncSession) -> SeDictionary:
    from uuid import uuid4
    entry = SeDictionary(
        uku_code=f"T.{uuid4().hex[:4]}",
        name_ru="Тремор",
        name_en="Tremor",
        body_system="neurological",
        severity_min=0,
        severity_max=3,
    )
    db_session.add(entry)
    await db_session.flush()
    return entry


# ---------------------------------------------------------------------------
# B3 — GET /ref/se-dictionary
# ---------------------------------------------------------------------------


async def test_list_se_dictionary(client: AsyncClient, db_session: AsyncSession, se_entry: SeDictionary) -> None:
    token = await _register_doctor(client, "ref01")
    resp = await client.get(
        "/api/v1/ref/se-dictionary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1


async def test_search_se_dictionary_by_name(
    client: AsyncClient, db_session: AsyncSession, se_entry: SeDictionary
) -> None:
    token = await _register_doctor(client, "ref02")
    resp = await client.get(
        f"/api/v1/ref/se-dictionary?q=remor",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert any(i["name_en"] == "Tremor" for i in data["items"])


async def test_filter_se_dictionary_by_body_system(
    client: AsyncClient, db_session: AsyncSession, se_entry: SeDictionary
) -> None:
    token = await _register_doctor(client, "ref03")
    resp = await client.get(
        "/api/v1/ref/se-dictionary?body_system=neurological",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert all(i["body_system"] == "neurological" for i in data["items"])


# ---------------------------------------------------------------------------
# B4 — Patient SE endpoints
# ---------------------------------------------------------------------------


async def test_patient_lists_side_effects_empty(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    doc_token = await _register_doctor(client, "pse01")
    patient_data = await _create_patient(client, doc_token, "PSE Patient 01")
    pat_token = await _patient_token(client, patient_data)

    resp = await client.get(
        "/api/v1/patient/side-effects",
        headers={"Authorization": f"Bearer {pat_token}"},
    )
    assert resp.status_code == 200
    assert resp.json() == []


async def test_patient_reports_side_effect(
    client: AsyncClient, db_session: AsyncSession, se_entry: SeDictionary
) -> None:
    doc_token = await _register_doctor(client, "pse02")
    patient_data = await _create_patient(client, doc_token, "PSE Patient 02")
    pat_token = await _patient_token(client, patient_data)

    resp = await client.post(
        "/api/v1/patient/side-effects",
        headers={"Authorization": f"Bearer {pat_token}"},
        json={"se_id": str(se_entry.id), "severity": 2, "notes": "mild tremor"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["se_id"] == str(se_entry.id)
    assert data["severity"] == 2
    assert data["resolved"] is False
    assert "se" in data
    assert data["se"]["name_en"] == "Tremor"


async def test_patient_updates_side_effect(
    client: AsyncClient, db_session: AsyncSession, se_entry: SeDictionary
) -> None:
    doc_token = await _register_doctor(client, "pse03")
    patient_data = await _create_patient(client, doc_token, "PSE Patient 03")
    pat_token = await _patient_token(client, patient_data)

    create_resp = await client.post(
        "/api/v1/patient/side-effects",
        headers={"Authorization": f"Bearer {pat_token}"},
        json={"se_id": str(se_entry.id), "severity": 1},
    )
    assert create_resp.status_code == 201
    record_id = create_resp.json()["id"]

    patch_resp = await client.patch(
        f"/api/v1/patient/side-effects/{record_id}",
        headers={"Authorization": f"Bearer {pat_token}"},
        json={"severity": 3},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["severity"] == 3


async def test_patient_resolves_side_effect(
    client: AsyncClient, db_session: AsyncSession, se_entry: SeDictionary
) -> None:
    doc_token = await _register_doctor(client, "pse04")
    patient_data = await _create_patient(client, doc_token, "PSE Patient 04")
    pat_token = await _patient_token(client, patient_data)

    create_resp = await client.post(
        "/api/v1/patient/side-effects",
        headers={"Authorization": f"Bearer {pat_token}"},
        json={"se_id": str(se_entry.id), "severity": 2},
    )
    record_id = create_resp.json()["id"]

    resolve_resp = await client.patch(
        f"/api/v1/patient/side-effects/{record_id}",
        headers={"Authorization": f"Bearer {pat_token}"},
        json={"resolved": True},
    )
    assert resolve_resp.status_code == 200
    assert resolve_resp.json()["resolved"] is True


async def test_patient_soft_deletes_side_effect(
    client: AsyncClient, db_session: AsyncSession, se_entry: SeDictionary
) -> None:
    doc_token = await _register_doctor(client, "pse05")
    patient_data = await _create_patient(client, doc_token, "PSE Patient 05")
    pat_token = await _patient_token(client, patient_data)

    create_resp = await client.post(
        "/api/v1/patient/side-effects",
        headers={"Authorization": f"Bearer {pat_token}"},
        json={"se_id": str(se_entry.id), "severity": 1},
    )
    record_id = create_resp.json()["id"]

    del_resp = await client.delete(
        f"/api/v1/patient/side-effects/{record_id}",
        headers={"Authorization": f"Bearer {pat_token}"},
    )
    assert del_resp.status_code == 200
    assert del_resp.json() == {"ok": True}

    list_resp = await client.get(
        "/api/v1/patient/side-effects",
        headers={"Authorization": f"Bearer {pat_token}"},
    )
    assert list_resp.status_code == 200
    ids = [r["id"] for r in list_resp.json()]
    assert record_id not in ids


# ---------------------------------------------------------------------------
# B5 — Doctor SE monitoring rules
# ---------------------------------------------------------------------------


async def test_doctor_adds_se_rule(
    client: AsyncClient, db_session: AsyncSession, se_entry: SeDictionary
) -> None:
    doc_token = await _register_doctor(client, "ser01")
    patient_data = await _create_patient(client, doc_token, "Rule Patient 01")
    pid = patient_data["id"]

    resp = await client.post(
        f"/api/v1/doctor/patients/{pid}/se-rules",
        headers={"Authorization": f"Bearer {doc_token}"},
        json={"se_id": str(se_entry.id), "frequency_days": 7},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["se_id"] == str(se_entry.id)
    assert data["frequency_days"] == 7


async def test_doctor_removes_se_rule(
    client: AsyncClient, db_session: AsyncSession, se_entry: SeDictionary
) -> None:
    doc_token = await _register_doctor(client, "ser02")
    patient_data = await _create_patient(client, doc_token, "Rule Patient 02")
    pid = patient_data["id"]

    add_resp = await client.post(
        f"/api/v1/doctor/patients/{pid}/se-rules",
        headers={"Authorization": f"Bearer {doc_token}"},
        json={"se_id": str(se_entry.id), "frequency_days": 14},
    )
    assert add_resp.status_code == 201
    rule_id = add_resp.json()["id"]

    del_resp = await client.delete(
        f"/api/v1/doctor/patients/{pid}/se-rules/{rule_id}",
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert del_resp.status_code == 200
    assert del_resp.json() == {"ok": True}


async def test_doctor_lists_se_rules(
    client: AsyncClient, db_session: AsyncSession, se_entry: SeDictionary
) -> None:
    doc_token = await _register_doctor(client, "ser03")
    patient_data = await _create_patient(client, doc_token, "Rule Patient 03")
    pid = patient_data["id"]

    # Empty list before any rules
    list_resp = await client.get(
        f"/api/v1/doctor/patients/{pid}/se-rules",
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert list_resp.status_code == 200
    assert list_resp.json() == []

    # Add a rule then list again
    await client.post(
        f"/api/v1/doctor/patients/{pid}/se-rules",
        headers={"Authorization": f"Bearer {doc_token}"},
        json={"se_id": str(se_entry.id), "frequency_days": 7},
    )
    list_resp2 = await client.get(
        f"/api/v1/doctor/patients/{pid}/se-rules",
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert list_resp2.status_code == 200
    rules = list_resp2.json()
    assert len(rules) == 1
    assert rules[0]["se_id"] == str(se_entry.id)
    assert rules[0]["frequency_days"] == 7
    assert "se" in rules[0]


async def test_doctor_add_se_rule_event_log_uses_user_id(
    client: AsyncClient, db_session: AsyncSession, se_entry: SeDictionary
) -> None:
    """Regression: event_log.created_by must be user.id, not doctor_profile.id."""
    from uuid import UUID

    from sqlalchemy import select

    from app.modules.events.models import EventLog
    from app.modules.users.models import User

    doc_token = await _register_doctor(client, "ser04")
    patient_data = await _create_patient(client, doc_token, "Rule Patient 04")
    pid = patient_data["id"]

    resp = await client.post(
        f"/api/v1/doctor/patients/{pid}/se-rules",
        headers={"Authorization": f"Bearer {doc_token}"},
        json={"se_id": str(se_entry.id), "frequency_days": 3},
    )
    assert resp.status_code == 201

    event = await db_session.scalar(
        select(EventLog)
        .where(EventLog.patient_id == UUID(pid))
        .where(EventLog.event_type == "monitoring_rule_changed")
        .order_by(EventLog.created_at.desc())
    )
    assert event is not None, "event_log entry not found"
    assert event.created_by is not None, "created_by should not be None"

    user = await db_session.scalar(
        select(User).where(User.id == event.created_by)
    )
    assert user is not None, "created_by references a non-user UUID (FK bug regression)"


# ---------------------------------------------------------------------------
# B6 — Doctor SE chart
# ---------------------------------------------------------------------------


async def test_doctor_gets_se_chart(
    client: AsyncClient, db_session: AsyncSession, se_entry: SeDictionary
) -> None:
    doc_token = await _register_doctor(client, "chart01")
    patient_data = await _create_patient(client, doc_token, "Chart Patient 01")
    pid = patient_data["id"]
    pat_token = await _patient_token(client, patient_data)

    await client.post(
        "/api/v1/patient/side-effects",
        headers={"Authorization": f"Bearer {pat_token}"},
        json={"se_id": str(se_entry.id), "severity": 2},
    )

    chart_resp = await client.get(
        f"/api/v1/doctor/patients/{pid}/charts/side-effects",
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert chart_resp.status_code == 200
    data = chart_resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    point = data[0]
    assert "date" in point
    assert "se_id" in point
    assert "severity" in point
