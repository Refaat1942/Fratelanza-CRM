CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"title_ar" text,
	"description" text,
	"description_ar" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"due_date" text,
	"assignee" text,
	"recurrence" text DEFAULT 'none' NOT NULL,
	"client_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"email" text,
	"phone" text,
	"company" text,
	"company_ar" text,
	"status" text DEFAULT 'lead' NOT NULL,
	"notes" text,
	"notes_ar" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"title_ar" text,
	"description" text,
	"amount" real NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"date" text NOT NULL,
	"client_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"description_ar" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"email" text,
	"phone" text,
	"department" text,
	"department_ar" text,
	"role" text,
	"role_ar" text,
	"status" text DEFAULT 'active' NOT NULL,
	"salary" text,
	"join_date" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"title_ar" text,
	"message" text,
	"message_ar" text,
	"type" text DEFAULT 'info' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"display_name" text,
	"permissions" text DEFAULT '[]' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);

CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"description" text,
	"description_ar" text,
	"price" real DEFAULT 0 NOT NULL,
	"cost_price" real DEFAULT 0 NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"reorder_point" integer DEFAULT 5 NOT NULL,
	"category" text,
	"category_ar" text,
	"sku" text,
	"status" text DEFAULT 'available' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "rentals" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"client_name" text,
	"employee_id" integer,
	"employee_name" text,
	"product_id" integer,
	"product_name" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text,
	"return_date" text,
	"daily_rate" real,
	"total_amount" real,
	"deposit_amount" real,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text,
	"document_path" text,
	"document_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"contact_person" text,
	"phone" text,
	"email" text,
	"address" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "stock_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"reason" text,
	"reference_type" text,
	"reference_id" integer,
	"user_id" integer,
	"username" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "purchase_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"po_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" real NOT NULL,
	"subtotal" real NOT NULL
);

CREATE TABLE "purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"po_number" text NOT NULL,
	"supplier_id" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"order_date" text NOT NULL,
	"expected_date" text,
	"received_date" text,
	"total" real DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_orders_po_number_unique" UNIQUE("po_number")
);

