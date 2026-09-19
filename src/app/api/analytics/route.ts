import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { challenges, citizenSatisfaction, impactReports, industrySupport, projects, users } from "@/db/schema";
import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";

export async function GET(req: Request) {
  try {
    await requireAuth(req);

    const byCategory = await db
      .select({ name: challenges.category, value: sql<number>`count(*)::int` })
      .from(challenges)
      .groupBy(challenges.category);
    const byPriority = await db
      .select({ name: challenges.priorityLevel, value: sql<number>`count(*)::int` })
      .from(challenges)
      .groupBy(challenges.priorityLevel);
    const byStatus = await db
      .select({ name: challenges.status, value: sql<number>`count(*)::int` })
      .from(challenges)
      .groupBy(challenges.status);

    const allChallenges = await db.select().from(challenges);
    const allProjects = await db.select().from(projects);
    const supports = await db.select().from(industrySupport);
    const feedback = await db.select().from(citizenSatisfaction);
    const reports = await db.select().from(impactReports);

    const universities = await db
      .select({ id: users.id, name: users.organizationName, fullName: users.fullName })
      .from(users)
      .where(eq(users.role, "UNIVERSITY"));
    const industries = await db
      .select({ id: users.id, name: users.organizationName, fullName: users.fullName })
      .from(users)
      .where(eq(users.role, "INDUSTRY"));

    const universityParticipation = universities.map((u) => ({
      name: (u.name ?? u.fullName ?? "").slice(0, 22),
      projects: allProjects.filter((p) => p.universityId === u.id).length,
    }));
    const industryParticipation = industries.map((i) => ({
      name: (i.name ?? i.fullName ?? "").slice(0, 22),
      supports: supports.filter((s) => s.industryId === i.id).length,
    }));

    const completed = allProjects.filter((p) => p.completedAt);
    const avgResolutionDays = completed.length
      ? Math.round(
          completed.reduce(
            (acc, p) => acc + (new Date(p.completedAt as Date).getTime() - new Date(p.startedAt).getTime()) / 86400000,
            0,
          ) / completed.length,
        )
      : 0;

    const satisfactionDistribution = [1, 2, 3, 4, 5].map((star) => ({
      name: `${star}★`,
      value: feedback.filter((f) => f.rating === star).length,
    }));

    const monthly = new Map<string, { name: string; reported: number; solved: number }>();
    for (const c of allChallenges) {
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthly.get(key) ?? { name: key, reported: 0, solved: 0 };
      entry.reported += 1;
      if (["COMPLETED", "CITIZEN_VALIDATION"].includes(c.status)) entry.solved += 1;
      monthly.set(key, entry);
    }

    return ok({
      totals: {
        challenges: allChallenges.length,
        projects: allProjects.length,
        solved: allChallenges.filter((c) => ["COMPLETED", "CITIZEN_VALIDATION"].includes(c.status)).length,
        inProgress: allProjects.filter((p) => p.progress > 0 && p.progress < 100).length,
        universities: universities.length,
        industries: industries.length,
        citizens: (await db.select({ n: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "CITIZEN")))[0].n,
        votes: allChallenges.reduce((a, c) => a + c.votes, 0),
        peopleBenefited: reports.reduce((a, r) => a + r.peopleBenefited, 0),
        avgResolutionDays,
        avgSatisfaction: feedback.length
          ? Number((feedback.reduce((a, f) => a + f.rating, 0) / feedback.length).toFixed(2))
          : 0,
        avgPriority: allChallenges.length
          ? Math.round(allChallenges.reduce((a, c) => a + c.priorityScore, 0) / allChallenges.length)
          : 0,
      },
      byCategory,
      byPriority,
      byStatus,
      universityParticipation,
      industryParticipation,
      satisfactionDistribution,
      monthly: Array.from(monthly.values()).sort((a, b) => a.name.localeCompare(b.name)),
      topVoted: allChallenges
        .slice()
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 5)
        .map((c) => ({ name: c.complaintCode, votes: c.votes, title: c.title })),
    });
  } catch (error) {
    return handleError(error);
  }
}
