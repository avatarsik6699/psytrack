#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-psycker.ru}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"
NGINX_FILE="${PROJECT_ROOT}/nginx/nginx.conf"
OVERRIDE_FILE="${PROJECT_ROOT}/docker-compose.override.yml"

random_hex() {
  openssl rand -hex "$1"
}

if ! command -v openssl >/dev/null 2>&1; then
  echo "error: openssl is required" >&2
  exit 1
fi

POSTGRES_PASSWORD="$(random_hex 24)"
SECRET_KEY="$(random_hex 32)"
INTERNAL_KEY="$(random_hex 32)"

cat > "${ENV_FILE}" <<EOF
DATABASE_URL=postgresql+asyncpg://app_user:${POSTGRES_PASSWORD}@db:5432/patient_tracker
POSTGRES_USER=app_user
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=patient_tracker

REDIS_URL=redis://redis:6379/0

SECRET_KEY=${SECRET_KEY}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

CORS_ORIGINS=["https://${DOMAIN}","https://www.${DOMAIN}"]
APP_ENV=production
LOG_LEVEL=INFO
SCHEDULER_ENABLED=true
INTERNAL_KEY=${INTERNAL_KEY}

DOMAIN=${DOMAIN}
API_BASE_URL=https://${DOMAIN}
API_BASE_INTERNAL_URL=http://backend:8000
VITE_API_BASE_URL=https://${DOMAIN}
EOF

sed -i "s/\\[DOMAIN\\]/${DOMAIN}/g" "${NGINX_FILE}"

if [ -f "${OVERRIDE_FILE}" ]; then
  rm "${OVERRIDE_FILE}"
fi

if docker compose version >/dev/null 2>&1; then
  docker compose -f "${PROJECT_ROOT}/docker-compose.yml" -f "${PROJECT_ROOT}/docker-compose.prod.yml" config >/tmp/patient-tracker-compose.yml
  if grep -Eq '\\[DOMAIN\\]|changeme|localhost:8000|template_app' /tmp/patient-tracker-compose.yml "${ENV_FILE}" "${NGINX_FILE}"; then
    echo "error: rendered production config still contains template values" >&2
    exit 1
  fi
else
  echo "warning: docker compose not available; skipped rendered compose validation" >&2
fi

echo "Production files generated for ${DOMAIN}"
