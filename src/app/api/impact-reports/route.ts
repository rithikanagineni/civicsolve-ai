import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { challenges, citizenSatisfaction, impactReports, industrySupport, projects, users } from "@/db/schema";
import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";

export async function GET(req: Request) {
  try {
    await requireAuth(req);
    const rows = await db
      .select({ r: impactReports, p: projects, c: challenges, uni: users })
      .from(impactReports)
      .innerJoin(projects, eq(projects.id, impactReports.projectId))
      .innerJoin(challenges, eq(challenges.id, impactReports.challengeId))
      .innerJoin(users, eq(users.id, projects.universityId))
      .orderBy(desc(impactReports.createdAt));
    const supports = await db
      .select({ s: industrySupport, ind: users })
      .from(industrySupport)
      .innerJoin(users, eq(users.id, industrySupport.industryId));
    const feedback = await db.select().from(citizenSatisfaction);

    return ok({
      reports: rows.map(({ r, p, c, uni }) => ({
        id: r.id,
        projectId: p.id,
        challengeId: c.id,
        complaintCode: c.complaintCode,
        problem: c.title,
        solution: r.solution,
        university: uni.organizationName ?? uni.fullName,
        industries: supports
          .filter((s) => s.s.projectId === p.id)
          .map((s) => s.ind.organizationName ?? s.ind.fullName),
        location: c.location,
        peopleBenefited: r.peopleBenefited,
        implementationDate: r.implementationDate,
        durationDays: r.durationDays,
        satisfaction: feedback.find((f) => f.challengeId === c.id)?.rating ?? r.satisfaction,
        impactScore: r.impactScore,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}
