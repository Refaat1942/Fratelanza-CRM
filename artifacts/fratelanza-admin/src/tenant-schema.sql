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
