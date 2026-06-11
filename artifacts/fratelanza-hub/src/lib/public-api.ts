const BASE = "/api";

export async function publicApiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: "include" });
  if (!res.ok) {
    const detail = await res.clone().json().catch(() => null) as { error?: string } | null;
    throw new Error(detail?.error || `API error ${res.status}`);
  }
  return res.json();
}
