export async function publicApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, { credentials: "include", ...init });
  if (!res.ok) {
    const detail = await res.clone().json().catch(() => null) as { error?: string } | null;
    throw new Error(detail?.error || `API error ${res.status}`);
  }
  return res.json();
}

export async function publicApiPost<T>(path: string, body?: unknown): Promise<T> {
  return publicApiFetch<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}
