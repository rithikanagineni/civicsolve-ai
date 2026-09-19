import { and, desc, eq, ne, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { challengeAiAnalysis, challengeMatches, challenges, projects, users } from "@/db/schema";

export type ChallengeSummary = {
  id: number;
  complaintCode: string;
  title: string;
  description: string;
  category: string;
  subcategory: string | null;
  location: string;
  status: string;
  priorityScore: number;
  priorityLevel: string;
  votes: number;
  peopleAffected: number;
  inputMethod: string;
  language: string;
  createdAt: string;
  citizenId: number;
  citizenName: string | null;
  requiredExpertise: string[];
  summary: string | null;
  matchedUniversity: string | null;
  matchedUniversityScore: number | null;
  acceptedUniversity: string | null;
  acceptedUniversityId: number | null;
  projectId: number | null;
  projectTitle: string | null;
  projectProgress: number | null;
};

export async function listChallengeSummaries(filters: {
  citizenId?: number;
  status?: string;
  category?: string;
  priorityLevel?: string;
} = {}): Promise<ChallengeSummary[]> {
  const conditions: SQL[] = [];
  if (filters.citizenId) conditions.push(eq(challenges.citizenId, filters.citizenId));
  if (filters.status) conditions.push(eq(challenges.status, filters.status));
  if (filters.category) conditions.push(eq(challenges.category, filters.category));
  if (filters.priorityLevel) conditions.push(eq(challenges.priorityLevel, filters.priorityLevel));

  const base = db
    .select({
      c: challenges,
      analysis: challengeAiAnalysis,
      project: projects,
      citizen: users,
    })
    .from(challenges)
    .leftJoin(challengeAiAnalysis, eq(challengeAiAnalysis.challengeId, challenges.id))
    .leftJoin(projects, eq(projects.challengeId, challenges.id))
    .leftJoin(users, eq(users.id, challenges.citizenId));

  const rows = await (conditions.length ? base.where(and(...conditions)) : base).orderBy(desc(challenges.createdAt));

  const matchRows = await db
    .select({
      challengeId: challengeMatches.challengeId,
      uniId: users.id,
      name: users.organizationName,
      fullName: users.fullName,
      score: challengeMatches.matchScore,
      status: challengeMatches.status,
    })
    .from(challengeMatches)
    .innerJoin(users, eq(users.id, challengeMatches.universityId))
    .where(ne(challengeMatches.status, "DECLINED"));

  const bestMatchMap = new Map<number, { challengeId: number; uniId: number; name: string | null; fullName: string | null; score: number }>();
  for (const row of matchRows) {
    const existing = bestMatchMap.get(row.challengeId);
    if (!existing || row.score > existing.score) {
      bestMatchMap.set(row.challengeId, row);
    }
  }

  const acceptedMap = new Map(
    matchRows.filter((r) => r.status === "ACCEPTED").map((r) => [r.challengeId, r]),
  );

  return rows.map(({ c, analysis, project, citizen }) => {
    const accepted = acceptedMap.get(c.id);
    const bestMatch = bestMatchMap.get(c.id);
    return {
      id: c.id,
      complaintCode: c.complaintCode,
      title: c.title,
      description: c.description,
      category: c.category,
      subcategory: c.subcategory,
      location: c.location,
      status: c.status,
      priorityScore: c.priorityScore,
      priorityLevel: c.priorityLevel,
      votes: c.votes,
      peopleAffected: c.peopleAffected,
      inputMethod: c.inputMethod,
      language: c.language,
      createdAt: new Date(c.createdAt).toISOString(),
      citizenId: c.citizenId,
      citizenName: citizen?.fullName ?? null,
      requiredExpertise: analysis?.requiredExpertise ?? [],
      summary: analysis?.summary ?? null,
      matchedUniversity: bestMatch ? (bestMatch.name ?? bestMatch.fullName ?? null) : null,
      matchedUniversityScore: bestMatch?.score ?? null,
      acceptedUniversity: accepted ? (accepted.name ?? accepted.fullName ?? null) : null,
      acceptedUniversityId: accepted?.uniId ?? null,
      projectId: project?.id ?? null,
      projectTitle: project?.title ?? null,
      projectProgress: project?.progress ?? null,
    };
  });
}
