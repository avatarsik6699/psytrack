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

## Production Deploy

Canonical VPS setup for `psycker.ru`:

```bash
git clone <repo-url> /opt/patient_tracker
cd /opt/patient_tracker
./scripts/setup-prod.sh psycker.ru
docker run --rm -p 80:80 \
  -v /etc/letsencrypt:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d psycker.ru -d www.psycker.ru \
  --email admin@psycker.ru --agree-tos --no-eff-email
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose exec backend uv run python scripts/create-doctor.py \
  --email doctor@psycker.ru --full-name "Primary Doctor"
```

Renew certificates from cron:

```bash
0 */12 * * * cd /opt/patient_tracker && ./scripts/renew-certs.sh
```

Production smoke:

```bash
curl -I https://psycker.ru
curl -I https://www.psycker.ru
curl -s https://psycker.ru/api/v1/health
curl -I https://psycker.ru/docs
curl -I https://psycker.ru/openapi.json
```

Expected: canonical HTTPS works, `www.psycker.ru` redirects to `psycker.ru`, health is OK, and docs/OpenAPI are blocked.

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
