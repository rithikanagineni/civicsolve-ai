import { badRequest } from "@/server/exception/http";

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw badRequest("Request body must be valid JSON");
  }
}

export function requireString(value: unknown, field: string, opts: { min?: number; max?: number } = {}) {
  if (typeof value !== "string" || value.trim().length === 0) throw badRequest(`${field} is required`);
  const v = value.trim();
  if (opts.min && v.length < opts.min) throw badRequest(`${field} must be at least ${opts.min} characters`);
  if (opts.max && v.length > opts.max) throw badRequest(`${field} must be at most ${opts.max} characters`);
  return v;
}

export function optionalString(value: unknown, max = 500) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw badRequest("Invalid text value");
  return value.trim().slice(0, max);
}

export function requireEmail(value: unknown) {
  const email = requireString(value, "Email").toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw badRequest("Please enter a valid email address");
  return email;
}

export function toInt(value: unknown, fallback: number, min = 0, max = 10_000_000) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function parseId(value: string | undefined, field = "id") {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw badRequest(`Invalid ${field}`);
  return n;
}

export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string" && v.trim()).map((v) => (v as string).trim());
  if (typeof value === "string" && value.trim()) return value.split(",").map((v) => v.trim()).filter(Boolean);
  return [];
}
