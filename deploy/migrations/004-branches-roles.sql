-- Phase D1: Branches + expanded roles foundation
-- Idempotent. Safe to re-run.
BEGIN;

CREATE TABLE IF NOT EXISTS branches (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  name_ar      TEXT,
  address      TEXT,
  address_ar   TEXT,
  phone        TEXT,
  manager      TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);
CREATE INDEX IF NOT EXISTS idx_branches_active ON branches(is_active);

COMMIT;
