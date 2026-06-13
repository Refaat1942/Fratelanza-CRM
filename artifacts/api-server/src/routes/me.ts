import { Router, type IRouter, type Request, type Response } from "express";
import { getCurrentTenant, resolveAllFeatures } from "@workspace/db";

const router: IRouter = Router();

router.get("/me/features", (_req: Request, res: Response) => {
  const tenant = getCurrentTenant();
  if (!tenant) {
    res.json({ tenant: null, features: resolveAllFeatures(null) });
    return;
  }
  res.json({
    tenant: { subdomain: tenant.subdomain, status: tenant.status },
    features: resolveAllFeatures(tenant.features),
  });
});

export default router;
