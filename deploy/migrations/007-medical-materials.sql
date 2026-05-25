-- Phase D3 migration: add materials & tooth tracking to medical visits.
-- Idempotent: safe to re-run.
BEGIN;

ALTER TABLE visits ADD COLUMN IF NOT EXISTS materials_used TEXT;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS materials_used_ar TEXT;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS tooth_number TEXT;

COMMIT;