CREATE TABLE "invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"description" text NOT NULL,
	"description_ar" text,
	"quantity" real DEFAULT 1 NOT NULL,
	"unit_price" real DEFAULT 0 NOT NULL,
	"total" real DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "invoices" (
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

CREATE TABLE "medical_appointments" (
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

CREATE TABLE "medical_invoice_lines" (
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

CREATE TABLE "medical_invoices" (
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

CREATE TABLE "medical_procedures" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"category" text,
	"price" real DEFAULT 0 NOT NULL,
	"active" text DEFAULT 'true' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "patients" (
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

CREATE TABLE "prescriptions" (
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

CREATE TABLE "visits" (
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

ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;

-- T005 reporting indices (added for medical reports performance)
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

-- Phase B: Dental sub-module (migration 002)
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
CREATE UNIQUE INDEX IF NOT EXISTS dental_chart_unique_tooth_idx ON "dental_chart_entries" ("patient_id", "tooth_number");
CREATE INDEX IF NOT EXISTS dental_visits_patient_idx   ON "dental_visits" ("patient_id");
CREATE INDEX IF NOT EXISTS dental_visits_doctor_idx    ON "dental_visits" ("doctor_id");
CREATE INDEX IF NOT EXISTS dental_visits_date_idx      ON "dental_visits" ("visit_date");
CREATE INDEX IF NOT EXISTS dental_visits_tooth_idx     ON "dental_visits" ("tooth_number");
CREATE INDEX IF NOT EXISTS dental_procedures_active_idx ON "dental_procedures" ("active");

-- Phase C — Treatment Plans (added after Phase B; use IF NOT EXISTS for idempotency)
CREATE TABLE IF NOT EXISTS treatment_plans (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL,
  doctor_id INTEGER,
  title TEXT,
  title_ar TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  notes_ar TEXT,
  estimated_total REAL NOT NULL DEFAULT 0,
  start_date DATE,
  target_completion_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS treatment_plan_items (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
  procedure_id INTEGER,
  description TEXT,
  description_ar TEXT,
  tooth_number INTEGER,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned',
  scheduled_date DATE,
  completed_at TIMESTAMPTZ,
  completed_visit_id INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_doctor ON treatment_plans(doctor_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON treatment_plans(status);
CREATE INDEX IF NOT EXISTS idx_treatment_plan_items_plan ON treatment_plan_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plan_items_proc ON treatment_plan_items(procedure_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plan_items_sched ON treatment_plan_items(scheduled_date);

-- Phase D1: Branches + roles foundation (added after launch — IF NOT EXISTS)
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

-- Phase D2: branch_id on all transactional records (additive, nullable)
ALTER TABLE tasks                 ADD COLUMN IF NOT EXISTS branch_id INTEGER;
ALTER TABLE patients              ADD COLUMN IF NOT EXISTS branch_id INTEGER;
ALTER TABLE medical_appointments  ADD COLUMN IF NOT EXISTS branch_id INTEGER;
ALTER TABLE visits                ADD COLUMN IF NOT EXISTS branch_id INTEGER;
ALTER TABLE medical_invoices      ADD COLUMN IF NOT EXISTS branch_id INTEGER;
ALTER TABLE transactions          ADD COLUMN IF NOT EXISTS branch_id INTEGER;
ALTER TABLE treatment_plans       ADD COLUMN IF NOT EXISTS branch_id INTEGER;
ALTER TABLE employees             ADD COLUMN IF NOT EXISTS branch_id INTEGER;
ALTER TABLE products              ADD COLUMN IF NOT EXISTS branch_id INTEGER;
ALTER TABLE rentals               ADD COLUMN IF NOT EXISTS branch_id INTEGER;
ALTER TABLE dental_visits         ADD COLUMN IF NOT EXISTS branch_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_tasks_branch                ON tasks(branch_id);
CREATE INDEX IF NOT EXISTS idx_patients_branch             ON patients(branch_id);
CREATE INDEX IF NOT EXISTS idx_medical_appointments_branch ON medical_appointments(branch_id);
CREATE INDEX IF NOT EXISTS idx_visits_branch               ON visits(branch_id);
CREATE INDEX IF NOT EXISTS idx_medical_invoices_branch     ON medical_invoices(branch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_branch         ON transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_branch      ON treatment_plans(branch_id);
CREATE INDEX IF NOT EXISTS idx_employees_branch            ON employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_products_branch             ON products(branch_id);
CREATE INDEX IF NOT EXISTS idx_rentals_branch              ON rentals(branch_id);
CREATE INDEX IF NOT EXISTS idx_dental_visits_branch        ON dental_visits(branch_id);

-- Phase E1: tenant branding (singleton row per tenant DB)
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

-- Phase D3: medical visits - materials & tooth tracking
ALTER TABLE visits ADD COLUMN IF NOT EXISTS materials_used TEXT;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS materials_used_ar TEXT;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS tooth_number TEXT;

-- Phase F2: medical materials inventory
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

-- Phase H: Doctor Availability Windows
CREATE TABLE IF NOT EXISTS doctor_availability (
  id           SERIAL PRIMARY KEY,
  doctor_id    INTEGER NOT NULL,
  day_of_week  INTEGER NOT NULL,
  start_time   TEXT NOT NULL,
  end_time     TEXT NOT NULL,
  branch_id    INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS doctor_availability_doctor_idx     ON doctor_availability(doctor_id);
CREATE INDEX IF NOT EXISTS doctor_availability_doctor_day_idx ON doctor_availability(doctor_id, day_of_week);

-- Phase F3: Clinic Staff + prescription header fields on tenant_settings.
CREATE TABLE IF NOT EXISTS clinic_staff (
  id              SERIAL PRIMARY KEY,
  name            TEXT,
  name_ar         TEXT,
  role            TEXT NOT NULL DEFAULT 'doctor',
  specialty       TEXT,
  specialty_ar    TEXT,
  license_number  TEXT,
  phone           TEXT,
  email           TEXT,
  notes           TEXT,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clinic_staff_active ON clinic_staff(active);
CREATE INDEX IF NOT EXISTS idx_clinic_staff_role   ON clinic_staff(role);

ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS clinic_phone            TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS clinic_address          TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS clinic_address_ar       TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS doctor_title            TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS doctor_title_ar         TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS doctor_license          TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS prescription_footer     TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS prescription_footer_ar  TEXT;

-- Phase G1: Patient QR, medicine master, diagnoses/features master, doctor Rx templates
ALTER TABLE patients ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_patients_qr_token ON patients(qr_token);

CREATE TABLE IF NOT EXISTS medicine_master (
  id SERIAL PRIMARY KEY,
  material TEXT NOT NULL UNIQUE,
  material_description TEXT NOT NULL,
  bun TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_medicine_master_material ON medicine_master(material);

ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS medicine_id INTEGER;

CREATE TABLE IF NOT EXISTS diagnoses_master (
  id SERIAL PRIMARY KEY,
  code TEXT,
  name TEXT NOT NULL,
  name_ar TEXT,
  specialization TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medical_features_master (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  specialization TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctor_prescription_templates (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL UNIQUE,
  template_url TEXT,
  doctor_title TEXT,
  doctor_title_ar TEXT,
  doctor_license TEXT,
  footer_text TEXT,
  footer_text_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
