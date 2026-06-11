-- Phase I: medical master data, QR history support, doctor prescription shapes, specialization catalog

CREATE TABLE IF NOT EXISTS medicine_master (
  id                    SERIAL PRIMARY KEY,
  material              TEXT NOT NULL,
  material_description  TEXT NOT NULL,
  bun                   TEXT,
  active                INTEGER NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_medicine_master_material_unique ON medicine_master (material);
CREATE INDEX IF NOT EXISTS idx_medicine_master_description ON medicine_master (material_description);

ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS medicine_master_id INTEGER;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS medicine_material TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS medicine_unit TEXT;
CREATE INDEX IF NOT EXISTS idx_prescriptions_medicine_master ON prescriptions (medicine_master_id);

CREATE TABLE IF NOT EXISTS doctor_prescription_templates (
  id          SERIAL PRIMARY KEY,
  doctor_id   INTEGER NOT NULL,
  name        TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  file_name   TEXT,
  mime_type   TEXT,
  active      INTEGER NOT NULL DEFAULT 1,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_doctor_prescription_templates_doctor ON doctor_prescription_templates (doctor_id);

CREATE TABLE IF NOT EXISTS medical_specialization_catalog (
  id              SERIAL PRIMARY KEY,
  specialization  TEXT NOT NULL,
  type            TEXT NOT NULL,
  name            TEXT NOT NULL,
  name_ar         TEXT,
  active          INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_medical_specialization_catalog_unique
  ON medical_specialization_catalog (specialization, type, name);
CREATE INDEX IF NOT EXISTS idx_medical_specialization_catalog_type
  ON medical_specialization_catalog (type, active);
