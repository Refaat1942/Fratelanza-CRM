-- Migration 002: Dental sub-module (Phase B)
-- Safe to re-run. Apply to every existing tenant database.
-- New tenants get these via tenant-schema.sql automatically.

BEGIN;

CREATE TABLE IF NOT EXISTS "dental_procedures" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "name_ar" text,
        "category" text,
        "price" real DEFAULT 0 NOT NULL,
        "active" text DEFAULT 'true' NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "dental_chart_entries" (
        "id" serial PRIMARY KEY NOT NULL,
        "patient_id" integer NOT NULL,
        "tooth_number" integer NOT NULL,
        "condition" text DEFAULT 'healthy' NOT NULL,
        "notes" text,
        "notes_ar" text,
        "updated_by_doctor_id" integer,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "dental_visits" (
        "id" serial PRIMARY KEY NOT NULL,
        "patient_id" integer NOT NULL,
        "doctor_id" integer,
        "visit_date" timestamp with time zone DEFAULT now() NOT NULL,
        "tooth_number" integer,
        "procedure_id" integer,
        "treatment_type" text,
        "treatment_type_ar" text,
        "materials_used" text,
        "materials_used_ar" text,
        "cost" real DEFAULT 0 NOT NULL,
        "notes" text,
        "notes_ar" text,
        "follow_up_date" date,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS dental_chart_patient_idx    ON "dental_chart_entries" ("patient_id");
CREATE UNIQUE INDEX IF NOT EXISTS dental_chart_unique_tooth_idx
       ON "dental_chart_entries" ("patient_id", "tooth_number");
CREATE INDEX IF NOT EXISTS dental_visits_patient_idx   ON "dental_visits" ("patient_id");
CREATE INDEX IF NOT EXISTS dental_visits_doctor_idx    ON "dental_visits" ("doctor_id");
CREATE INDEX IF NOT EXISTS dental_visits_date_idx      ON "dental_visits" ("visit_date");
CREATE INDEX IF NOT EXISTS dental_visits_tooth_idx     ON "dental_visits" ("tooth_number");
CREATE INDEX IF NOT EXISTS dental_procedures_active_idx ON "dental_procedures" ("active");

COMMIT;
