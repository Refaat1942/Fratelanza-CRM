import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const FEATURE_KEYS = [
  "tasks",
  "crm",
  "finance",
  "team",
  "products",
  "suppliers",
  "purchase_orders",
  "invoicing",
  "rentals",
  "reports",
  "notifications",
  "medical",
  "dental",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const FEATURE_LABELS: Record<FeatureKey, { en: string; ar: string }> = {
  tasks: { en: "Tasks", ar: "المهام" },
  crm: { en: "CRM / Clients", ar: "إدارة العملاء" },
  finance: { en: "Finance", ar: "المالية" },
  team: { en: "Team / HR", ar: "الموظفين" },
  products: { en: "Products / Inventory", ar: "المنتجات" },
  suppliers: { en: "Suppliers", ar: "الموردين" },
  purchase_orders: { en: "Purchase Orders", ar: "أوامر الشراء" },
  invoicing: { en: "Invoicing", ar: "الفواتير" },
  rentals: { en: "Rentals", ar: "الإيجارات" },
  reports: { en: "Reports", ar: "التقارير" },
  notifications: { en: "Notifications", ar: "الإشعارات" },
  medical: { en: "Medical / Clinic", ar: "العيادة الطبية" },
  dental: { en: "Dental Clinic", ar: "عيادة الأسنان" },
};

export function defaultFeatures(): Record<FeatureKey, boolean> {
  const o = {} as Record<FeatureKey, boolean>;
  for (const k of FEATURE_KEYS) o[k] = true;
  return o;
}

export const BILLING_CYCLES = ["monthly", "quarterly", "yearly", "lifetime"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const PAYMENT_STATUSES = ["trial", "paid", "due", "overdue", "cancelled"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS admin_customers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      subdomain TEXT UNIQUE NOT NULL,
      db_name TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      features JSONB NOT NULL DEFAULT '{}'::jsonb,
      notes TEXT,
      provision_status TEXT NOT NULL DEFAULT 'pending',
      provision_error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE admin_customers ADD COLUMN IF NOT EXISTS provision_status TEXT NOT NULL DEFAULT 'pending';
    ALTER TABLE admin_customers ADD COLUMN IF NOT EXISTS provision_error TEXT;
    ALTER TABLE admin_customers ADD COLUMN IF NOT EXISTS contact_name TEXT;
    ALTER TABLE admin_customers ADD COLUMN IF NOT EXISTS contact_email TEXT;
    ALTER TABLE admin_customers ADD COLUMN IF NOT EXISTS contact_phone TEXT;
    ALTER TABLE admin_customers ADD COLUMN IF NOT EXISTS plan_name TEXT;
    ALTER TABLE admin_customers ADD COLUMN IF NOT EXISTS billing_amount NUMERIC(10,2) DEFAULT 0;
    ALTER TABLE admin_customers ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';
    ALTER TABLE admin_customers ADD COLUMN IF NOT EXISTS subscription_start DATE;
    ALTER TABLE admin_customers ADD COLUMN IF NOT EXISTS subscription_end DATE;
    ALTER TABLE admin_customers ADD COLUMN IF NOT EXISTS next_billing_date DATE;
    ALTER TABLE admin_customers ADD COLUMN IF NOT EXISTS last_payment_date DATE;
    ALTER TABLE admin_customers ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'trial';
    ALTER TABLE admin_customers ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
    CREATE TABLE IF NOT EXISTS admin_payments (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES admin_customers(id) ON DELETE CASCADE,
      amount NUMERIC(10,2) NOT NULL,
      payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
      method TEXT,
      reference TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS admin_payments_customer_idx ON admin_payments(customer_id);
    CREATE TABLE IF NOT EXISTS admin_session (
      sid VARCHAR NOT NULL PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    );
    CREATE INDEX IF NOT EXISTS admin_session_expire_idx ON admin_session(expire);
  `);
}

export async function seedAdmin(username: string, passwordHash: string) {
  const { rows } = await pool.query("SELECT id FROM admin_users WHERE username = $1", [username]);
  if (rows.length === 0) {
    await pool.query("INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)", [
      username,
      passwordHash,
    ]);
  }
}

/**
 * Build a connection string for a given tenant DB name using the same
 * TENANT_DB_URL_TEMPLATE the CRM uses. Falls back to deriving from DATABASE_URL.
 */
export function tenantConnectionString(dbName: string): string {
  const tmpl = process.env.TENANT_DB_URL_TEMPLATE;
  if (tmpl && tmpl.includes("{db}")) return tmpl.replace("{db}", dbName);
  // Derive from DATABASE_URL by swapping the path
  const base = process.env.DATABASE_URL!;
  return base.replace(/\/[^/?]+(\?|$)/, `/${dbName}$1`);
}

/** Short-lived pool for one-shot tenant operations (password reset, monitoring). */
export async function withTenantPool<T>(
  dbName: string,
  fn: (p: pg.Pool) => Promise<T>,
): Promise<T> {
  const p = new Pool({ connectionString: tenantConnectionString(dbName), max: 2 });
  try {
    return await fn(p);
  } finally {
    await p.end().catch(() => {});
  }
}

/** Advance a date by the billing cycle. */
export function advanceBillingDate(from: Date, cycle: BillingCycle): Date {
  const d = new Date(from);
  if (cycle === "monthly") d.setMonth(d.getMonth() + 1);
  else if (cycle === "quarterly") d.setMonth(d.getMonth() + 3);
  else if (cycle === "yearly") d.setFullYear(d.getFullYear() + 1);
  // lifetime: no advance
  return d;
}

/** Monthly recurring revenue contribution for a cycle. */
export function monthlyEquivalent(amount: number, cycle: BillingCycle): number {
  if (cycle === "monthly") return amount;
  if (cycle === "quarterly") return amount / 3;
  if (cycle === "yearly") return amount / 12;
  return 0; // lifetime doesn't recur
}
