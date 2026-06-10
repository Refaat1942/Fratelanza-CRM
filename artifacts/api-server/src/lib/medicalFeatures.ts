import type { Request, Response, NextFunction } from "express";
import { getCurrentTenant } from "@workspace/db";

/** Granular medical submodule keys — admin can toggle each independently. */
export const MEDICAL_SUBFEATURES = [
  "medical_patients",
  "medical_appointments",
  "medical_visits",
  "medical_prescriptions",
  "medical_materials",
  "medical_invoices",
  "medical_reports",
  "medical_procedures",
  "medical_doctor_availability",
] as const;

export type MedicalSubfeature = (typeof MEDICAL_SUBFEATURES)[number];

function isFeatureEnabled(features: Record<string, boolean | undefined>, key: string): boolean {
  return features[key] !== false;
}

/** Master `medical` flag must be on; submodule may be individually disabled. */
export function requireMedicalSubmodule(subfeature: MedicalSubfeature) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const tenant = getCurrentTenant();
    if (!tenant) { next(); return; }
    const f = tenant.features ?? {};
    if (!isFeatureEnabled(f, "medical")) {
      res.status(403).json({ error: "feature_disabled", feature: "medical", message: "Medical module is disabled for this workspace." });
      return;
    }
    if (!isFeatureEnabled(f, subfeature)) {
      res.status(403).json({ error: "feature_disabled", feature: subfeature, message: "This medical section is not enabled for your workspace." });
      return;
    }
    next();
  };
}

export function requirePhysiotherapy(_req: Request, res: Response, next: NextFunction): void {
  const tenant = getCurrentTenant();
  if (!tenant) { next(); return; }
  const f = tenant.features ?? {};
  if (!isFeatureEnabled(f, "medical") || !isFeatureEnabled(f, "physiotherapy")) {
    res.status(403).json({ error: "feature_disabled", feature: "physiotherapy", message: "Physiotherapy is not enabled for your workspace." });
    return;
  }
  next();
}

export function requireClinicalNutrition(_req: Request, res: Response, next: NextFunction): void {
  const tenant = getCurrentTenant();
  if (!tenant) { next(); return; }
  const f = tenant.features ?? {};
  if (!isFeatureEnabled(f, "medical") || !isFeatureEnabled(f, "clinical_nutrition")) {
    res.status(403).json({ error: "feature_disabled", feature: "clinical_nutrition", message: "Clinical nutrition is not enabled for your workspace." });
    return;
  }
  next();
}
