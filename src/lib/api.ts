"use client";

import axios from "axios";

export const TOKEN_KEY = "civicsolve_token";
export const USER_KEY = "civicsolve_user";
export const LANG_KEY = "civicsolve_lang";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
  // Serverless deployments and cold starts can take longer than the default 12s.
  timeout: 60000,
});

/** Has a persisted session (token or cached user) in localStorage. */
export function hasSession(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.localStorage.getItem(TOKEN_KEY) || !!window.localStorage.getItem(USER_KEY);
}

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Clears the stored session (token + user). */
export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

/**
 * Global 401 handling: if the JWT is missing/expired/invalid (for example after a
 * server restart or database reset) we drop the stale session and send the user
 * back to the login page instead of showing "Authentication required" everywhere.
 */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window !== "undefined" && axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? "";
      const isAuthCall = url.includes("/auth/login") || url.includes("/auth/register");
      if (!isAuthCall && hasSession()) {
        clearSession();
        const path = window.location.pathname;
        if (path !== "/login" && path !== "/register") {
          window.location.assign("/login?reason=expired");
        }
      }
    }
    return Promise.reject(error);
  },
);

export function apiError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (error.response?.status === 401) return "Your session has expired. Please sign in again.";
    if (data?.error) return data.error;
    if (error.code === "ERR_NETWORK") return "Cannot reach the CivicSolve API. It may be starting up — please retry in a few seconds.";
    if (error.code === "ECONNABORTED") return "The request timed out. The server may be starting up — please retry.";
  }
  return fallback;
}

export async function get<T>(url: string): Promise<T> {
  const res = await api.get<{ success: boolean; data: T }>(url);
  return res.data.data;
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.post<{ success: boolean; data: T }>(url, body ?? {});
  return res.data.data;
}

export async function put<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.put<{ success: boolean; data: T }>(url, body ?? {});
  return res.data.data;
}

export async function del<T>(url: string): Promise<T> {
  const res = await api.delete<{ success: boolean; data: T }>(url);
  return res.data.data;
}
