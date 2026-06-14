const BASE = "/api";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: isFormData ? { ...options?.headers } : { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (res.status === 403) {
    const body = await res.clone().json().catch(() => ({} as any));
    if (body?.error === "tenant_blocked" || body?.error === "trial_expired") {
      window.dispatchEvent(new CustomEvent("tenant-blocked"));
      throw new Error(body?.error === "trial_expired" ? "Trial ended" : "Subscription paused");
    }
    if (body?.error === "feature_disabled") {
      throw new Error(`Feature disabled: ${body.feature}`);
    }
    if (body?.error === "ai_not_configured") {
      throw new Error(body?.message || "AI is not configured on this server.");
    }
  }
  if (!res.ok) {
    const detail = await res.clone().json().catch(() => null) as any;
    const msg = detail?.message || detail?.error || (typeof detail?.details === "string" ? detail.details : null);
    throw new Error(msg ? `${msg} (${res.status})` : `API error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
