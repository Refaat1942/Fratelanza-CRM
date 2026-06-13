/**
 * User-level permission keys (stored in users.permissions JSON array).
 * Tenant admins assign these in CRM Settings → Users.
 * Platform admin controls which modules exist via tenant feature flags.
 */

import { FEATURE_LABELS, type FeatureKey } from "./features.js";

/** Always available to any logged-in user. */
export const DASHBOARD_PERMISSION = "dashboard" as const;

/** Legacy umbrella — grants all medical module permissions. */
export const LEGACY_MEDICAL_PERMISSION = "medical" as const;

/** General workspace permission keys (map 1:1 to tenant feature keys). */
export const GENERAL_PERMISSION_KEYS = [
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
] as const;

export type GeneralPermissionKey = (typeof GENERAL_PERMISSION_KEYS)[number];

/** Medical module permission keys (align with tenant medical_* / clinic_staff flags). */
export const MEDICAL_PERMISSION_KEYS = [
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
  "medical_patient_qr",
  "medical_patient_documents",
  "medical_ai_summary",
  "medical_prescription_ocr",
] as const;

export type MedicalPermissionKey = (typeof MEDICAL_PERMISSION_KEYS)[number];

export type UserPermissionKey =
  | typeof DASHBOARD_PERMISSION
  | GeneralPermissionKey
  | MedicalPermissionKey
  | typeof LEGACY_MEDICAL_PERMISSION;

export const ALL_ASSIGNABLE_PERMISSION_KEYS: UserPermissionKey[] = [
  DASHBOARD_PERMISSION,
  ...GENERAL_PERMISSION_KEYS,
  ...MEDICAL_PERMISSION_KEYS,
];

export type PermissionGroup = {
  id: string;
  en: string;
  ar: string;
  keys: UserPermissionKey[];
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "core",
    en: "Core",
    ar: "أساسي",
    keys: [DASHBOARD_PERMISSION, "notifications"],
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
  ...FEATURE_LABELS,
};

export const ROLE_PERMISSION_PRESETS: Record<string, UserPermissionKey[]> = {
  admin: [...ALL_ASSIGNABLE_PERMISSION_KEYS],
  manager: [
    DASHBOARD_PERMISSION,
    "tasks", "crm", "finance", "team", "products", "suppliers", "purchase_orders",
    "invoicing", "rentals", "reports", "notifications", "branches",
    ...MEDICAL_PERMISSION_KEYS,
  ],
  doctor: [
    DASHBOARD_PERMISSION,
    "notifications",
    "medical_patients", "medical_appointments", "medical_visits", "medical_prescriptions",
    "medical_medicine_master", "medical_rx_templates", "medical_patient_qr",
    "medical_patient_documents", "medical_prescription_ocr", "medical_ai_summary",
  ],
  receptionist: [
    DASHBOARD_PERMISSION,
    "tasks", "crm", "notifications",
    "medical_patients", "medical_appointments", "medical_visits", "medical_prescriptions",
    "medical_patient_qr", "medical_patient_documents", "medical_prescription_ocr",
  ],
  accountant: [
    DASHBOARD_PERMISSION,
    "finance", "invoicing", "medical_invoices", "reports", "notifications",
  ],
  assistant: [
    DASHBOARD_PERMISSION,
    "notifications",
    "medical_patients", "medical_appointments", "medical_visits",
  ],
  user: [DASHBOARD_PERMISSION],
};

function isMedicalPermissionKey(key: string): boolean {
  return key.startsWith("medical_") || key === "clinic_staff";
}

/** Whether a user permission list grants access to `permissionKey`. */
export function userHasPermission(
  permissions: string[] | null | undefined,
  permissionKey: string,
): boolean {
  const perms = permissions ?? [];
  if (perms.includes(permissionKey)) return true;
  if (isMedicalPermissionKey(permissionKey) && perms.includes(LEGACY_MEDICAL_PERMISSION)) {
    return true;
  }
  return false;
}

/** Map tenant feature flag key → user permission key (same string for most modules). */
export function permissionKeyForFeature(featureKey: string): string {
  return featureKey;
}

/**
 * Keep only permissions the tenant has purchased/enabled.
 * Dashboard is always allowed.
 */
export function filterPermissionsForTenant(
  permissions: string[],
  tenantFeatures: Record<string, boolean | undefined> | null | undefined,
): string[] {
  const out = new Set<string>();
  for (const p of permissions) {
    if (p === DASHBOARD_PERMISSION) {
      out.add(p);
      continue;
    }
    if (p === LEGACY_MEDICAL_PERMISSION) {
      const anyMedical = MEDICAL_PERMISSION_KEYS.some(
        (k) => tenantFeatures?.[k] !== false,
      );
      if (anyMedical) out.add(p);
      continue;
    }
    if (tenantFeatures && tenantFeatures[p] === false) continue;
    if (ALL_ASSIGNABLE_PERMISSION_KEYS.includes(p as UserPermissionKey)) {
      out.add(p);
    }
  }
  if (out.size === 0) out.add(DASHBOARD_PERMISSION);
  return [...out];
}

export function normalizePermissionList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [DASHBOARD_PERMISSION];
  return raw.filter((x): x is string => typeof x === "string" && x.length > 0);
}

export function labelForPermission(key: string, lang: "en" | "ar"): string {
  const row = PERMISSION_LABELS[key];
  if (row) return lang === "ar" ? row.ar : row.en;
  return key;
}

/** Permissions assignable in Settings UI for this tenant (feature-enabled only). */
export function assignablePermissionsForTenant(
  tenantFeatures: Record<string, boolean | undefined> | null | undefined,
): PermissionGroup[] {
  return PERMISSION_GROUPS.map((g) => ({
    ...g,
    keys: g.keys.filter((k) => {
      if (k === DASHBOARD_PERMISSION || k === "notifications") return true;
      if (tenantFeatures && tenantFeatures[k] === false) return false;
      return true;
    }),
  })).filter((g) => g.keys.length > 0);
}
