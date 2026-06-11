-- Patient QR history, medicine master data, doctor prescription templates,
-- and customer medical specialization metadata.

BEGIN;

CREATE TABLE IF NOT EXISTS medicine_master (
  id                   SERIAL PRIMARY KEY,
  material             TEXT NOT NULL,
  material_description TEXT NOT NULL,
  bun                  TEXT NOT NULL,
  active               INTEGER NOT NULL DEFAULT 1,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS medicine_master_material_idx ON medicine_master(material);
CREATE INDEX IF NOT EXISTS idx_medicine_master_active ON medicine_master(active);
CREATE INDEX IF NOT EXISTS idx_medicine_master_description ON medicine_master(material_description);

ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS medicine_master_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_prescriptions_medicine_master ON prescriptions(medicine_master_id);

ALTER TABLE clinic_staff ADD COLUMN IF NOT EXISTS prescription_template_url TEXT;
ALTER TABLE clinic_staff ADD COLUMN IF NOT EXISTS prescription_header TEXT;
ALTER TABLE clinic_staff ADD COLUMN IF NOT EXISTS prescription_header_ar TEXT;
ALTER TABLE clinic_staff ADD COLUMN IF NOT EXISTS prescription_footer TEXT;
ALTER TABLE clinic_staff ADD COLUMN IF NOT EXISTS prescription_footer_ar TEXT;

ALTER TABLE clients ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS related_diagnosis TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS medical_features TEXT;
CREATE INDEX IF NOT EXISTS idx_clients_specialization ON clients(specialization);

COMMIT;
