-- Phase F2 migration: medical materials inventory.
-- Idempotent — safe to re-run.
BEGIN;

CREATE TABLE IF NOT EXISTS medical_materials (
  id                  SERIAL PRIMARY KEY,
  name                TEXT NOT NULL,
  name_ar             TEXT,
  sku                 TEXT,
  category            TEXT,
  unit                TEXT,
  quantity_in_stock   REAL NOT NULL DEFAULT 0,
  reorder_level       REAL NOT NULL DEFAULT 0,
  unit_price          REAL NOT NULL DEFAULT 0,
  supplier            TEXT,
  notes               TEXT,
  notes_ar            TEXT,
  branch_id           INTEGER,
  active              INTEGER NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_materials_name      ON medical_materials(name);
CREATE INDEX IF NOT EXISTS idx_medical_materials_sku       ON medical_materials(sku);
CREATE INDEX IF NOT EXISTS idx_medical_materials_branch    ON medical_materials(branch_id);
CREATE INDEX IF NOT EXISTS idx_medical_materials_low_stock ON medical_materials(quantity_in_stock, reorder_level);

COMMIT;
