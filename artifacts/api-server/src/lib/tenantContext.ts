import type { Request } from "express";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { tenantAls, db as defaultDb, type TenantBinding } from "@workspace/db";
import type * as DbSchema from "@workspace/db/schema";

type AppDb = NodePgDatabase<typeof DbSchema>;

/** Request with tenant pool attached by tenantMiddleware. */
export type FratelanzaRequest = Request & { tenantBinding?: TenantBinding };

const RESERVED = new Set(["www", "admin", "api", "app"]);

export function extractSubdomainFromHost(hostname: string): string | null {
  const h = (hostname || "").toLowerCase();
  if (!h || h === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(h)) return null;
  const parts = h.split(".");
  if (parts.length < 3) return null;
  const sub = parts[0]!;
  if (RESERVED.has(sub)) return null;
  return sub;
}

/** Tenant drizzle instance for this request — never rely on the global db proxy after multer. */
export function getRequestDb(req: Request): AppDb {
  const binding = (req as FratelanzaRequest).tenantBinding;
  if (binding?.db) return binding.db as AppDb;
  return defaultDb as AppDb;
}

/**
 * Same as getRequestDb but fails if we expected a tenant (subdomain present + admin API configured).
 * Prevents silent writes to DATABASE_URL (fratelanza) on tenant hosts.
 */
export function requireRequestDb(req: Request): AppDb {
  const binding = (req as FratelanzaRequest).tenantBinding;
  if (binding?.db) return binding.db as AppDb;

  const subdomain =
    (req.header("x-tenant-subdomain") || "").toLowerCase().trim()
    || extractSubdomainFromHost(req.hostname);

  if (subdomain && process.env.ADMIN_API_URL) {
    const err = new Error("tenant_binding_missing");
    (err as Error & { status?: number }).status = 500;
    throw err;
  }
  return defaultDb as AppDb;
}

export function getRequestDbName(req: Request): string {
  const binding = (req as FratelanzaRequest).tenantBinding;
  if (binding?.ctx?.dbName) return binding.ctx.dbName;
  try {
    const url = process.env.DATABASE_URL || "";
    const m = url.match(/\/([^/?]+)(\?|$)/);
    return m?.[1] || "default";
  } catch {
    return "unknown";
  }
}

/**
 * Multer resumes the request outside AsyncLocalStorage. Re-enter tenant ALS before next().
 */
export function continueWithRequestTenant(req: Request, next: () => void): void {
  const binding = (req as FratelanzaRequest).tenantBinding;
  if (!binding) {
    next();
    return;
  }
  tenantAls.run(binding, () => next());
}

/**
 * Run fn with tenant ALS + explicit tenant db (for upload handlers).
 */
export async function withRequestTenant<T>(req: Request, fn: (tenantDb: AppDb) => Promise<T>): Promise<T> {
  const binding = (req as FratelanzaRequest).tenantBinding;
  const tenantDb = requireRequestDb(req);
  if (!binding) return fn(tenantDb);
  return tenantAls.run(binding, () => fn(tenantDb));
}
