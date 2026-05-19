import type { Request, Response, NextFunction } from "express";
import { getCurrentTenant } from "@workspace/db";

export function requireFeature(feature: string) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const tenant = getCurrentTenant();
    // No tenant context (single-tenant dev mode) → allow.
    if (!tenant) { next(); return; }
    if (tenant.features[feature] === false) {
      res.status(403).json({ error: "feature_disabled", feature, message: "This feature is not enabled for your workspace." });
      return;
    }
    next();
  };
}
