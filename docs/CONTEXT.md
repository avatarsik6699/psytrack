{
  "_meta": {
    "format": "SDD CONTEXT.md — Single Source of Truth for AI agent",
    "update_rule": "Append contracts after each phase via /context-update. Never remove existing entries."
  },

  "captured_at": "2026-05-23",
  "phase_completed": "08",
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
    },
    {
      "phase": "02",
      "name": "Diagnosis",
      "module": "app/modules/diagnoses/models.py",
      "fields": ["id:UUID", "patient_id:UUID FK patients", "icd_code:TEXT", "name:TEXT", "is_primary:BOOL DEFAULT false", "date_diagnosed:DATE", "notes:TEXT", "created_at:TIMESTAMPTZ"]
    },
    {
      "phase": "02",
      "name": "MedicationReference",
      "module": "app/modules/medications/models.py",
      "fields": ["id:UUID", "inn:TEXT", "brand_names:JSONB"]
    },
    {
      "phase": "02",
      "name": "PatientMedication",
      "module": "app/modules/medications/models.py",
      "fields": ["id:UUID", "patient_id:UUID FK patients", "medication_id:UUID FK medications_reference", "dose_mg:NUMERIC", "unit:TEXT", "frequency:TEXT", "started_at:DATE", "ended_at:DATE", "dose_precision:TEXT('exact'|'approx'|'range')", "created_by_role:TEXT('doctor'|'patient')", "created_at:TIMESTAMPTZ"]
    },
    {
      "phase": "03",
      "name": "Scale",
      "module": "app/modules/scales/models.py",
      "fields": ["id:UUID", "code:TEXT UNIQUE", "name:TEXT", "score_min:INT", "score_max:INT", "improvement_direction:TEXT('lower'|'higher')", "domains_json:JSONB", "questions_json:JSONB"]
    },
    {
      "phase": "03",
      "name": "ClinicalRule",
      "module": "app/modules/scales/models.py",
      "fields": ["id:UUID", "diagnosis_icd:TEXT", "scale_id:UUID FK scales", "control_point_days:INT", "response_threshold_pct:INT", "response_threshold_abs:INT"]
    },
    {
      "phase": "03",
      "name": "PatientScale",
      "module": "app/modules/scales/models.py",
      "fields": ["id:UUID", "patient_id:UUID FK patients", "diagnosis_id:UUID FK diagnoses", "scale_id:UUID FK scales", "frequency_days:INT", "assigned_by:UUID FK doctor_profiles", "created_at:TIMESTAMPTZ"]
    },
    {
      "phase": "03",
      "name": "TestCompletion",
      "module": "app/modules/scales/models.py",
      "fields": ["id:UUID", "patient_id:UUID FK patients", "patient_scale_id:UUID FK patient_scales", "scale_id:UUID FK scales", "score:INT", "answers_json:JSONB", "baseline:BOOL DEFAULT false", "completed_at:TIMESTAMPTZ"]
    },
    {
      "phase": "03",
      "name": "EventLog",
      "module": "app/modules/events/models.py",
      "fields": ["id:UUID", "patient_id:UUID FK patients", "event_type:TEXT", "payload:JSONB", "occurred_at:TIMESTAMPTZ", "created_at:TIMESTAMPTZ", "created_by:UUID FK users"]
    },
    {
      "phase": "05",
      "name": "SeDictionary",
      "module": "app/modules/side_effects/models.py",
      "fields": ["id:UUID", "uku_code:TEXT UNIQUE", "name_ru:TEXT", "name_en:TEXT", "body_system:TEXT", "severity_min:INT DEFAULT 0", "severity_max:INT DEFAULT 4"]
    },
    {
      "phase": "05",
      "name": "PatientSideEffect",
      "module": "app/modules/side_effects/models.py",
      "fields": ["id:UUID", "patient_id:UUID FK patients", "se_id:UUID FK se_dictionary", "severity:INT CHECK(0..4)", "started_at:TIMESTAMPTZ", "ended_at:TIMESTAMPTZ", "date_precision:TEXT('exact'|'lt_24h'|'month'|'year'|'range')", "duration_label:TEXT", "resolved:BOOL DEFAULT false", "notes:TEXT", "created_at:TIMESTAMPTZ"]
    },
    {
      "phase": "05",
      "name": "SeMonitoringRule",
      "module": "app/modules/side_effects/models.py",
      "fields": ["id:UUID", "patient_id:UUID FK patients", "se_id:UUID FK se_dictionary", "frequency_days:INT", "assigned_by:UUID FK doctor_profiles", "created_at:TIMESTAMPTZ"]
    },
    {
      "phase": "06",
      "name": "Task",
      "module": "app/modules/tasks/models.py",
      "fields": ["id:UUID", "patient_id:UUID FK patients CASCADE", "task_type:TEXT('test'|'medication_log'|'se_report')", "reference_id:UUID nullable", "due_at:TIMESTAMPTZ", "status:TEXT('pending'|'done'|'missed'|'snoozed') DEFAULT 'pending'", "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ nullable"]
    },
    {
      "phase": "07",
      "name": "TherapyGoal",
      "module": "app/modules/therapy_goals/models.py",
      "fields": ["id:UUID", "patient_id:UUID FK patients CASCADE", "description:TEXT", "is_completed:BOOL DEFAULT false", "created_at:TIMESTAMPTZ"]
    }
  ],

  "endpoints_active": [
    { "phase": "01", "method": "POST",  "path": "/api/v1/public/auth/register",       "auth": "none",    "response": "TokenPair" },
    { "phase": "01", "method": "POST",  "path": "/api/v1/public/auth/login",           "auth": "none",    "response": "TokenPair" },
    { "phase": "01", "method": "POST",  "path": "/api/v1/public/auth/refresh",         "auth": "refresh", "response": "TokenPair" },
    { "phase": "01", "method": "POST",  "path": "/api/v1/public/auth/patient-login",   "auth": "none",    "response": "TokenPair" },
    { "phase": "01", "method": "PATCH", "path": "/api/v1/public/auth/me/password",     "auth": "bearer",  "response": "{ok:true}" },
    { "phase": "01", "method": "GET",   "path": "/api/v1/health",                      "auth": "none",    "response": "{status,db}" },
    { "phase": "02", "method": "GET",   "path": "/api/v1/doctor/patients",                              "auth": "doctor",  "response": "PatientOut[]" },
    { "phase": "02", "method": "POST",  "path": "/api/v1/doctor/patients",                              "auth": "doctor",  "response": "PatientCreatedOut" },
    { "phase": "02", "method": "GET",   "path": "/api/v1/doctor/patients/{id}",                         "auth": "doctor",  "response": "PatientOut" },
    { "phase": "02", "method": "PATCH", "path": "/api/v1/doctor/patients/{id}",                         "auth": "doctor",  "response": "PatientOut" },
    { "phase": "02", "method": "POST",  "path": "/api/v1/doctor/patients/{id}/archive",                 "auth": "doctor",  "response": "{ok:true}" },
    { "phase": "02", "method": "POST",  "path": "/api/v1/doctor/patients/{id}/diagnoses",               "auth": "doctor",  "response": "DiagnosisOut" },
    { "phase": "02", "method": "PATCH", "path": "/api/v1/doctor/patients/{id}/diagnoses/{did}",         "auth": "doctor",  "response": "DiagnosisOut" },
    { "phase": "02", "method": "POST",  "path": "/api/v1/doctor/patients/{id}/medications",             "auth": "doctor",  "response": "PatientMedicationOut" },
    { "phase": "02", "method": "PATCH", "path": "/api/v1/doctor/patients/{id}/medications/{mid}",       "auth": "doctor",  "response": "PatientMedicationOut" },
    { "phase": "02", "method": "GET",   "path": "/api/v1/ref/medications",                              "auth": "bearer",  "response": "MedicationReferenceOut[] (paginated; ?q=)" },
    { "phase": "03", "method": "GET",    "path": "/api/v1/ref/scales",                                    "auth": "bearer",  "response": "ScaleOut[]" },
    { "phase": "03", "method": "GET",    "path": "/api/v1/ref/scales/{id}/questions",                     "auth": "bearer",  "response": "ScaleQuestion[]" },
    { "phase": "03", "method": "GET",    "path": "/api/v1/doctor/patients/{id}/scales",                   "auth": "doctor",  "response": "PatientScaleOut[] (with embedded scale)" },
    { "phase": "03", "method": "POST",   "path": "/api/v1/doctor/patients/{id}/scales",                   "auth": "doctor",  "response": "PatientScaleOut" },
    { "phase": "03", "method": "DELETE", "path": "/api/v1/doctor/patients/{id}/scales/{sid}",             "auth": "doctor",  "response": "{ok:true} · 409 if completions exist" },
    { "phase": "03", "method": "POST",   "path": "/api/v1/patient/tests/{patient_scale_id}/submit",       "auth": "patient", "response": "TestCompletionOut" },
    { "phase": "03", "method": "GET",    "path": "/api/v1/patient/history",                               "auth": "patient", "response": "{items:TestCompletionOut[], total:int}" },
    { "phase": "03", "method": "GET",    "path": "/api/v1/patient/scales",                                "auth": "patient", "response": "PatientScaleOut[] (with embedded scale)" },
    { "phase": "03", "method": "GET",    "path": "/api/v1/patient/scales/{patient_scale_id}",             "auth": "patient", "response": "PatientScaleOut (with embedded scale)" },
    { "phase": "04", "method": "GET",    "path": "/api/v1/patient/medications",                             "auth": "patient", "response": "PatientMedicationOut[]" },
    { "phase": "04", "method": "PATCH",  "path": "/api/v1/patient/medications/{id}/log",                   "auth": "patient", "response": "EventLogOut" },
    { "phase": "04", "method": "POST",   "path": "/api/v1/patient/medications",                             "auth": "patient", "response": "PatientMedicationOut" },
    { "phase": "04", "method": "PATCH",  "path": "/api/v1/patient/medications/{id}",                       "auth": "patient", "response": "PatientMedicationOut" },
    { "phase": "04", "method": "DELETE", "path": "/api/v1/patient/medications/{id}",                       "auth": "patient", "response": "{ok:true}" },
    { "phase": "04", "method": "GET",    "path": "/api/v1/doctor/patients/{id}/charts/medications",        "auth": "doctor",  "response": "MedicationChartSeries[]" },
    { "phase": "05", "method": "GET",    "path": "/api/v1/ref/se-dictionary",                               "auth": "bearer",  "response": "{ items: SeDictionaryOut[], total: int } (?q=, ?body_system=, ?page=, ?size=)" },
    { "phase": "05", "method": "GET",    "path": "/api/v1/patient/side-effects",                            "auth": "patient", "response": "PatientSideEffectOut[]" },
    { "phase": "05", "method": "POST",   "path": "/api/v1/patient/side-effects",                            "auth": "patient", "response": "PatientSideEffectOut" },
    { "phase": "05", "method": "PATCH",  "path": "/api/v1/patient/side-effects/{id}",                       "auth": "patient", "response": "PatientSideEffectOut (emits se_correction | se_severity_updated | se_resolved)" },
    { "phase": "05", "method": "DELETE", "path": "/api/v1/patient/side-effects/{id}",                       "auth": "patient", "response": "{ ok: true } (soft-delete; original se_reported_start event preserved)" },
    { "phase": "05", "method": "POST",   "path": "/api/v1/doctor/patients/{id}/se-rules",                   "auth": "doctor",  "response": "SeMonitoringRuleOut" },
    { "phase": "05", "method": "DELETE", "path": "/api/v1/doctor/patients/{id}/se-rules/{rid}",             "auth": "doctor",  "response": "{ ok: true }" },
    { "phase": "05", "method": "GET",    "path": "/api/v1/doctor/patients/{id}/charts/side-effects",        "auth": "doctor",  "response": "SeSeverityDataPoint[]" },
    { "phase": "06", "method": "GET",   "path": "/api/v1/doctor/patients/{id}/events",                      "auth": "doctor",  "response": "EventTimelinePage { items: EventLogOut[], total: int, page: int, size: int } (?page=1&size=20)" },
    { "phase": "06", "method": "POST",  "path": "/api/v1/system/tasks/generate",                            "auth": "internal (X-Internal-Key header)", "response": "{ generated: int }" },
    { "phase": "07", "method": "GET",   "path": "/api/v1/doctor/patients/{id}/charts/scores",               "auth": "doctor",  "response": "ScoreChartSeries[]" },
    { "phase": "07", "method": "GET",   "path": "/api/v1/doctor/patients/{id}/goals",                       "auth": "doctor",  "response": "TherapyGoalOut[]" },
    { "phase": "07", "method": "POST",  "path": "/api/v1/doctor/patients/{id}/goals",                       "auth": "doctor",  "response": "TherapyGoalOut" },
    { "phase": "07", "method": "PATCH", "path": "/api/v1/doctor/patients/{id}/goals/{gid}",                 "auth": "doctor",  "response": "TherapyGoalOut" },
    { "phase": "08", "method": "GET",   "path": "/api/v1/patient/tasks",                                    "auth": "patient", "response": "TaskOut[]" },
    { "phase": "08", "method": "GET",   "path": "/api/v1/patient/me",                                       "auth": "patient", "response": "PatientMeOut" },
    { "phase": "08", "method": "PATCH", "path": "/api/v1/public/auth/me/email",                             "auth": "bearer",  "response": "{ ok: true }" }
  ],

  "db_schema": {
    "tables": ["users", "doctor_profiles", "patients", "diagnoses", "medications_reference", "patient_medications", "scales", "clinical_rules", "patient_scales", "test_completions", "event_log", "se_dictionary", "patient_side_effects", "se_monitoring_rules", "tasks", "therapy_goals"],
    "source": "alembic/versions/",
    "current_head": "0009_therapy_goals"
  },

  "ui_pages_active": [
    { "phase": "01", "route": "/login",     "component": "frontend/app/routes/login.tsx",       "auth": "public" },
    { "phase": "01", "route": "/doctor/*",  "component": "frontend/app/routes.ts (doctor layout)", "auth": "doctor" },
    { "phase": "01", "route": "/",          "component": "frontend/app/routes.ts (patient layout)", "auth": "patient" },
    { "phase": "08", "route": "/dashboard", "component": "frontend/app/pages/dashboard/ui/dashboard-page.tsx", "auth": "patient" },
    { "phase": "08", "route": "/tests",     "component": "frontend/app/routes/tests/index.tsx",    "auth": "patient" },
    { "phase": "08", "route": "/drugs",     "component": "frontend/app/routes/drugs/index.tsx",    "auth": "patient" },
    { "phase": "08", "route": "/side-effects", "component": "frontend/app/routes/side-effects/index.tsx", "auth": "patient" },
    { "phase": "08", "route": "/profile",   "component": "frontend/app/routes/profile/index.tsx",  "auth": "patient" },
    { "phase": "08", "route": "/assessment/:patientScaleId", "component": "frontend/app/routes/assessment/index.tsx", "auth": "patient" }
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

  "notes": "Phase 08 complete. Added patient portal polish and full frontend refactoring, including patient task/profile/email endpoints, patient dashboard/tests/drugs/side-effects/profile routes, assessment success polish, shared frontend conventions/utilities, semantic UI components/tokens, responsive sidebar, and expanded frontend test coverage."
}
