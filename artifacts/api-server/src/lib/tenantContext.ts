import type { Request } from "express";
import { tenantAls, type TenantBinding } from "@workspace/db";

/** Request with tenant pool attached by tenantMiddleware. */
export type FratelanzaRequest = Request & { tenantBinding?: TenantBinding };

/**
 * Multer (and some other middleware) can resume the request outside AsyncLocalStorage.
 * Re-enter the tenant DB context before any DB work in upload handlers.
 */
export function withRequestTenant<T>(req: Request, fn: () => T | Promise<T>): T | Promise<T> {
  const binding = (req as FratelanzaRequest).tenantBinding;
  if (!binding) return fn();
  return tenantAls.run(binding, fn);
}
