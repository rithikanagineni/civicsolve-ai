import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { challengeMatches, challenges, industrySupport, projects, users } from "@/db/schema";
import { forbidden, handleError, notFound, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { createProjectForChallenge } from "@/server/service/projectService";
import { optionalString, parseId, readJson, toStringArray } from "@/server/dto/validate";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    const rows = await db
      .select({ p: projects, c: challenges, uni: users })
      .from(projects)
      .innerJoin(challenges, eq(challenges.id, projects.challengeId))
      .innerJoin(users, eq(users.id, projects.universityId))
      .orderBy(desc(projects.startedAt));

    const supportRows = await db
      .select({ s: industrySupport, ind: users })
      .from(industrySupport)
      .innerJoin(users, eq(users.id, industrySupport.industryId));

    let filtered = rows;
    if (auth.role === "UNIVERSITY") filtered = rows.filter((r) => r.p.universityId === auth.id);
    if (auth.role === "CITIZEN") filtered = rows.filter((r) => r.c.citizenId === auth.id);
    if (auth.role === "INDUSTRY") {
      const mine = new Set(supportRows.filter((s) => s.ind.id === auth.id).map((s) => s.s.projectId));
      const url = new URL(req.url);
      if (url.searchParams.get("scope") === "mine") filtered = rows.filter((r) => mine.has(r.p.id));
    }

    return ok({
      projects: filtered.map(({ p, c, uni }) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status,
        progress: p.progress,
        department: p.department,
        requiredTech: p.requiredTech,
        startedAt: p.startedAt,
        completedAt: p.completedAt,
        universityId: uni.id,
        universityName: uni.organizationName ?? uni.fullName,
        challengeId: c.id,
        complaintCode: c.complaintCode,
        challengeTitle: c.title,
        category: c.category,
        location: c.location,
        priorityLevel: c.priorityLevel,
        citizenId: c.citizenId,
        supporters: supportRows
          .filter((s) => s.s.projectId === p.id)
          .map((s) => ({
            id: s.s.id,
            industryId: s.ind.id,
            industryName: s.ind.organizationName ?? s.ind.fullName,
            supportType: s.s.supportType,
            status: s.s.status,
          })),
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req, ["UNIVERSITY", "ADMIN"]);
    const body = await readJson(req);
    const challengeId = parseId(String(body.challengeId), "challengeId");
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
    if (!challenge) throw notFound("Challenge not found");

    const accepted = await db
      .select()
      .from(challengeMatches)
      .where(inArray(challengeMatches.challengeId, [challengeId]));
    const mine = accepted.find((m) => m.universityId === auth.id && m.status === "ACCEPTED");
    if (!mine && auth.role !== "ADMIN") throw forbidden("Accept the challenge before creating a project");

    const project = await createProjectForChallenge({
      challengeId,
      universityId: auth.id,
      title: optionalString(body.title, 220),
      description: optionalString(body.description, 2000),
      department: optionalString(body.department, 120),
      requiredTech: toStringArray(body.requiredTech),
    });
    return ok({ project }, 201);
  } catch (error) {
    return handleError(error);
  }
}
