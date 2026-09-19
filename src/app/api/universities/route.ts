import { eq } from "drizzle-orm";
import { db } from "@/db";
import { universitiesExpertise, users } from "@/db/schema";
import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";

export async function GET(req: Request) {
  try {
    await requireAuth(req);
    const rows = await db
      .select({ user: users, exp: universitiesExpertise })
      .from(users)
      .leftJoin(universitiesExpertise, eq(universitiesExpertise.universityId, users.id))
      .where(eq(users.role, "UNIVERSITY"));
    return ok({
      universities: rows.map(({ user, exp }) => ({
        id: user.id,
        name: user.organizationName ?? user.fullName,
        city: user.city,
        state: user.state,
        departments: exp?.departments ?? [],
        researchAreas: exp?.researchAreas ?? [],
        skills: exp?.skills ?? [],
        studentTeams: exp?.studentTeams ?? 0,
        previousProjects: exp?.previousProjects ?? 0,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}
