import { Router, type IRouter, type Request, type Response } from "express";
import { getCurrentTenant } from "@workspace/db";

const router: IRouter = Router();

const ALL_FEATURES = [
  "tasks","crm","finance","team","products","suppliers","purchase_orders","rentals","reports","notifications","invoicing","medical","clinic_staff","branches",
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
