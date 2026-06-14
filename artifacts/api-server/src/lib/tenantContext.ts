import type { Request, Response, NextFunction } from "express";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { tenantAls, db as defaultDb, type TenantBinding } from "@workspace/db";
import type * as DbSchema from "@workspace/db/schema";

type AppDb = NodePgDatabase<typeof DbSchema>;

/** Request with tenant pool attached by tenantMiddleware (frozen before multer). */
export type FratelanzaRequest = Request & {
  tenantBinding?: TenantBinding;
  /** Captured at tenant resolution — safe to use after multer. */
  frozenTenantDb?: AppDb;
  frozenDbName?: string;
  frozenSubdomain?: string;
};

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

export function freezeTenantOnRequest(req: Request, binding: TenantBinding): void {
  const fr = req as FratelanzaRequest;
  fr.tenantBinding = binding;
  fr.frozenTenantDb = binding.db as AppDb;
  fr.frozenDbName = binding.ctx.dbName;
  fr.frozenSubdomain = binding.ctx.subdomain;
}

/** DB for reads — prefers frozen handle (same pool as upload after tenant middleware). */
export function getRequestDb(req: Request): AppDb {
  const fr = req as FratelanzaRequest;
  if (fr.frozenTenantDb) return fr.frozenTenantDb;
  if (fr.tenantBinding?.db) return fr.tenantBinding.db as AppDb;
  return defaultDb as AppDb;
}

/**
 * Upload/write path — ONLY the frozen tenant db. Never falls back to DATABASE_URL on tenant hosts.
 */
export function requireFrozenTenantDb(req: Request): {
  db: AppDb;
  dbName: string;
  subdomain: string;
  usesBindingDb: boolean;
} {
  const fr = req as FratelanzaRequest;
  const subdomain =
    fr.frozenSubdomain
    || (req.header("x-tenant-subdomain") || "").toLowerCase().trim()
    || extractSubdomainFromHost(req.hostname)
    || "";

  if (!fr.frozenTenantDb || !fr.frozenDbName) {
    if (subdomain && process.env.ADMIN_API_URL) {
      throw new Error("tenant_binding_missing");
    }
    return {
      db: defaultDb as AppDb,
      dbName: fr.frozenDbName || "default",
      subdomain,
      usesBindingDb: false,
    };
  }

  return {
    db: fr.frozenTenantDb,
    dbName: fr.frozenDbName,
    subdomain: fr.frozenSubdomain || subdomain,
    usesBindingDb: fr.frozenTenantDb === fr.tenantBinding?.db,
  };
}

export function getRequestDbName(req: Request): string {
  const fr = req as FratelanzaRequest;
  if (fr.frozenDbName) return fr.frozenDbName;
  if (fr.tenantBinding?.ctx?.dbName) return fr.tenantBinding.ctx.dbName;
  try {
    const url = process.env.DATABASE_URL || "";
    const m = url.match(/\/([^/?]+)(\?|$)/);
    return m?.[1] || "default";
  } catch {
    return "unknown";
  }
}

export async function postgresCurrentDatabase(tenantDb: AppDb): Promise<string> {
  const result = await tenantDb.execute(sql`SELECT current_database() AS db`);
  const row = (result as { rows?: Array<Record<string, unknown>> }).rows?.[0];
  const name = row?.db;
  return typeof name === "string" ? name : "unknown";
}

export async function assertPostgresDatabase(tenantDb: AppDb, expectedDb: string): Promise<string> {
  const actual = await postgresCurrentDatabase(tenantDb);
  if (actual !== expectedDb) {
    throw new Error(`wrong_postgres_database:${actual}:expected:${expectedDb}`);
  }
  return actual;
}

/** Must run synchronously in the route chain BEFORE multer. */
export function freezeTenantDbMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    requireFrozenTenantDb(req);
    next();
  } catch (err) {
    if ((err as Error).message === "tenant_binding_missing") {
      res.status(500).json({
        error: "tenant_binding_missing",
        hint: "Tenant DB was not frozen on this request before upload",
      });
      return;
    }
    next(err as Error);
  }
}

/** Multer resumes outside AsyncLocalStorage — re-enter ALS before the route handler. */
export function continueWithRequestTenant(req: Request, next: () => void): void {
  const binding = (req as FratelanzaRequest).tenantBinding;
  if (!binding) {
    next();
    return;
  }
  tenantAls.run(binding, () => next());
}
