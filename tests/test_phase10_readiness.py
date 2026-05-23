from __future__ import annotations

import importlib.util
from pathlib import Path

from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.db.base import Base
from app.main import create_app
from app.modules.users.models import User, UserRole


async def test_auth_rate_limit_applies_to_login(client: AsyncClient) -> None:
    for _ in range(20):
        response = await client.post(
            "/api/v1/public/auth/login",
            json={"email": "missing@example.com", "password": "wrongpassword"},
        )
        assert response.status_code == 401

    limited = await client.post(
        "/api/v1/public/auth/login",
        json={"email": "missing@example.com", "password": "wrongpassword"},
    )

    assert limited.status_code == 429


async def test_production_docs_and_openapi_are_disabled() -> None:
    original_env = settings.APP_ENV
    settings.APP_ENV = "production"
    try:
        production_app = create_app()
    finally:
        settings.APP_ENV = original_env

    async with AsyncClient(
        transport=ASGITransport(app=production_app),
        base_url="http://test",
    ) as client:
        assert (await client.get("/docs")).status_code == 404
        assert (await client.get("/redoc")).status_code == 404
        assert (await client.get("/openapi.json")).status_code == 404


async def test_development_docs_and_openapi_remain_available() -> None:
    original_env = settings.APP_ENV
    settings.APP_ENV = "development"
    try:
        development_app = create_app()
    finally:
        settings.APP_ENV = original_env

    async with AsyncClient(
        transport=ASGITransport(app=development_app),
        base_url="http://test",
    ) as client:
        assert (await client.get("/docs")).status_code == 200
        assert (await client.get("/redoc")).status_code == 200
        assert (await client.get("/openapi.json")).status_code == 200


async def test_create_doctor_command_logic_persists_doctor(
    tmp_path,
    monkeypatch,
) -> None:
    module_path = Path("scripts/create-doctor.py")
    spec = importlib.util.spec_from_file_location("create_doctor_script", module_path)
    assert spec is not None
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)

    db_url = f"sqlite+aiosqlite:///{tmp_path / 'doctor.sqlite'}"
    monkeypatch.setattr(module.settings, "DATABASE_URL", db_url)

    engine = create_async_engine(db_url, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await module.create_doctor(
        "created-doctor@example.com",
        "Dr Created",
        "password123",
        "Psychiatry",
    )

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        user = await session.scalar(
            select(User).where(User.email == "created-doctor@example.com")
        )
    await engine.dispose()

    assert user is not None
    assert user.role == UserRole.doctor


def test_default_seed_runner_excludes_demo_data() -> None:
    module_path = Path("scripts/seed.py")
    spec = importlib.util.spec_from_file_location("seed_script", module_path)
    assert spec is not None
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)

    assert module.REFERENCE_SEEDERS == ["medications_reference", "scales", "side_effects"]
    assert "demo_data" not in module.REFERENCE_SEEDERS


def test_scheduler_single_instance_configured_for_prod() -> None:
    prod_compose = Path("docker-compose.prod.yml").read_text()
    assert "replicas: 1" in prod_compose
    assert 'SCHEDULER_ENABLED: "true"' in prod_compose


def test_setup_prod_generates_and_validates_required_production_values() -> None:
    setup_script = Path("scripts/setup-prod.sh").read_text()
    compose = Path("docker-compose.yml").read_text() + Path("docker-compose.prod.yml").read_text()

    assert "APP_ENV=production" in setup_script
    assert "DOMAIN=${DOMAIN}" in setup_script
    assert "API_BASE_URL=https://${DOMAIN}" in setup_script
    assert "API_BASE_INTERNAL_URL=http://backend:8000" in setup_script
    assert 'INTERNAL_KEY="$(random_hex 32)"' in setup_script
    assert 'POSTGRES_PASSWORD="$(random_hex 24)"' in setup_script
    assert 'SECRET_KEY="$(random_hex 32)"' in setup_script
    assert "rm \"${OVERRIDE_FILE}\"" in setup_script
    assert "docker compose" in setup_script
    assert "localhost:8000|template_app" in setup_script
    assert "localhost:8000" not in compose
