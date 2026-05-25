import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

type FeaturesState = {
  features: Record<string, boolean>;
  tenant: { subdomain: string; status: "active" | "blocked" } | null;
  blocked: boolean;
  loading: boolean;
};

const FeaturesContext = createContext<FeaturesState>({
  features: {},
  tenant: null,
  blocked: false,
  loading: true,
});

export function FeaturesProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FeaturesState>({
    features: {},
    tenant: null,
    blocked: false,
    loading: true,
  });

  const refresh = useCallback(async () => {
    try {
      // Cache-busting query param + no-store so admin toggles take effect immediately.
      const res = await fetch(`/api/me/features?t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 403) {
        const body = await res.json().catch(() => ({}));
        if (body?.error === "tenant_blocked") {
          setState({ features: {}, tenant: null, blocked: true, loading: false });
          return;
        }
      }
      if (res.status === 401) {
        setState({ features: {}, tenant: null, blocked: false, loading: false });
        return;
      }
      if (!res.ok) {
        setState(s => ({ ...s, loading: false }));
        return;
      }
      const data = (await res.json()) as {
        tenant: { subdomain: string; status: "active" | "blocked" } | null;
        features: Record<string, boolean>;
      };
      setState({ features: data.features || {}, tenant: data.tenant, blocked: false, loading: false });
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    refresh();
    // Refetch when user returns to the tab (catches admin-side toggle changes fast).
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    // Periodic refresh every 60s as a safety net.
    const interval = window.setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [refresh]);

  return <FeaturesContext.Provider value={state}>{children}</FeaturesContext.Provider>;
}

export function useFeatures() {
  return useContext(FeaturesContext);
}

export function isFeatureEnabled(features: Record<string, boolean>, key: string): boolean {
  return features[key] !== false;
}
