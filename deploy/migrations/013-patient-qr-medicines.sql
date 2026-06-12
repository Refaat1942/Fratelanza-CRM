-- Patient QR tokens for staff scan at /medical/patient-scan
ALTER TABLE patients ADD COLUMN IF NOT EXISTS qr_token text;
CREATE UNIQUE INDEX IF NOT EXISTS patients_qr_token_uidx ON patients (qr_token) WHERE qr_token IS NOT NULL;
UPDATE patients SET qr_token = replace(gen_random_uuid()::text, '-', '') WHERE qr_token IS NULL;
