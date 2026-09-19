import { eq } from "drizzle-orm";
import { db } from "@/db";
import { industryExpertise, universitiesExpertise, users } from "@/db/schema";
import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { optionalString, readJson, toInt, toStringArray } from "@/server/dto/validate";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    const [user] = await db.select().from(users).where(eq(users.id, auth.id)).limit(1);
    const [uniExp] = user.role === "UNIVERSITY"
      ? await db.select().from(universitiesExpertise).where(eq(universitiesExpertise.universityId, user.id)).limit(1)
      : [null];
    const [indExp] = user.role === "INDUSTRY"
      ? await db.select().from(industryExpertise).where(eq(industryExpertise.industryId, user.id)).limit(1)
      : [null];
    const { passwordHash: _ignored, ...safe } = user;
    void _ignored;
    return ok({ user: safe, universityExpertise: uniExp ?? null, industryExpertise: indExp ?? null });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAuth(req);
    const body = await readJson(req);
    await db
      .update(users)
      .set({
        fullName: optionalString(body.fullName, 160) ?? auth.fullName,
        organizationName: optionalString(body.organizationName, 180) ?? auth.organizationName,
        phone: optionalString(body.phone, 24),
        city: optionalString(body.city, 120),
        state: optionalString(body.state, 120),
        bio: optionalString(body.bio, 500),
        language: optionalString(body.language, 12) ?? auth.language,
      })
      .where(eq(users.id, auth.id));

    if (auth.role === "UNIVERSITY" && body.departments !== undefined) {
      await db
        .update(universitiesExpertise)
        .set({
          departments: toStringArray(body.departments),
          skills: toStringArray(body.skills),
          researchAreas: toStringArray(body.researchAreas),
          facultyExpertise: toStringArray(body.facultyExpertise),
          studentTeams: toInt(body.studentTeams, 2, 0, 500),
        })
        .where(eq(universitiesExpertise.universityId, auth.id));
    }
    if (auth.role === "INDUSTRY" && body.technologies !== undefined) {
      await db
        .update(industryExpertise)
        .set({
          technologies: toStringArray(body.technologies),
          domains: toStringArray(body.domains),
          supportTypes: toStringArray(body.supportTypes),
        })
        .where(eq(industryExpertise.industryId, auth.id));
    }
    const [user] = await db.select().from(users).where(eq(users.id, auth.id)).limit(1);
    const { passwordHash: _ignored, ...safe } = user;
    void _ignored;
    return ok({ user: safe });
  } catch (error) {
    return handleError(error);
  }
}
