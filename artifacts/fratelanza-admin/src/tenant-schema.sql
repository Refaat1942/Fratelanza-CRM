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

