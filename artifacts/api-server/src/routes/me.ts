import { Router, type IRouter, type Request, type Response } from "express";
import { getCurrentTenant } from "@workspace/db";

const router: IRouter = Router();

const ALL_FEATURES = [
  "tasks","crm","finance","team","products","suppliers","purchase_orders","rentals","reports","notifications","invoicing",
  "medical","medical_patients","medical_appointments","medical_visits","medical_prescriptions","medical_materials",
  "medical_invoices","medical_reports","medical_procedures","medical_doctor_availability",
  "clinic_staff","physiotherapy","clinical_nutrition","branches",
];

router.get("/me/features", (_req: Request, res: Response) => {
  const tenant = getCurrentTenant();
  // Single-tenant dev mode: all features enabled.
  if (!tenant) {
    const all: Record<string, boolean> = {};
    for (const f of ALL_FEATURES) all[f] = true;
    res.json({ tenant: null, features: all });
    return;
  }
  const features: Record<string, boolean> = {};
  for (const f of ALL_FEATURES) features[f] = tenant.features[f] !== false;
  res.json({
    tenant: { subdomain: tenant.subdomain, status: tenant.status },
    features,
  });
});

export default router;
