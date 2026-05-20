-- Migration 001: Medical module (Phase A)
-- Safe to re-run. Apply to every existing tenant database.
-- New tenants get these via tenant-schema.sql automatically.

BEGIN;

CREATE TABLE IF NOT EXISTS "patients" (
        "id" serial PRIMARY KEY NOT NULL,
        "first_name" text NOT NULL,
        "first_name_ar" text,
        "last_name" text,
        "last_name_ar" text,
        "gender" text,
        "date_of_birth" date,
        "national_id" text,
        "phone" text,
        "email" text,
        "address" text,
        "address_ar" text,
        "blood_type" text,
        "allergies" text,
        "chronic_conditions" text,
        "emergency_contact_name" text,
        "emergency_contact_phone" text,
        "notes" text,
        "notes_ar" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "medical_appointments" (
        "id" serial PRIMARY KEY NOT NULL,
        "patient_id" integer NOT NULL,
        "doctor_id" integer,
        "start_at" timestamp with time zone NOT NULL,
        "end_at" timestamp with time zone,
        "status" text DEFAULT 'scheduled' NOT NULL,
        "reason" text,
        "reason_ar" text,
        "notes" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "visits" (
        "id" serial PRIMARY KEY NOT NULL,
        "patient_id" integer NOT NULL,
        "appointment_id" integer,
        "doctor_id" integer,
        "visit_date" timestamp with time zone DEFAULT now() NOT NULL,
        "chief_complaint" text,
        "chief_complaint_ar" text,
        "diagnosis" text,
        "diagnosis_ar" text,
        "treatment" text,
        "treatment_ar" text,
        "follow_up_date" date,
        "notes" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "medical_procedures" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "name_ar" text,
        "category" text,
        "price" real DEFAULT 0 NOT NULL,
        "active" text DEFAULT 'true' NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "medical_invoices" (
        "id" serial PRIMARY KEY NOT NULL,
        "patient_id" integer NOT NULL,
        "visit_id" integer,
        "doctor_id" integer,
        "invoice_date" date NOT NULL,
        "total" real DEFAULT 0 NOT NULL,
        "paid_amount" real DEFAULT 0 NOT NULL,
        "status" text DEFAULT 'unpaid' NOT NULL,
        "payment_method" text,
        "transaction_id" integer,
        "notes" text,
        "notes_ar" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "medical_invoice_lines" (
        "id" serial PRIMARY KEY NOT NULL,
        "invoice_id" integer NOT NULL,
        "procedure_id" integer,
        "description" text NOT NULL,
        "description_ar" text,
        "quantity" integer DEFAULT 1 NOT NULL,
        "unit_price" real DEFAULT 0 NOT NULL,
        "total" real DEFAULT 0 NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "prescriptions" (
        "id" serial PRIMARY KEY NOT NULL,
        "visit_id" integer NOT NULL,
        "medicine_name" text NOT NULL,
        "medicine_name_ar" text,
        "dosage" text,
        "frequency" text,
        "duration_days" integer,
        "instructions" text,
        "instructions_ar" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Reporting indices (T005)
CREATE INDEX IF NOT EXISTS visits_visit_date_idx              ON "visits" ("visit_date");
CREATE INDEX IF NOT EXISTS visits_patient_id_idx              ON "visits" ("patient_id");
CREATE INDEX IF NOT EXISTS visits_follow_up_date_idx          ON "visits" ("follow_up_date");
CREATE INDEX IF NOT EXISTS medical_appointments_start_at_idx  ON "medical_appointments" ("start_at");
CREATE INDEX IF NOT EXISTS medical_appointments_doctor_id_idx ON "medical_appointments" ("doctor_id");
CREATE INDEX IF NOT EXISTS medical_invoices_invoice_date_idx  ON "medical_invoices" ("invoice_date");
CREATE INDEX IF NOT EXISTS medical_invoices_doctor_id_idx     ON "medical_invoices" ("doctor_id");
CREATE INDEX IF NOT EXISTS medical_invoices_patient_id_idx    ON "medical_invoices" ("patient_id");
CREATE INDEX IF NOT EXISTS medical_invoices_status_idx        ON "medical_invoices" ("status");
CREATE INDEX IF NOT EXISTS medical_invoice_lines_invoice_id_idx   ON "medical_invoice_lines" ("invoice_id");
CREATE INDEX IF NOT EXISTS medical_invoice_lines_procedure_id_idx ON "medical_invoice_lines" ("procedure_id");

COMMIT;
