import type { Request, Response, NextFunction } from "express";
import { tenantAls, createTenantBinding, type TenantContext } from "@workspace/db";
import { freezeTenantOnRequest } from "../lib/tenantContext";

const ADMIN_API_URL = process.env.ADMIN_API_URL;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
// The X-Tenant-Subdomain header is a dev convenience that lets us bypass real
// DNS in Replit/local. It is NEVER honored in production unless explicitly
// opted in, otherwise any client could spoof tenant identity.
const ALLOW_TENANT_HEADER =
  process.env.NODE_ENV !== "production" || process.env.ALLOW_TENANT_HEADER === "1";
const RESERVED_SUBDOMAINS = new Set(["www", "admin", "api", "app"]);
// Short TTL so block/unblock (and feature toggle) changes take effect within
// a few seconds. 5s is small enough for SaaS blocking SLAs and large enough
// to absorb bursty request traffic without hammering the admin lookup endpoint.
const CACHE_TTL_MS = 5_000;

type CacheEntry = { ctx: TenantContext | null; expiresAt: number };
// Only successful lookups (including authoritative 404s) are cached — transient
// errors must not poison the cache and deny valid tenants.
const cache = new Map<string, CacheEntry>();

function extractSubdomain(hostname: string): string | null {
  const h = (hostname || "").toLowerCase();
  if (!h) return null;
  if (h === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(h)) return null;
  const parts = h.split(".");
  if (parts.length < 3) return null;
  const sub = parts[0];
  if (RESERVED_SUBDOMAINS.has(sub)) return null;
  return sub;
}

type LookupResult =
  | { kind: "ok"; ctx: TenantContext }
  | { kind: "not_found" }
  | { kind: "error" };

async function fetchTenant(subdomain: string): Promise<LookupResult> {
  if (!ADMIN_API_URL) return { kind: "error" };
  try {
    const headers: Record<string, string> = {};
    if (ADMIN_API_KEY) headers["x-admin-api-key"] = ADMIN_API_KEY;
    const res = await fetch(`${ADMIN_API_URL}/api/tenants/${encodeURIComponent(subdomain)}`, { headers });
    if (res.status === 404) return { kind: "not_found" };
    if (!res.ok) return { kind: "error" };
    const json = (await res.json()) as {
      subdomain: string;
      db_name: string;
      status: string;
      features: Record<string, boolean> | null;
    };
    return {
      kind: "ok",
      ctx: {
        subdomain: json.subdomain,
        dbName: json.db_name,
        status: json.status === "blocked" ? "blocked" : "active",
        features: json.features || {},
      },
    };
  } catch {
    return { kind: "error" };
  }
}

async function resolveTenant(subdomain: string): Promise<LookupResult> {
  const hit = cache.get(subdomain);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.ctx ? { kind: "ok", ctx: hit.ctx } : { kind: "not_found" };
  }
  const result = await fetchTenant(subdomain);
  if (result.kind === "ok") {
    cache.set(subdomain, { ctx: result.ctx, expiresAt: Date.now() + CACHE_TTL_MS });
  } else if (result.kind === "not_found") {
    cache.set(subdomain, { ctx: null, expiresAt: Date.now() + CACHE_TTL_MS });
  }
  // kind === "error" → do not cache, retry next request.
  return result;
}

function requestHostname(req: Request): string {
  const forwarded = req.header("x-forwarded-host");
  if (forwarded) return forwarded.split(",")[0]!.trim().toLowerCase();
  return (req.hostname || "").toLowerCase();
}

export function tenantMiddleware(req: Request, res: Response, next: NextFunction): void {
  const headerOverride = ALLOW_TENANT_HEADER
    ? (req.header("x-tenant-subdomain") || "").toLowerCase().trim()
    : "";
  const subdomain = headerOverride || extractSubdomain(requestHostname(req));

  // No subdomain → single-tenant mode (dev / direct IP). Use default DB.
  if (!subdomain || !ADMIN_API_URL) {
    next();
    return;
  }

  resolveTenant(subdomain)
    .then((result) => {
      if (result.kind === "not_found") {
        res.status(404).json({ error: "tenant_not_found", message: "This workspace is not configured. Contact your provider." });
        return;
      }
      if (result.kind === "error") {
        res.status(503).json({ error: "tenant_unavailable", message: "Workspace temporarily unavailable." });
        return;
      }
      const ctx = result.ctx;
      if (ctx.status === "blocked") {
        res.status(403).json({ error: "tenant_blocked", message: "Subscription paused. Please contact your provider to restore access." });
        return;
      }
      // Fresh binding per request — never share the binding object across requests.
      const binding = createTenantBinding(ctx);
      freezeTenantOnRequest(req, binding);
      tenantAls.run(binding, () => next());
    })
    .catch((err) => {
      req.log?.error?.({ err }, "tenant resolution failed");
      res.status(503).json({ error: "tenant_unavailable", message: "Workspace temporarily unavailable." });
    });
}
