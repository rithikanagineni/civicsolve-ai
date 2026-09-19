import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { challengeAiAnalysis, challenges, industryExpertise, industrySupport, projects, users } from "@/db/schema";
import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { scoreIndustry } from "@/server/matching/matchingEngine";

/** Projects recommended to the authenticated industry partner. */
export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req, ["INDUSTRY", "ADMIN"]);
    const [exp] = await db.select().from(industryExpertise).where(eq(industryExpertise.industryId, auth.id)).limit(1);
    const [me] = await db.select().from(users).where(eq(users.id, auth.id)).limit(1);

    const rows = await db
      .select({ p: projects, c: challenges, uni: users, analysis: challengeAiAnalysis })
      .from(projects)
      .innerJoin(challenges, eq(challenges.id, projects.challengeId))
      .innerJoin(users, eq(users.id, projects.universityId))
      .leftJoin(challengeAiAnalysis, eq(challengeAiAnalysis.challengeId, challenges.id))
      .orderBy(desc(projects.startedAt));

    const supports = await db.select().from(industrySupport);

    const data = rows.map(({ p, c, uni, analysis }) => {
      const requiredTech = p.requiredTech?.length ? p.requiredTech : analysis?.requiredExpertise ?? [];
      const { score, reasons } = scoreIndustry(requiredTech, c.category, {
        industryId: auth.id,
        name: me?.organizationName ?? "Industry",
        technologies: exp?.technologies ?? [],
        domains: exp?.domains ?? [],
        supportTypes: exp?.supportTypes ?? [],
        deploymentCapability: exp?.deploymentCapability ?? true,
        city: me?.city ?? null,
      });
      const mySupport = supports.find((s) => s.projectId === p.id && s.industryId === auth.id);
      return {
        projectId: p.id,
        title: p.title,
        status: p.status,
        progress: p.progress,
        universityName: uni.organizationName ?? uni.fullName,
        challengeId: c.id,
        complaintCode: c.complaintCode,
        challengeTitle: c.title,
        category: c.category,
        location: c.location,
        priorityLevel: c.priorityLevel,
        requiredTech,
        matchScore: score,
        reasons,
        mySupportStatus: mySupport?.status ?? null,
        mySupportId: mySupport?.id ?? null,
      };
    });
    data.sort((a, b) => b.matchScore - a.matchScore);
    return ok({ projects: data });
  } catch (error) {
    return handleError(error);
  }
}
