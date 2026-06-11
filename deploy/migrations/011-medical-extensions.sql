-- Patient QR tokens for scan-to-view history
ALTER TABLE patients ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_patients_qr_token ON patients(qr_token);

-- Medicine master (SAP-style: Material, Material description, BUn)
CREATE TABLE IF NOT EXISTS medicine_master (
  id SERIAL PRIMARY KEY,
  material TEXT NOT NULL UNIQUE,
  material_description TEXT NOT NULL,
  bun TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_medicine_master_material ON medicine_master(material);
CREATE INDEX IF NOT EXISTS idx_medicine_master_desc ON medicine_master(lower(material_description));

-- Link prescriptions to medicine master
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS medicine_id INTEGER REFERENCES medicine_master(id);

-- Diagnoses & medical features master (seeded per specialization)
CREATE TABLE IF NOT EXISTS diagnoses_master (
  id SERIAL PRIMARY KEY,
  code TEXT,
  name TEXT NOT NULL,
  name_ar TEXT,
  specialization TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_diagnoses_master_spec ON diagnoses_master(specialization);

CREATE TABLE IF NOT EXISTS medical_features_master (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  specialization TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_medical_features_master_spec ON medical_features_master(specialization);

-- Per-doctor prescription template (layout / shape upload)
CREATE TABLE IF NOT EXISTS doctor_prescription_templates (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL UNIQUE,
  template_url TEXT,
  doctor_title TEXT,
  doctor_title_ar TEXT,
  doctor_license TEXT,
  footer_text TEXT,
  footer_text_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
