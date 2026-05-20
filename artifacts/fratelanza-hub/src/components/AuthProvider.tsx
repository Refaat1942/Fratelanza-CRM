import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ForcePasswordChange } from "./ForcePasswordChange";

export type AuthUser = {
  id: number;
  username: string;
  role: string;
  permissions: string[];
  displayName?: string;
  mustChangePassword?: boolean;
} | null;
type AuthCtx = {
  user: AuthUser;
  loading: boolean;
  login: (u: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/auth/me", { credentials: "include" });
    const data = r.ok ? await r.json() : null;
    setUser(data);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Login failed"); }
    const data = await res.json();
    setUser(data);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
      {user?.mustChangePassword && (
        <ForcePasswordChange onChanged={refresh} onLogout={logout} />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
