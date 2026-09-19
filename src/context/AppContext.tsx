"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LANG_KEY, TOKEN_KEY, USER_KEY, api, apiError, clearSession } from "@/lib/api";
import { translate } from "@/lib/i18n";

export type Role = "CITIZEN" | "UNIVERSITY" | "INDUSTRY" | "FIELD_PERSON" | "ADMIN";

export type SessionUser = {
  id: number;
  email: string;
  role: Role;
  fullName: string;
  organizationName: string | null;
  language: string;
};

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };

type Ctx = {
  user: SessionUser | null;
  ready: boolean;
  language: string;
  setLanguage: (code: string) => void;
  t: (key: string) => string;
  login: (email: string, password: string) => Promise<SessionUser>;
  register: (payload: Record<string, unknown>) => Promise<SessionUser>;
  logout: () => void;
  toasts: Toast[];
  pushToast: (message: string, tone?: Toast["tone"]) => void;
};

const AppContext = createContext<Ctx | null>(null);

export const homeFor = (role: Role) =>
  role === "CITIZEN" ? "/citizen/dashboard"
  : role === "UNIVERSITY" ? "/university/dashboard"
  : role === "INDUSTRY" ? "/industry/dashboard"
  : role === "FIELD_PERSON" ? "/field/dashboard"
  : "/admin/dashboard";

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [language, setLanguageState] = useState("en");
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let cancelled = false;
    const lang = window.localStorage.getItem(LANG_KEY);
    if (lang) setLanguageState(lang);

    const token = window.localStorage.getItem(TOKEN_KEY);
    const raw = window.localStorage.getItem(USER_KEY);
    if (!token || !raw) {
      clearSession();
      setReady(true);
      return;
    }

    try {
      const cached = JSON.parse(raw) as SessionUser;
      if (cached?.id && cached?.role) setUser(cached);
    } catch {
      // ignore malformed cache and fall back to backend validation
    }

    api
      .get<{ data: { user: SessionUser } }>("/users/me")
      .then((res) => {
        if (cancelled) return;
        const u = res.data.data.user;
        const session: SessionUser = {
          id: u.id,
          email: u.email,
          role: u.role,
          fullName: u.fullName,
          organizationName: u.organizationName,
          language: u.language,
        };
        window.localStorage.setItem(USER_KEY, JSON.stringify(session));
        setUser(session);
      })
      .catch((error) => {
        if (cancelled) return;
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          clearSession();
          setUser(null);
        } else {
          try {
            const cached = window.localStorage.getItem(USER_KEY);
            if (cached) {
              const parsed = JSON.parse(cached) as SessionUser;
              if (parsed?.id && parsed?.role) setUser(parsed);
            }
          } catch {
            /* ignore */
          }
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const pushToast = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const setLanguage = useCallback((code: string) => {
    setLanguageState(code);
    window.localStorage.setItem(LANG_KEY, code);
  }, []);

  const persist = useCallback((token: string, u: SessionUser) => {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
    if (u.language) setLanguageState(u.language);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await api.post<{ data: { token: string; user: SessionUser } }>("/auth/login", {
          email,
          password,
          language: window.localStorage.getItem(LANG_KEY) ?? "en",
        });
        persist(res.data.data.token, res.data.data.user);
        return res.data.data.user;
      } catch (error) {
        throw new Error(apiError(error, "Login failed"));
      }
    },
    [persist],
  );

  const register = useCallback(
    async (payload: Record<string, unknown>) => {
      try {
        const res = await api.post<{ data: { token: string; user: SessionUser } }>("/auth/register", payload);
        persist(res.data.data.token, res.data.data.user);
        return res.data.data.user;
      } catch (error) {
        throw new Error(apiError(error, "Registration failed"));
      }
    },
    [persist],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo<Ctx>(
    () => ({
      user,
      ready,
      language,
      setLanguage,
      t: (key: string) => translate(language, key),
      login,
      register,
      logout,
      toasts,
      pushToast,
    }),
    [user, ready, language, setLanguage, login, register, logout, toasts, pushToast],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-80 flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${
              toast.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : toast.tone === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-slate-200 bg-white text-slate-800"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
