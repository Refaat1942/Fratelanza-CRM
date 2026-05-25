-- Migration 009: Invoices module
-- Adds the `invoices` and `invoice_items` tables to tenants provisioned before
-- the Invoices module was added to tenant-schema.sql.
-- Idempotent (uses IF NOT EXISTS). Safe to re-run.
--
-- Apply with: deploy/migrate-tenants.sh deploy/migrations/009-invoices.sql
--
-- After applying this, if you want `branch_id` on invoices for tenants that
-- already exist, re-run deploy/migrations/005-branch-id-on-records.sql — it
-- skips tables that don't exist, so it's safe.

BEGIN;

CREATE TABLE IF NOT EXISTS "invoices" (
        "id" serial PRIMARY KEY NOT NULL,
        "invoice_number" text NOT NULL,
        "client_id" integer,
        "client_name_snapshot" text,
        "client_phone_snapshot" text,
        "status" text DEFAULT 'draft' NOT NULL,
        "issue_date" date DEFAULT now() NOT NULL,
        "due_date" date,
        "subtotal" real DEFAULT 0 NOT NULL,
        "tax_rate" real DEFAULT 0 NOT NULL,
        "tax_amount" real DEFAULT 0 NOT NULL,
        "total" real DEFAULT 0 NOT NULL,
        "paid_amount" real DEFAULT 0 NOT NULL,
        "notes" text,
        "notes_ar" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);

CREATE TABLE IF NOT EXISTS "invoice_items" (
        "id" serial PRIMARY KEY NOT NULL,
        "invoice_id" integer NOT NULL,
        "description" text NOT NULL,
        "description_ar" text,
        "quantity" real DEFAULT 1 NOT NULL,
        "unit_price" real DEFAULT 0 NOT NULL,
        "total" real DEFAULT 0 NOT NULL,
        "sort_order" integer DEFAULT 0 NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invoice_items_invoice_id_fk'
  ) THEN
    ALTER TABLE "invoice_items"
      ADD CONSTRAINT "invoice_items_invoice_id_fk"
      FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "invoices_client_id_idx" ON "invoices" ("client_id");
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices" ("status");
CREATE INDEX IF NOT EXISTS "invoices_issue_date_idx" ON "invoices" ("issue_date");
CREATE INDEX IF NOT EXISTS "invoice_items_invoice_id_idx" ON "invoice_items" ("invoice_id");

COMMIT;
