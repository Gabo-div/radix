import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { User } from "../types";
import { api, setToken, getToken } from "../lib/api";
import { getRedirectPath } from "../lib/rbac";

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  login: (role: string) => Promise<string>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("radix_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setTokenState] = useState<string | null>(getToken());

  const login = useCallback(async (role: string): Promise<string> => {
    const res = await api.login(role);
    setToken(res.token);
    setTokenState(res.token);
    setCurrentUser(res.user);
    localStorage.setItem("radix_user", JSON.stringify(res.user));
    return getRedirectPath(res.user.role);
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch { /* ignore */ }
    setToken(null);
    setTokenState(null);
    setCurrentUser(null);
    localStorage.removeItem("radix_user");
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, token, login, logout, isAuthenticated: !!currentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
