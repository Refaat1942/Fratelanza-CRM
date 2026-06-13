import type { Request, Response, NextFunction } from "express";
import { getCurrentTenant, isFeatureEnabled } from "@workspace/db";

export function requireFeature(feature: string) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const tenant = getCurrentTenant();
    if (!tenant) { next(); return; }
    if (!isFeatureEnabled(tenant.features, feature)) {
      res.status(403).json({ error: "feature_disabled", feature, message: "This feature is not enabled for your workspace." });
      return;
    }
    next();
  };
}
