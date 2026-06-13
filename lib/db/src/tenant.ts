import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

const { Pool } = pg;

export type TenantContext = {
  subdomain: string;
  dbName: string;
  features: Record<string, boolean>;
  status: "active" | "blocked";
  paymentStatus?: string;
  subscriptionEnd?: string | null;
};

export type TenantBinding = {
  ctx: TenantContext;
  pool: pg.Pool;
  db: NodePgDatabase<typeof schema>;
};

export const tenantAls = new AsyncLocalStorage<TenantBinding>();

// Pool/drizzle instances are reused per DB; ctx is request-scoped (never cached).
type PooledDb = { pool: pg.Pool; db: NodePgDatabase<typeof schema> };
const dbCache = new Map<string, PooledDb>();

function buildTenantUrl(dbName: string): string {
  const tmpl = process.env.TENANT_DB_URL_TEMPLATE;
  if (tmpl) return tmpl.replace("{db}", dbName);
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error("DATABASE_URL or TENANT_DB_URL_TEMPLATE must be set");
  return base.replace(/\/[^/?]+(\?|$)/, `/${dbName}$1`);
}

function getOrCreatePooledDb(dbName: string): PooledDb {
  const cached = dbCache.get(dbName);
  if (cached) return cached;
  const pool = new Pool({ connectionString: buildTenantUrl(dbName) });
  const db = drizzle(pool, { schema });
  const entry: PooledDb = { pool, db };
  dbCache.set(dbName, entry);
  return entry;
}

// Build a FRESH binding object per request so mutations to ctx (or concurrent
// requests) can never leak across async contexts.
export function createTenantBinding(ctx: TenantContext): TenantBinding {
  const { pool, db } = getOrCreatePooledDb(ctx.dbName);
  return { ctx, pool, db };
}

export function getCurrentTenant(): TenantContext | undefined {
  return tenantAls.getStore()?.ctx;
}
