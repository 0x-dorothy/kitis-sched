"use client";

// Контекст авторизации: /api/auth/me + login/register/logout.
// Гость видит всё, кроме избранного в облаке.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface User {
  id: number;
  email: string;
  name: string;
  groupName: string;
  curator: string;
}

interface AuthCtx {
  user: User | null;
  dbConfigured: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    group: string;
    curator: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth вне AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbConfigured, setDbConfigured] = useState(true);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      setUser(data.user ?? null);
      setDbConfigured(!!data.dbConfigured);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handle = useCallback(async (url: string, body: Record<string, unknown>) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message ?? "Ошибка запроса");
    setUser(data.user ?? null);
  }, []);

  const login = useCallback(
    (email: string, password: string) => handle("/api/auth/login", { email, password }),
    [handle]
  );

  const register = useCallback(
    (data: { email: string; password: string; name: string; group: string; curator: string }) =>
      handle("/api/auth/register", data),
    [handle]
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, dbConfigured, loading, refresh, login, register, logout }}>
      {children}
    </Ctx.Provider>
  );
}
