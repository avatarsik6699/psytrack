"""Integration tests for Phase 06: event timeline, card_color roster, task generation."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.events.models import EventLog


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _register_doctor(client: AsyncClient, suffix: str) -> str:
    return await client.create_doctor_token(f"p06doc_{suffix}@test.com", f"Dr P06 {suffix}")


async def _create_patient(client: AsyncClient, doc_token: str, name: str = "P06 Patient") -> dict:
    resp = await client.post(
        "/api/v1/doctor/patients",
        headers={"Authorization": f"Bearer {doc_token}"},
        json={"full_name": name},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


INTERNAL_KEY = os.environ.get("INTERNAL_KEY", "CHANGE_ME_INTERNAL_KEY")


# ---------------------------------------------------------------------------
# GET /doctor/patients — card_color field
# ---------------------------------------------------------------------------


async def test_roster_includes_card_color(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await _register_doctor(client, "color01")
    hdrs = {"Authorization": f"Bearer {token}"}
    await _create_patient(client, token, "Color Patient A")
    await _create_patient(client, token, "Color Patient B")

    resp = await client.get("/api/v1/doctor/patients", headers=hdrs)
    assert resp.status_code == 200
    patients = resp.json()
    assert len(patients) >= 2
    for p in patients:
        assert "card_color" in p
        assert p["card_color"] in ("red", "yellow", "green", "gray")


async def test_roster_sorted_by_color_priority(client: AsyncClient, db_session: AsyncSession) -> None:
    """Patients without clinical data all get gray; order must be stable (no red/yellow/green ahead)."""
    token = await _register_doctor(client, "colorsort01")
    hdrs = {"Authorization": f"Bearer {token}"}
    for i in range(3):
        await _create_patient(client, token, f"Sort Patient {i}")

    resp = await client.get("/api/v1/doctor/patients", headers=hdrs)
    assert resp.status_code == 200
    colors = [p["card_color"] for p in resp.json()]
    order = {"red": 0, "yellow": 1, "green": 2, "gray": 3}
    assert colors == sorted(colors, key=lambda c: order[c])


# ---------------------------------------------------------------------------
# GET /doctor/patients/{id}/events — paginated timeline
# ---------------------------------------------------------------------------


async def test_events_empty_for_new_patient(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await _register_doctor(client, "ev01")
    patient = await _create_patient(client, token)
    pid = patient["id"]

    resp = await client.get(
        f"/api/v1/doctor/patients/{pid}/events",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["items"] == []
    assert body["total"] == 0
    assert body["page"] == 1
    assert body["size"] == 20


async def test_events_returns_inserted_events(client: AsyncClient, db_session: AsyncSession) -> None:
    from uuid import UUID

    token = await _register_doctor(client, "ev02")
    patient = await _create_patient(client, token)
    pid = patient["id"]
    pid_uuid = UUID(pid)

    # Insert 3 events directly into the session
    now = datetime.now(timezone.utc)
    for i in range(3):
        db_session.add(
            EventLog(
                patient_id=pid_uuid,
                event_type=f"test_event_{i}",
                payload={"index": i},
                occurred_at=now,
                created_at=now,
            )
        )
    await db_session.flush()

    resp = await client.get(
        f"/api/v1/doctor/patients/{pid}/events",
        headers={"Authorization": f"Bearer {token}"},
        params={"page": 1, "size": 20},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 3
    assert len(body["items"]) == 3
    event_types = {e["event_type"] for e in body["items"]}
    assert event_types == {"test_event_0", "test_event_1", "test_event_2"}


async def test_events_pagination(client: AsyncClient, db_session: AsyncSession) -> None:
    from uuid import UUID

    token = await _register_doctor(client, "ev03")
    patient = await _create_patient(client, token)
    pid = patient["id"]
    pid_uuid = UUID(pid)

    now = datetime.now(timezone.utc)
    for i in range(5):
        db_session.add(
            EventLog(
                patient_id=pid_uuid,
                event_type=f"page_event_{i}",
                occurred_at=now,
                created_at=now,
            )
        )
    await db_session.flush()

    resp = await client.get(
        f"/api/v1/doctor/patients/{pid}/events",
        headers={"Authorization": f"Bearer {token}"},
        params={"page": 1, "size": 3},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 5
    assert len(body["items"]) == 3
    assert body["page"] == 1
    assert body["size"] == 3

    resp2 = await client.get(
        f"/api/v1/doctor/patients/{pid}/events",
        headers={"Authorization": f"Bearer {token}"},
        params={"page": 2, "size": 3},
    )
    assert resp2.status_code == 200
    body2 = resp2.json()
    assert body2["total"] == 5
    assert len(body2["items"]) == 2


async def test_events_requires_doctor_ownership(client: AsyncClient, db_session: AsyncSession) -> None:
    """Doctor B cannot access events of Doctor A's patient."""
    token_a = await _register_doctor(client, "evown_a")
    token_b = await _register_doctor(client, "evown_b")
    patient = await _create_patient(client, token_a)
    pid = patient["id"]

    resp = await client.get(
        f"/api/v1/doctor/patients/{pid}/events",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert resp.status_code == 404


async def test_events_requires_auth(client: AsyncClient, db_session: AsyncSession) -> None:
    resp = await client.get(f"/api/v1/doctor/patients/{uuid4()}/events")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# POST /system/tasks/generate — internal endpoint
# ---------------------------------------------------------------------------


async def test_task_generate_wrong_key_returns_403(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    resp = await client.post(
        "/api/v1/system/tasks/generate",
        headers={"X-Internal-Key": "wrong-key"},
    )
    assert resp.status_code == 403


async def test_task_generate_missing_key_returns_403(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    resp = await client.post("/api/v1/system/tasks/generate")
    assert resp.status_code == 403


async def test_task_generate_valid_key_returns_generated_count(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    resp = await client.post(
        "/api/v1/system/tasks/generate",
        headers={"X-Internal-Key": INTERNAL_KEY},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "generated" in body
    assert isinstance(body["generated"], int)
    assert body["generated"] >= 0


async def test_task_generate_idempotent(client: AsyncClient, db_session: AsyncSession) -> None:
    """Calling generate twice in the same day must not create duplicate tasks."""
    resp1 = await client.post(
        "/api/v1/system/tasks/generate",
        headers={"X-Internal-Key": INTERNAL_KEY},
    )
    assert resp1.status_code == 200
    first_count = resp1.json()["generated"]

    resp2 = await client.post(
        "/api/v1/system/tasks/generate",
        headers={"X-Internal-Key": INTERNAL_KEY},
    )
    assert resp2.status_code == 200
    # Second call must generate 0 new tasks since pending tasks already exist
    assert resp2.json()["generated"] == 0 or first_count == 0
