import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { handleError, ok, unauthorized } from "@/server/exception/http";
import { signToken, verifyPassword, type Role } from "@/server/security/auth";
import { optionalString, readJson, requireEmail, requireString } from "@/server/dto/validate";
import { ensureSeeded } from "@/server/seed/ensureSeeded";

const ADMIN_EMAIL = "rithikanagineni021@gmail.com";

export async function POST(req: Request) {
  try {
    await ensureSeeded();
    const body = await readJson(req);
    const email = requireEmail(body.email);
    const password = requireString(body.password, "Password");
    const language = optionalString(body.language, 12);

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) throw unauthorized("Invalid email or password");

    if (user.role === "ADMIN" && user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      throw unauthorized("Only the fixed platform administrator account can access the admin portal.");
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw unauthorized("Invalid email or password");

    if (user.role !== "ADMIN" && ["CITIZEN", "UNIVERSITY", "INDUSTRY"].includes(user.role) && user.verificationStatus !== "VERIFIED") {
      throw unauthorized("Your account is pending admin verification. Please wait for approval before logging in.");
    }

    if (language && language !== user.language) {
      await db.update(users).set({ language }).where(eq(users.id, user.id));
    }

    await db.insert(auditLogs).values({ userId: user.id, action: "LOGIN", entity: "users", entityId: user.id });
    const token = await signToken({ sub: user.id, role: user.role as Role, email: user.email });
    return ok({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        organizationName: user.organizationName,
        language: language ?? user.language,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
