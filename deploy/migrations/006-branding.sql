-- Phase E1: per-tenant branding (company name + logo + primary color).
-- Idempotent. Safe to re-run.
BEGIN;

CREATE TABLE IF NOT EXISTS tenant_settings (
  id              INTEGER PRIMARY KEY DEFAULT 1,
  company_name    TEXT,
  company_name_ar TEXT,
  logo_url        TEXT,
  primary_color   TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tenant_settings_singleton CHECK (id = 1)
);

INSERT INTO tenant_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

COMMIT;
