const BASE = "/api";

const RESERVED = new Set(["www", "admin", "api", "app"]);

function tenantSubdomainHeader(): Record<string, string> {
  try {
    const host = window.location.hostname.toLowerCase();
    if (!host || host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return {};
    const parts = host.split(".");
    if (parts.length < 3) return {};
    const sub = parts[0]!;
    if (RESERVED.has(sub)) return {};
    return { "X-Tenant-Subdomain": sub };
  } catch {
    return {};
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const tenantHdr = tenantSubdomainHeader();
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: isFormData
      ? { ...tenantHdr, ...options?.headers }
      : { "Content-Type": "application/json", ...tenantHdr, ...options?.headers },
    ...options,
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (res.status === 403) {
    const body = await res.clone().json().catch(() => ({} as any));
    if (body?.error === "tenant_blocked") {
      window.dispatchEvent(new CustomEvent("tenant-blocked"));
      throw new Error("Subscription paused");
    }
    if (body?.error === "feature_disabled") {
      throw new Error(`Feature disabled: ${body.feature}`);
    }
  }
  if (!res.ok) {
    // Try to surface the real server error message instead of a generic "API error 500".
    const detail = await res.clone().json().catch(() => null) as any;
    const msg = detail?.error || detail?.message || (typeof detail?.details === "string" ? detail.details : null);
    throw new Error(msg ? `${msg} (${res.status})` : `API error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
