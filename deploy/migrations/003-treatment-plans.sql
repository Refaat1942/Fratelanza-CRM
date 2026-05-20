-- Phase C — Treatment Plans
-- Idempotent: safe to re-run. Apply with deploy/migrate-tenants.sh

BEGIN;

CREATE TABLE IF NOT EXISTS treatment_plans (
  id                       SERIAL PRIMARY KEY,
  patient_id               INTEGER NOT NULL,
  doctor_id                INTEGER,
  title                    TEXT,
  title_ar                 TEXT,
  status                   TEXT NOT NULL DEFAULT 'draft',
  notes                    TEXT,
  notes_ar                 TEXT,
  estimated_total          REAL NOT NULL DEFAULT 0,
  start_date               DATE,
  target_completion_date   DATE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS treatment_plan_items (
  id                       SERIAL PRIMARY KEY,
  plan_id                  INTEGER NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
  procedure_id             INTEGER,
  description              TEXT,
  description_ar           TEXT,
  tooth_number             INTEGER,
  quantity                 REAL NOT NULL DEFAULT 1,
  unit_price               REAL NOT NULL DEFAULT 0,
  total                    REAL NOT NULL DEFAULT 0,
  status                   TEXT NOT NULL DEFAULT 'planned',
  scheduled_date           DATE,
  completed_at             TIMESTAMPTZ,
  completed_visit_id       INTEGER,
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient   ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_doctor    ON treatment_plans(doctor_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status    ON treatment_plans(status);
CREATE INDEX IF NOT EXISTS idx_treatment_plan_items_plan ON treatment_plan_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plan_items_proc ON treatment_plan_items(procedure_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plan_items_sched ON treatment_plan_items(scheduled_date);

COMMIT;
