/**
 * Client-side permission helpers (mirrors lib/db/src/permissions.ts).
 */

export const LEGACY_MEDICAL_PERMISSION = "medical";

const MEDICAL_PREFIXES = ["medical_", "clinic_staff"] as const;

export type PermissionGroup = {
  id: string;
  en: string;
  ar: string;
  keys: string[];
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "core",
    en: "Core",
    ar: "أساسي",
    keys: ["dashboard", "notifications"],
  },
  {
    id: "finance",
    en: "Finance & billing",
    ar: "المالية والفواتير",
    keys: ["finance", "invoicing", "medical_invoices", "reports"],
  },
  {
    id: "operations",
    en: "Operations",
    ar: "العمليات",
    keys: ["tasks", "crm", "team", "products", "suppliers", "purchase_orders", "rentals", "branches"],
  },
  {
    id: "medical_core",
    en: "Clinic — modules",
    ar: "العيادة — الوحدات",
    keys: [
      "medical_patients",
      "medical_appointments",
      "medical_visits",
      "medical_prescriptions",
      "medical_medicine_master",
      "medical_rx_templates",
      "medical_materials",
      "medical_reports",
      "medical_doctor_availability",
      "clinic_staff",
    ],
  },
  {
    id: "medical_tools",
    en: "Clinic — tools",
    ar: "العيادة — أدوات",
    keys: [
      "medical_patient_qr",
      "medical_patient_documents",
      "medical_ai_summary",
      "medical_prescription_ocr",
    ],
  },
];

export const PERMISSION_LABELS: Record<string, { en: string; ar: string }> = {
  dashboard: { en: "Dashboard", ar: "لوحة القيادة" },
  tasks: { en: "Tasks", ar: "المهام" },
  crm: { en: "Clients", ar: "العملاء" },
  finance: { en: "Finance (income & expenses)", ar: "المالية (إيرادات ومصروفات)" },
  team: { en: "Team / HR", ar: "الموظفين" },
  products: { en: "Products", ar: "المنتجات" },
  suppliers: { en: "Suppliers", ar: "الموردون" },
  purchase_orders: { en: "Purchase orders", ar: "أوامر الشراء" },
  invoicing: { en: "Sales invoices", ar: "فواتير المبيعات" },
  rentals: { en: "Rentals", ar: "الإيجارات" },
  reports: { en: "Reports", ar: "التقارير" },
  notifications: { en: "Notifications", ar: "الإشعارات" },
  branches: { en: "Branches", ar: "الفروع" },
  medical_patients: { en: "Patients", ar: "المرضى" },
  medical_appointments: { en: "Appointments", ar: "المواعيد" },
  medical_visits: { en: "Visits", ar: "الزيارات" },
  medical_prescriptions: { en: "Prescriptions", ar: "الوصفات الطبية" },
  medical_medicine_master: { en: "Medicine master", ar: "سجل الأدوية" },
  medical_rx_templates: { en: "Rx templates", ar: "قوالب الوصفات" },
  medical_materials: { en: "Materials inventory", ar: "مخزون المستلزمات" },
  medical_invoices: { en: "Medical invoices", ar: "الفواتير الطبية" },
  medical_reports: { en: "Medical reports", ar: "تقارير العيادة" },
  medical_doctor_availability: { en: "Doctor hours", ar: "ساعات الأطباء" },
  clinic_staff: { en: "Clinic staff", ar: "طاقم العيادة" },
  medical_patient_qr: { en: "Patient QR", ar: "رمز QR للمريض" },
  medical_patient_documents: { en: "Patient documents", ar: "مستندات المرضى" },
  medical_ai_summary: { en: "AI patient summary", ar: "ملخص المريض بالذكاء الاصطناعي" },
  medical_prescription_ocr: { en: "Prescription scan", ar: "مسح الوصفة" },
};

export const ROLE_PERMISSION_PRESETS: Record<string, string[]> = {
  admin: PERMISSION_GROUPS.flatMap((g) => g.keys),
  manager: PERMISSION_GROUPS.flatMap((g) => g.keys),
  doctor: [
    "dashboard", "notifications",
    "medical_patients", "medical_appointments", "medical_visits", "medical_prescriptions",
    "medical_medicine_master", "medical_rx_templates", "medical_patient_qr",
    "medical_patient_documents", "medical_prescription_ocr", "medical_ai_summary",
  ],
  receptionist: [
    "dashboard", "tasks", "crm", "notifications",
    "medical_patients", "medical_appointments", "medical_visits", "medical_prescriptions",
    "medical_patient_qr", "medical_patient_documents", "medical_prescription_ocr",
  ],
  accountant: ["dashboard", "finance", "invoicing", "medical_invoices", "reports", "notifications"],
  assistant: ["dashboard", "notifications", "medical_patients", "medical_appointments", "medical_visits"],
  user: ["dashboard"],
};

function isMedicalPermissionKey(key: string): boolean {
  return key.startsWith("medical_") || key === "clinic_staff";
}

export function userHasPermission(permissions: string[] | null | undefined, permissionKey: string): boolean {
  const perms = permissions ?? [];
  if (perms.includes(permissionKey)) return true;
  if (isMedicalPermissionKey(permissionKey) && perms.includes(LEGACY_MEDICAL_PERMISSION)) return true;
  return false;
}

export function assignablePermissionGroups(
  features: Record<string, boolean>,
): PermissionGroup[] {
  return PERMISSION_GROUPS.map((g) => ({
    ...g,
    keys: g.keys.filter((k) => {
      if (k === "dashboard" || k === "notifications") return true;
      if (features[k] === false) return false;
      return true;
    }),
  })).filter((g) => g.keys.length > 0);
}

export function allAssignableKeys(features: Record<string, boolean>): string[] {
  return assignablePermissionGroups(features).flatMap((g) => g.keys);
}

export function labelForPermission(key: string, isAr: boolean): string {
  const row = PERMISSION_LABELS[key];
  if (!row) return key;
  return isAr ? row.ar : row.en;
}

export function expandLegacyPermissions(perms: string[]): string[] {
  if (!perms.includes(LEGACY_MEDICAL_PERMISSION)) return perms;
  const medicalKeys = PERMISSION_GROUPS.flatMap((g) => g.keys).filter(isMedicalPermissionKey);
  return [...new Set([...perms, ...medicalKeys])];
}
