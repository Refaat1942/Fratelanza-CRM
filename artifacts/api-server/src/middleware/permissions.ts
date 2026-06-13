import type { Request, Response, NextFunction } from "express";
import { userHasPermission } from "@workspace/db";

export function requirePermission(module: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const s = req.session as any;
    if (!s?.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
    if (s.role === "admin") { next(); return; }
    const perms: string[] = Array.isArray(s.permissions) ? s.permissions : [];
    if (!userHasPermission(perms, module)) {
      res.status(403).json({ error: "Permission denied", permission: module });
      return;
    }
    next();
  };
}
