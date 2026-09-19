import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { forbidden, unauthorized } from "@/server/exception/http";

export type Role = "CITIZEN" | "UNIVERSITY" | "INDUSTRY" | "FIELD_PERSON" | "ADMIN";

export type AuthUser = {
  id: number;
  email: string;
  role: Role;
  fullName: string;
  organizationName: string | null;
  language: string;
};

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "civicsolve-dev-secret-change-me-in-production-32chars",
);

export const hashPassword = (raw: string) => bcrypt.hash(raw, 10);
export const verifyPassword = (raw: string, hash: string) => bcrypt.compare(raw, hash);

export async function signToken(payload: { sub: number; role: Role; email: string }) {
  return new SignJWT({ role: payload.role, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.sub))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

async function readToken(req: Request): Promise<number | null> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const { payload } = await jwtVerify(header.slice(7), secret);
    const id = Number(payload.sub);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

/** Extracts the authenticated user from the JWT and loads it from PostgreSQL. */
export async function currentUser(req: Request): Promise<AuthUser | null> {
  const id = await readToken(req);
  if (!id) return null;
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    role: row.role as Role,
    fullName: row.fullName,
    organizationName: row.organizationName,
    language: row.language,
  };
}

export async function requireAuth(req: Request, roles?: Role[]): Promise<AuthUser> {
  const user = await currentUser(req);
  if (!user) throw unauthorized();
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    throw forbidden(`This action requires role ${roles.join(" or ")}`);
  }
  return user;
}
