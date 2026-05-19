import React, { createContext, useContext, useEffect, useState } from "react";

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

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/features", { credentials: "include" })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 403) {
          const body = await res.json().catch(() => ({}));
          if (body?.error === "tenant_blocked") {
            setState({ features: {}, tenant: null, blocked: true, loading: false });
            return;
          }
        }
        if (res.status === 401) {
          // Not logged in yet — assume all features visible until login resolves.
          setState({ features: {}, tenant: null, blocked: false, loading: false });
          return;
        }
        if (!res.ok) {
          setState({ features: {}, tenant: null, blocked: false, loading: false });
          return;
        }
        const data = (await res.json()) as {
          tenant: { subdomain: string; status: "active" | "blocked" } | null;
          features: Record<string, boolean>;
        };
        setState({ features: data.features || {}, tenant: data.tenant, blocked: false, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ features: {}, tenant: null, blocked: false, loading: false });
      });
    return () => { cancelled = true; };
  }, []);

  return <FeaturesContext.Provider value={state}>{children}</FeaturesContext.Provider>;
}

export function useFeatures() {
  return useContext(FeaturesContext);
}

export function isFeatureEnabled(features: Record<string, boolean>, key: string): boolean {
  return features[key] !== false;
}
