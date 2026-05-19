import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";
import { tenantAls } from "./tenant.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const defaultPool: pg.Pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const defaultDb: NodePgDatabase<typeof schema> = drizzle(defaultPool, { schema });

function activeDb(): NodePgDatabase<typeof schema> {
  return tenantAls.getStore()?.db ?? defaultDb;
}

function activePool(): pg.Pool {
  return tenantAls.getStore()?.pool ?? defaultPool;
}

// Proxy that delegates every access to the current tenant's drizzle instance,
// or falls back to the default DB when no tenant context is active (dev / startup).
export const db: NodePgDatabase<typeof schema> = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop) {
    const target = activeDb() as unknown as Record<string | symbol, unknown>;
    const value = target[prop];
    return typeof value === "function" ? (value as Function).bind(target) : value;
  },
});

export const pool: pg.Pool = new Proxy({} as pg.Pool, {
  get(_target, prop) {
    const target = activePool() as unknown as Record<string | symbol, unknown>;
    const value = target[prop];
    return typeof value === "function" ? (value as Function).bind(target) : value;
  },
});

export * from "./schema/index.js";
export { tenantAls, getCurrentTenant, createTenantBinding, type TenantContext, type TenantBinding } from "./tenant.js";
