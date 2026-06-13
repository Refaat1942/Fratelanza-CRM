import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

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
        if (body?.error === "tenant_blocked" || body?.error === "trial_expired") {
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
      const nextFeatures = data.features || {};
      setState(prev => {
        // Avoid creating a fresh object (and re-rendering every consumer) when the
        // poll returns identical data — that was stealing focus from inputs every 60s.
        const sameFeatures =
          Object.keys(nextFeatures).length === Object.keys(prev.features).length &&
          Object.keys(nextFeatures).every(k => prev.features[k] === nextFeatures[k]);
        const sameTenant =
          (prev.tenant?.subdomain ?? null) === (data.tenant?.subdomain ?? null) &&
          (prev.tenant?.status ?? null) === (data.tenant?.status ?? null);
        if (sameFeatures && sameTenant && !prev.blocked && !prev.loading) return prev;
        return { features: nextFeatures, tenant: data.tenant, blocked: false, loading: false };
      });
    } catch {
      setState(s => (s.loading ? { ...s, loading: false } : s));
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

  // Memo the context value so identical state references don't trigger consumer re-renders.
  const value = useMemo(() => state, [state]);
  return <FeaturesContext.Provider value={value}>{children}</FeaturesContext.Provider>;
}

export function useFeatures() {
  return useContext(FeaturesContext);
}

export function isFeatureEnabled(features: Record<string, boolean>, key: string): boolean {
  return features[key] !== false;
}
