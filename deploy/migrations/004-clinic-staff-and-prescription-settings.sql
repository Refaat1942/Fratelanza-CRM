-- Phase F3: Clinic Staff table + prescription header fields on tenant_settings.
-- Idempotent — safe to run multiple times. Apply via deploy/migrate-tenants.sh.

BEGIN;

CREATE TABLE IF NOT EXISTS clinic_staff (
  id              SERIAL PRIMARY KEY,
  name            TEXT,
  name_ar         TEXT,
  role            TEXT NOT NULL DEFAULT 'doctor',
  specialty       TEXT,
  specialty_ar    TEXT,
  license_number  TEXT,
  phone           TEXT,
  email           TEXT,
  notes           TEXT,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_staff_active ON clinic_staff(active);
CREATE INDEX IF NOT EXISTS idx_clinic_staff_role   ON clinic_staff(role);

-- Prescription / clinic header on tenant_settings (used by printed prescriptions).
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS clinic_phone            TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS clinic_address          TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS clinic_address_ar       TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS doctor_title            TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS doctor_title_ar         TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS doctor_license          TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS prescription_footer     TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS prescription_footer_ar  TEXT;

COMMIT;
