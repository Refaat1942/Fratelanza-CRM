import React, { useEffect } from "react";

type ThemeContextType = { theme: "light"; toggleTheme: () => void };

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
    try { localStorage.setItem("theme", "light"); } catch {}
  }, []);
  return <>{children}</>;
}

export function useTheme(): ThemeContextType {
  return { theme: "light", toggleTheme: () => {} };
}
