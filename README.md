# Docassist Patient Tracker

Web application for psychiatric and psychotherapy inter-visit monitoring.

Docassist helps doctors track patient progress between appointments: medication adherence,
test results, side effects, therapy goals, tasks, and patient status summaries.

## Stack

- Backend: FastAPI, SQLAlchemy async, Alembic, Pydantic
- Frontend: React Router, TypeScript, pnpm
- Database: PostgreSQL
- Infra: Docker Compose, Nginx

## Prerequisites

- Docker + Docker Compose
- uv
- Node.js + pnpm

## Run

```bash
cp .env.example .env
docker compose up --build
```

All services are expected to run through Docker Compose.

## Checks

```bash
uv sync --dev
uv run pytest

cd frontend
pnpm install
pnpm typecheck
pnpm test
pnpm build
```
