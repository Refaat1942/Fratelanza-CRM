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
  "clinic_staff",
  "branches",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

// Feature groups for admin UI — lets the operator enable/disable a whole section
// (e.g. all Medical features) with one click instead of toggling each individually.
// Storage in admin_customers.features is still per-key; this is presentation only.
export const FEATURE_GROUPS: { id: string; en: string; ar: string; keys: FeatureKey[] }[] = [
  {
    id: "general",
    en: "General",
    ar: "عام",
    keys: ["tasks", "crm", "finance", "team", "products", "suppliers", "purchase_orders", "invoicing", "rentals", "reports", "notifications", "branches"],
  },
  {
    id: "medical",
    en: "Medical / Clinic",
    ar: "العيادة الطبية",
    keys: ["medical", "clinic_staff"],
  },
];

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
  medical: { en: "Medical core (Patients · Visits · Invoices)", ar: "النظام الطبي (المرضى · الزيارات · الفواتير)" },
  clinic_staff: { en: "Clinic Staff (doctors / nurses)", ar: "طاقم العيادة (أطباء / تمريض)" },
  branches: { en: "Multi-branch", ar: "تعدد الفروع" },
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

export const MEDICAL_SPECIALIZATIONS = [
  {
    key: "general",
    label: "General Practice",
    labelAr: "طب عام",
    diagnoses: ["Upper respiratory infection", "Hypertension", "Type 2 diabetes", "Gastroenteritis", "Back pain"],
    diagnosesAr: ["عدوى الجهاز التنفسي العلوي", "ارتفاع ضغط الدم", "سكري النوع الثاني", "التهاب المعدة والأمعاء", "آلام الظهر"],
    features: ["Vitals", "Follow-up reminders", "Chronic disease tracking"],
    featuresAr: ["العلامات الحيوية", "تذكيرات المتابعة", "متابعة الأمراض المزمنة"],
  },
  {
    key: "gyna",
    label: "Gynaecology",
    labelAr: "نساء وتوليد",
    diagnoses: ["Pregnancy follow-up", "Polycystic ovary syndrome", "Dysmenorrhea", "Vaginitis", "Menorrhagia"],
    diagnosesAr: ["متابعة الحمل", "تكيس المبايض", "عسر الطمث", "التهاب مهبلي", "غزارة الطمث"],
    features: ["LMP/EDD tracking", "Pregnancy follow-up", "Ultrasound notes"],
    featuresAr: ["متابعة آخر دورة وموعد الولادة", "متابعة الحمل", "ملاحظات السونار"],
  },
  {
    key: "orthopedics",
    label: "Orthopedics / Osteology",
    labelAr: "عظام",
    diagnoses: ["Fracture", "Osteoarthritis", "Ligament sprain", "Disc prolapse", "Osteoporosis"],
    diagnosesAr: ["كسر", "خشونة المفاصل", "التواء أربطة", "انزلاق غضروفي", "هشاشة العظام"],
    features: ["X-ray notes", "Cast follow-up", "Physiotherapy plan"],
    featuresAr: ["ملاحظات الأشعة", "متابعة الجبس", "خطة العلاج الطبيعي"],
  },
  {
    key: "dermatology",
    label: "Dermatology",
    labelAr: "جلدية",
    diagnoses: ["Acne vulgaris", "Eczema", "Psoriasis", "Urticaria", "Fungal infection"],
    diagnosesAr: ["حب الشباب", "إكزيما", "صدفية", "أرتيكاريا", "عدوى فطرية"],
    features: ["Skin lesion notes", "Photo follow-up", "Procedure reminders"],
    featuresAr: ["ملاحظات الآفات الجلدية", "متابعة بالصور", "تذكيرات الإجراءات"],
  },
  {
    key: "pediatrics",
    label: "Pediatrics",
    labelAr: "أطفال",
    diagnoses: ["Fever", "Bronchiolitis", "Tonsillitis", "Otitis media", "Gastroenteritis"],
    diagnosesAr: ["حمى", "التهاب الشعب الهوائية", "التهاب اللوزتين", "التهاب الأذن الوسطى", "التهاب المعدة والأمعاء"],
    features: ["Growth tracking", "Vaccination reminders", "Weight-based dosing"],
    featuresAr: ["متابعة النمو", "تذكيرات التطعيم", "جرعات حسب الوزن"],
  },
] as const;

export type MedicalSpecializationKey = (typeof MEDICAL_SPECIALIZATIONS)[number]["key"];

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
    ALTER TABLE admin_customers ADD COLUMN IF NOT EXISTS medical_specialization TEXT DEFAULT 'general';
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
