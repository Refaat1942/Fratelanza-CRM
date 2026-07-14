/**
 * Tenant feature flags — single source of truth for admin, API, and CRM.
 * Stored per customer in admin_customers.features (JSONB).
 */

export const FEATURE_KEYS = [
  // —— General workspace ——
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
  "branches",
  // —— HR & Payroll ——
  "hr_attendance",
  "hr_payroll",
  // —— Medical: core modules ——
  "medical_patients",
  "medical_appointments",
  "medical_visits",
  "medical_prescriptions",
  "medical_medicine_master",
  "medical_rx_templates",
  "medical_materials",
  "medical_invoices",
  "medical_reports",
  "medical_doctor_availability",
  "clinic_staff",
  // —— Medical: capabilities ——
  "medical_patient_qr",
  "medical_patient_documents",
  "medical_ai_summary",
  "medical_prescription_ocr",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

/** Keys that belong to the medical workspace (for nav / toggles). */
export const MEDICAL_FEATURE_KEYS: FeatureKey[] = FEATURE_KEYS.filter(
  (k) => k.startsWith("medical_") || k === "clinic_staff",
) as FeatureKey[];

export const GENERAL_FEATURE_KEYS: FeatureKey[] = FEATURE_KEYS.filter(
  (k) => !MEDICAL_FEATURE_KEYS.includes(k as FeatureKey),
) as FeatureKey[];

export const FEATURE_LABELS: Record<FeatureKey, { en: string; ar: string }> = {
  tasks: { en: "Tasks", ar: "المهام" },
  crm: { en: "CRM / Clients", ar: "إدارة العملاء" },
  finance: { en: "Finance", ar: "المالية" },
  team: { en: "Team / HR", ar: "الموظفين" },
  products: { en: "Products / Inventory", ar: "المنتجات" },
  suppliers: { en: "Suppliers", ar: "الموردين" },
  purchase_orders: { en: "Purchase Orders", ar: "أوامر الشراء" },
  invoicing: { en: "Invoicing (sales)", ar: "فواتير المبيعات" },
  rentals: { en: "Rentals", ar: "الإيجارات" },
  reports: { en: "Reports", ar: "التقارير" },
  notifications: { en: "Notifications", ar: "الإشعارات" },
  branches: { en: "Multi-branch", ar: "تعدد الفروع" },
  hr_attendance: { en: "Attendance & clock-in", ar: "الحضور وتسجيل الدخول" },
  hr_payroll: { en: "Payroll", ar: "الرواتب" },
  medical_patients: { en: "Patients", ar: "المرضى" },
  medical_appointments: { en: "Appointments", ar: "المواعيد" },
  medical_visits: { en: "Visits", ar: "الزيارات" },
  medical_prescriptions: { en: "Prescriptions", ar: "الوصفات الطبية" },
  medical_medicine_master: { en: "Medicine Master", ar: "سجل الأدوية" },
  medical_rx_templates: { en: "Rx print templates", ar: "قوالب طباعة الوصفات" },
  medical_materials: { en: "Materials inventory", ar: "مخزون المستلزمات" },
  medical_invoices: { en: "Medical invoices", ar: "الفواتير الطبية" },
  medical_reports: { en: "Medical reports", ar: "تقارير العيادة" },
  medical_doctor_availability: { en: "Doctor hours", ar: "ساعات الأطباء" },
  clinic_staff: { en: "Clinic staff", ar: "طاقم العيادة" },
  medical_patient_qr: { en: "Patient QR & public history", ar: "رمز QR والسجل العام" },
  medical_patient_documents: { en: "Patient document uploads", ar: "رفع مستندات المرضى" },
  medical_ai_summary: { en: "AI patient summary", ar: "ملخص المريض بالذكاء الاصطناعي" },
  medical_prescription_ocr: { en: "Prescription photo OCR", ar: "مسح الوصفة بالصورة (OCR)" },
};

export const HR_FEATURE_KEYS: FeatureKey[] = ["team", "hr_attendance", "hr_payroll"];

export const FEATURE_GROUPS: { id: string; en: string; ar: string; keys: FeatureKey[] }[] = [
  {
    id: "general",
    en: "General workspace",
    ar: "مساحة العمل العامة",
    keys: GENERAL_FEATURE_KEYS.filter((k) => !HR_FEATURE_KEYS.includes(k)),
  },
  {
    id: "hr",
    en: "HR & Payroll",
    ar: "الموارد البشرية والرواتب",
    keys: HR_FEATURE_KEYS,
  },
  {
    id: "medical_core",
    en: "Medical — core modules",
    ar: "العيادة — الوحدات الأساسية",
    keys: [
      "medical_patients",
      "medical_appointments",
      "medical_visits",
      "medical_prescriptions",
      "medical_medicine_master",
      "medical_rx_templates",
      "medical_materials",
      "medical_invoices",
      "medical_reports",
      "medical_doctor_availability",
      "clinic_staff",
    ],
  },
  {
    id: "medical_tools",
    en: "Medical — smart tools",
    ar: "العيادة — أدوات ذكية",
    keys: [
      "medical_patient_qr",
      "medical_patient_documents",
      "medical_ai_summary",
      "medical_prescription_ocr",
    ],
  },
];

/** Legacy umbrella flag stored on older tenants (`medical: true/false`). */
const LEGACY_MEDICAL_KEY = "medical";

export function defaultFeatures(): Record<FeatureKey, boolean> {
  const o = {} as Record<FeatureKey, boolean>;
  for (const k of FEATURE_KEYS) o[k] = true;
  return o;
}

function isMedicalFeatureKey(key: string): boolean {
  return key.startsWith("medical_") || key === "clinic_staff";
}

/**
 * Resolve whether a feature is enabled for a tenant.
 * - Explicit `false` on a key always wins.
 * - Legacy `medical: false` disables all medical modules.
 * - Legacy `medical: true` (without per-module keys) keeps all medical modules on.
 */
export function isFeatureEnabled(
  features: Record<string, boolean | undefined> | null | undefined,
  key: string,
): boolean {
  if (!features) return true;
  if (features[key] === false) return false;
  if (features[key] === true) return true;

  if (isMedicalFeatureKey(key)) {
    const legacy = features[LEGACY_MEDICAL_KEY];
    if (legacy === false) return false;
    return true;
  }

  return features[key] !== false;
}

/**
 * Normalize stored JSON for the admin UI (checkboxes reflect effective access).
 */
export function normalizeCustomerFeatures(
  raw: Record<string, boolean> | null | undefined,
): Record<FeatureKey, boolean> {
  const merged = { ...defaultFeatures(), ...(raw || {}) };
  const legacyMedical = raw?.[LEGACY_MEDICAL_KEY];

  if (legacyMedical === false) {
    for (const k of MEDICAL_FEATURE_KEYS) merged[k] = false;
  } else if (legacyMedical === true) {
    const hasGranular = MEDICAL_FEATURE_KEYS.some((k) => raw && raw[k] !== undefined);
    if (!hasGranular) {
      for (const k of MEDICAL_FEATURE_KEYS) merged[k] = true;
    }
  }

  for (const k of FEATURE_KEYS) {
    merged[k] = isFeatureEnabled(raw || {}, k);
  }
  return merged;
}

/** Flat map of every feature → enabled, for API /me/features. */
export function resolveAllFeatures(
  raw: Record<string, boolean | undefined> | null | undefined,
): Record<FeatureKey, boolean> {
  const out = {} as Record<FeatureKey, boolean>;
  for (const k of FEATURE_KEYS) out[k] = isFeatureEnabled(raw, k);
  return out;
}
