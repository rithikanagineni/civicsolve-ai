import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { challengeAiAnalysis, challengeMatches, challenges, users } from "@/db/schema";
import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { ensureUniversityMatchesForOpenChallenges } from "@/server/service/challengeService";

/** Challenges recommended to the authenticated university (AI match score ranked). */
export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req, ["UNIVERSITY", "ADMIN"]);
    await ensureUniversityMatchesForOpenChallenges();
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? "RECOMMENDED";

    const rows = await db
      .select({ match: challengeMatches, c: challenges, analysis: challengeAiAnalysis, citizen: users })
      .from(challengeMatches)
      .innerJoin(challenges, eq(challenges.id, challengeMatches.challengeId))
      .leftJoin(challengeAiAnalysis, eq(challengeAiAnalysis.challengeId, challenges.id))
      .leftJoin(users, eq(users.id, challenges.citizenId))
      .where(
        auth.role === "ADMIN"
          ? ne(challengeMatches.status, "DECLINED")
          : and(eq(challengeMatches.universityId, auth.id), eq(challengeMatches.status, status)),
      )
      .orderBy(desc(challengeMatches.matchScore));

    return ok({
      matches: rows.map(({ match, c, analysis, citizen }) => ({
        matchId: match.id,
        matchScore: match.matchScore,
        reasons: match.reasons,
        matchStatus: match.status,
        acceptedAt: match.acceptedAt,
        challengeId: c.id,
        complaintCode: c.complaintCode,
        title: c.title,
        description: c.description,
        category: c.category,
        subcategory: c.subcategory,
        location: c.location,
        status: c.status,
        priorityLevel: c.priorityLevel,
        priorityScore: c.priorityScore,
        peopleAffected: c.peopleAffected,
        votes: c.votes,
        citizenName: citizen?.fullName ?? null,
        requiredExpertise: analysis?.requiredExpertise ?? [],
        summary: analysis?.summary ?? null,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}
