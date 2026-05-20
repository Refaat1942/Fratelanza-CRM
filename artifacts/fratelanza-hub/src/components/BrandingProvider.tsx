import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Branding = {
  companyName: string | null;
  companyNameAr: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
};

type Ctx = {
  branding: Branding;
  loading: boolean;
  refresh: () => Promise<void>;
};

const DEFAULT: Branding = { companyName: null, companyNameAr: null, logoUrl: null, primaryColor: null };
const BrandingContext = createContext<Ctx>({ branding: DEFAULT, loading: true, refresh: async () => {} });

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<Branding>(DEFAULT);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/branding/public", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setBranding({
          companyName: data.companyName || null,
          companyNameAr: data.companyNameAr || null,
          logoUrl: data.logoUrl || null,
          primaryColor: data.primaryColor || null,
        });
      }
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Apply custom primary color as a CSS variable override (optional).
  useEffect(() => {
    if (branding.primaryColor && /^#[0-9a-fA-F]{6}$/.test(branding.primaryColor)) {
      document.documentElement.style.setProperty("--brand-primary", branding.primaryColor);
    } else {
      document.documentElement.style.removeProperty("--brand-primary");
    }
  }, [branding.primaryColor]);

  return (
    <BrandingContext.Provider value={{ branding, loading, refresh }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

// Helper for components: returns the localized display name with a fallback.
export function useCompanyName(isAr: boolean, fallback = "Fratelanza"): string {
  const { branding } = useBranding();
  if (isAr) return branding.companyNameAr || branding.companyName || fallback;
  return branding.companyName || branding.companyNameAr || fallback;
}
