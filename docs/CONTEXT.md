{
  "_meta": {
    "format": "SDD CONTEXT.md — Single Source of Truth for AI agent",
    "update_rule": "Append contracts after each phase via /context-update. Never remove existing entries."
  },

  "captured_at": "2026-05-16",
  "phase_completed": "01",
  "phase_in_progress": null,

  "stack": {
    "summary": "See docs/STACK.md for the full set of technologies and version pins."
  },

  "core_models": [
    {
      "phase": "01",
      "name": "User",
      "module": "app/modules/users/models.py",
      "fields": ["id:UUID", "email:TEXT UNIQUE", "password_hash:TEXT", "role:TEXT('doctor'|'patient')", "email_verified:BOOL", "created_at:TIMESTAMPTZ"]
    },
    {
      "phase": "01",
      "name": "DoctorProfile",
      "module": "app/modules/doctors/models.py",
      "fields": ["id:UUID", "user_id:UUID FK users UNIQUE", "full_name:TEXT", "specialty:TEXT", "created_at:TIMESTAMPTZ"]
    },
    {
      "phase": "01",
      "name": "Patient",
      "module": "app/modules/patients/models.py",
      "fields": ["id:UUID", "doctor_id:UUID FK doctor_profiles", "full_name:TEXT", "birth_date:DATE", "gender:TEXT", "temp_login:TEXT UNIQUE", "temp_password_hash:TEXT", "email:TEXT", "email_verified:BOOL", "onboarding_complete:BOOL", "archived_at:TIMESTAMPTZ", "created_at:TIMESTAMPTZ"]
    }
  ],

  "endpoints_active": [
    { "phase": "01", "method": "POST",  "path": "/api/v1/public/auth/register",       "auth": "none",    "response": "TokenPair" },
    { "phase": "01", "method": "POST",  "path": "/api/v1/public/auth/login",           "auth": "none",    "response": "TokenPair" },
    { "phase": "01", "method": "POST",  "path": "/api/v1/public/auth/refresh",         "auth": "refresh", "response": "TokenPair" },
    { "phase": "01", "method": "POST",  "path": "/api/v1/public/auth/patient-login",   "auth": "none",    "response": "TokenPair" },
    { "phase": "01", "method": "PATCH", "path": "/api/v1/public/auth/me/password",     "auth": "bearer",  "response": "{ok:true}" },
    { "phase": "01", "method": "GET",   "path": "/api/v1/health",                      "auth": "none",    "response": "{status,db}" }
  ],

  "db_schema": {
    "tables": ["users", "doctor_profiles", "patients"],
    "source": "alembic/versions/",
    "current_head": "0002_doctor_profile_patient"
  },

  "ui_pages_active": [
    { "phase": "01", "route": "/login",     "component": "frontend/app/routes/login.tsx",       "auth": "public" },
    { "phase": "01", "route": "/doctor/*",  "component": "frontend/app/routes.ts (doctor layout)", "auth": "doctor" },
    { "phase": "01", "route": "/",          "component": "frontend/app/routes.ts (patient layout)", "auth": "patient" }
  ],

  "env_config": {
    "keys": [
      { "phase": "01", "key": "DATABASE_URL",                "required": true,  "example": "postgresql+asyncpg://app_user:changeme@db:5432/patient_tracker" },
      { "phase": "01", "key": "SECRET_KEY",                  "required": true,  "example": "change-me-generate-a-secure-random-hex-string" },
      { "phase": "01", "key": "ALGORITHM",                   "required": true,  "example": "HS256" },
      { "phase": "01", "key": "ACCESS_TOKEN_EXPIRE_MINUTES", "required": true,  "example": "15" },
      { "phase": "01", "key": "REFRESH_TOKEN_EXPIRE_DAYS",   "required": true,  "example": "7" },
      { "phase": "01", "key": "CORS_ORIGINS",                "required": true,  "example": "[\"http://localhost:3000\"]" },
      { "phase": "01", "key": "REDIS_URL",                   "required": true,  "example": "redis://redis:6379/0" }
    ]
  },

  "db_seeds": {},

  "notes": "Phase 01 complete. Added users, doctor_profiles, and patients tables; JWT auth endpoints; React Router v7 shell with role-aware sidebar, design tokens, and login page."
}
