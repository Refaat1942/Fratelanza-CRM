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
  "rentals",
  "reports",
  "notifications",
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
  rentals: { en: "Rentals", ar: "الإيجارات" },
  reports: { en: "Reports", ar: "التقارير" },
  notifications: { en: "Notifications", ar: "الإشعارات" },
};

export function defaultFeatures(): Record<FeatureKey, boolean> {
  const o = {} as Record<FeatureKey, boolean>;
  for (const k of FEATURE_KEYS) o[k] = true;
  return o;
}

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
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
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
