-- Phase D2: Add branch_id to all transactional records.
-- Idempotent. Safe to re-run. Tolerant of missing tables (skips silently if a
-- table doesn't exist — useful when a tenant hasn't yet applied an earlier
-- migration such as Phase B dental or Phase C treatment plans).

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'tasks','patients','medical_appointments','visits','medical_invoices',
    'transactions','treatment_plans','employees','products','rentals','dental_visits'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS branch_id INTEGER', t);
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(branch_id)', 'idx_' || t || '_branch', t);
    END IF;
  END LOOP;
END $$;
