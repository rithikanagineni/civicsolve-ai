import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, challenges, projects, users } from "@/db/schema";
import { handleError, ok, badRequest } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { optionalString, parseId, readJson } from "@/server/dto/validate";

export async function GET(req: Request) {
  try {
    await requireAuth(req, ["ADMIN"]);
    const rows = await db.select().from(users).orderBy(desc(users.createdAt));
    const allChallenges = await db.select().from(challenges);
    const allProjects = await db.select().from(projects);
    return ok({
      users: rows.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        fullName: u.fullName,
        organizationName: u.organizationName,
        city: u.city,
        language: u.language,
        verificationStatus: u.verificationStatus,
        verificationDocType: u.verificationDocType,
        verificationDocuments: u.verificationDocuments,
        isSeed: u.isSeed,
        createdAt: u.createdAt,
        challenges: allChallenges.filter((c) => c.citizenId === u.id).length,
        projects: allProjects.filter((p) => p.universityId === u.id).length,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req, ["ADMIN"]);
    const body = await readJson(req);
    const userId = parseId(String(body.userId), "userId");
    const status = String(body.status ?? "").toUpperCase();
    if (!["VERIFIED", "REJECTED"].includes(status)) throw badRequest("Status must be VERIFIED or REJECTED");

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw badRequest("User not found");

    await db
      .update(users)
      .set({
        verificationStatus: status,
        verificationNotes: optionalString(body.notes, 2000) ?? user.verificationNotes ?? null,
        verifiedAt: status === "VERIFIED" ? new Date() : null,
      })
      .where(eq(users.id, userId));

    await db.insert(auditLogs).values({
      userId: auth.id,
      action: status === "VERIFIED" ? "USER_APPROVED" : "USER_REJECTED",
      entity: "users",
      entityId: userId,
      detail: `${user.email} marked as ${status.toLowerCase()}`,
    });

    return ok({
      success: true,
      status,
      userId,
      approvedBy: auth.id,
    });
  } catch (error) {
    return handleError(error);
  }
}
