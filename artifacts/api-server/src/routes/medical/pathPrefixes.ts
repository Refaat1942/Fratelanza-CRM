/** API path prefixes owned by the medical router (for path-scoped middleware). */
export const MEDICAL_API_PREFIXES = [
  "/patients",
  "/appointments",
  "/visits",
  "/prescriptions",
  "/prescriptions-stats",
  "/medicine-master",
  "/doctor-prescription-templates",
  "/diagnoses-master",
  "/medical-features-master",
  "/medical-materials",
  "/medical-invoices",
  "/medical-reports",
  "/doctor-availability",
  "/medical-alerts",
  "/procedures",
] as const;
