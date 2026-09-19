import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  challengeAiAnalysis,
  challengeDuplicates,
  challengeLifecycleEvents,
  challengeMatches,
  challengeVotes,
  challenges,
  industryExpertise,
  industrySupport,
  projectMilestones,
  projectProgressUpdates,
  projects,
  teamMembers,
  universitiesExpertise,
  users,
} from "@/db/schema";
import { analyzeProblem, similarityScore } from "@/server/ai/analysisEngine";
import { scoreIndustry, scoreUniversity } from "@/server/matching/matchingEngine";
import { notify } from "@/server/service/notificationService";
import { createProjectForChallenge, logLifecycle } from "@/server/service/projectService";
import { conflict, notFound } from "@/server/exception/http";
import { geocodeLocation, normalizeCoordinates } from "@/server/service/geocodingService";

export type CreateChallengeInput = {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  location: string;
  landmark?: string;
  severity?: string;
  durationDays?: number;
  peopleAffected?: number;
  imageUrl?: string;
  language?: string;
  inputMethod?: string;
  originalLanguage?: string;
  originalText?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  locationDescription?: string;
  attachmentUrls?: { images?: string[]; videos?: string[]; documents?: string[] };
};

export async function nextComplaintCode(): Promise<string> {
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(challenges);
  const year = new Date().getFullYear();
  const seq = Number(row?.n ?? 0) + 1;
  return `CS-${year}-${String(seq).padStart(5, "0")}`;
}

export async function createChallenge(citizenId: number, dto: CreateChallengeInput) {
  const complaintCode = await nextComplaintCode();

  // Validate or geocode coordinates
  let coords = normalizeCoordinates(dto.latitude, dto.longitude);
  if (!coords && dto.location) {
    const geo = await geocodeLocation(dto.location, dto.landmark);
    if (geo) {
      coords = { latitude: geo.latitude, longitude: geo.longitude };
    }
  }

  const [challenge] = await db
    .insert(challenges)
    .values({
      complaintCode,
      citizenId,
      title: dto.title.trim(),
      description: dto.description.trim(),
      category: dto.category,
      subcategory: dto.subcategory ?? null,
      location: dto.location.trim(),
      landmark: dto.landmark ?? null,
      address: dto.address ?? null,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      locationDescription: dto.locationDescription ?? null,
      attachmentUrls: dto.attachmentUrls ?? {},
      severity: (dto.severity ?? "MEDIUM").toUpperCase(),
      durationDays: dto.durationDays ?? 7,
      peopleAffected: dto.peopleAffected ?? 50,
      imageUrl: dto.imageUrl ?? null,
      language: dto.language ?? "en",
      inputMethod: (dto.inputMethod ?? "TEXT").toUpperCase(),
      originalLanguage: dto.originalLanguage ?? dto.language ?? "en",
      originalText: dto.originalText ?? dto.description,
      status: "REPORTED",
    })
    .returning();

  await logLifecycle(challenge.id, "REPORTED", `Problem reported by citizen (${challenge.inputMethod} input).`, citizenId);
  await notify({
    userId: citizenId,
    title: "Problem submitted",
    message: `Your problem has been registered with complaint code ${complaintCode}.`,
    type: "CHALLENGE_CREATED",
    link: `/citizen/problems/${challenge.id}`,
  });

  const analysis = await runAnalysis(challenge.id);
  const duplicates = await detectDuplicates(challenge.id);
  const matches = await generateMatches(challenge.id);
  const [fresh] = await db.select().from(challenges).where(eq(challenges.id, challenge.id)).limit(1);
  return { challenge: fresh, analysis, duplicates, matches };
}

export async function runAnalysis(challengeId: number) {
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  if (!challenge) throw notFound("Challenge not found");

  const analysis = await analyzeProblem({
    title: challenge.title,
    description: challenge.description,
    category: challenge.category,
    location: challenge.location,
    severity: challenge.severity,
    durationDays: challenge.durationDays,
    peopleAffected: challenge.peopleAffected,
    votes: challenge.votes,
  });

  await db.delete(challengeAiAnalysis).where(eq(challengeAiAnalysis.challengeId, challengeId));
  const [saved] = await db
    .insert(challengeAiAnalysis)
    .values({
      challengeId,
      category: analysis.category,
      subcategory: analysis.subcategory,
      summary: analysis.summary,
      impact: analysis.impact,
      severityScore: analysis.severityScore,
      urgencyScore: analysis.urgencyScore,
      peopleScore: analysis.peopleScore,
      durationScore: analysis.durationScore,
      safetyScore: analysis.safetyScore,
      geoScore: analysis.geoScore,
      votesScore: analysis.votesScore,
      priorityScore: analysis.priorityScore,
      priorityLevel: analysis.priorityLevel,
      requiredExpertise: analysis.requiredExpertise,
      keywords: analysis.keywords,
      confidence: analysis.confidence,
      engine: analysis.engine,
    })
    .returning();

  const keepStatus = ["REPORTED", "AI_ANALYZED", "PRIORITIZED"].includes(challenge.status);
  await db
    .update(challenges)
    .set({
      category: analysis.category,
      subcategory: analysis.subcategory,
      priorityScore: analysis.priorityScore,
      priorityLevel: analysis.priorityLevel,
      status: keepStatus ? "PRIORITIZED" : challenge.status,
      updatedAt: new Date(),
    })
    .where(eq(challenges.id, challengeId));

  await logLifecycle(challengeId, "AI_ANALYZED", `AI classified the problem as ${analysis.category} / ${analysis.subcategory} (engine: ${analysis.engine}).`);
  await logLifecycle(challengeId, "PRIORITIZED", `AI-assisted priority recommendation: ${analysis.priorityLevel} (${analysis.priorityScore}/100).`);
  await notify({
    userId: challenge.citizenId,
    title: "AI analysis completed",
    message: `${challenge.complaintCode} classified as ${analysis.category} / ${analysis.subcategory} with ${analysis.priorityLevel} priority (${analysis.priorityScore}/100).`,
    type: "AI_ANALYSIS",
    link: `/citizen/problems/${challengeId}`,
  });
  return { ...saved, factors: analysis.factors };
}

export async function detectDuplicates(challengeId: number) {
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  if (!challenge) throw notFound("Challenge not found");
  const others = await db.select().from(challenges).where(ne(challenges.id, challengeId));

  await db.delete(challengeDuplicates).where(eq(challengeDuplicates.challengeId, challengeId));
  const found: { relatedChallengeId: number; similarity: number; complaintCode: string; title: string }[] = [];
  for (const other of others) {
    const similarity = similarityScore(challenge, other);
    if (similarity >= 45) {
      found.push({ relatedChallengeId: other.id, similarity, complaintCode: other.complaintCode, title: other.title });
    }
  }
  found.sort((a, b) => b.similarity - a.similarity);
  const top = found.slice(0, 5);
  if (top.length) {
    await db.insert(challengeDuplicates).values(
      top.map((d) => ({ challengeId, relatedChallengeId: d.relatedChallengeId, similarity: d.similarity, status: "FLAGGED" })),
    );
    await logLifecycle(challengeId, "PRIORITIZED", `${top.length} possible duplicate(s) flagged for review (top similarity ${top[0].similarity}%).`);
  }
  return top;
}

export async function listRegisteredUniversityMatches(challengeId: number) {
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  if (!challenge) throw notFound("Challenge not found");
  const [analysis] = await db.select().from(challengeAiAnalysis).where(eq(challengeAiAnalysis.challengeId, challengeId)).limit(1);
  const requiredExpertise = analysis?.requiredExpertise ?? [];

  const rows = await db
    .select({ user: users, exp: universitiesExpertise })
    .from(users)
    .leftJoin(universitiesExpertise, eq(universitiesExpertise.universityId, users.id))
    .where(eq(users.role, "UNIVERSITY"));

  const scored = rows
    .map(({ user, exp }) => {
      const { score, reasons } = scoreUniversity(requiredExpertise, challenge.category, challenge.location, {
        universityId: user.id,
        name: user.organizationName ?? user.fullName,
        departments: exp?.departments ?? [],
        skills: exp?.skills ?? [],
        researchAreas: exp?.researchAreas ?? [],
        facultyExpertise: exp?.facultyExpertise ?? [],
        studentTeams: exp?.studentTeams ?? 0,
        previousProjects: exp?.previousProjects ?? 0,
        city: user.city,
      });
      return { universityId: user.id, universityName: user.organizationName ?? user.fullName, score, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return scored;
}

export async function generateMatches(challengeId: number) {
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  if (!challenge) throw notFound("Challenge not found");

  const recommended = await listRegisteredUniversityMatches(challengeId);
  const existing = await db.select().from(challengeMatches).where(eq(challengeMatches.challengeId, challengeId));
  const existingByUniversity = new Map(existing.map((match) => [match.universityId, match]));
  const newlyMatched: typeof recommended = [];

  for (const candidate of recommended) {
    const previous = existingByUniversity.get(candidate.universityId);
    // An accepted or declined decision is historical state and must never be
    // replaced by a fresh AI score.
    if (previous?.status === "ACCEPTED" || previous?.status === "DECLINED") continue;
    if (previous) {
      await db.update(challengeMatches).set({ matchScore: candidate.score, reasons: candidate.reasons, status: "RECOMMENDED" }).where(eq(challengeMatches.id, previous.id));
    } else {
      await db.insert(challengeMatches).values({ challengeId, universityId: candidate.universityId, matchScore: candidate.score, reasons: candidate.reasons, status: "RECOMMENDED" });
      newlyMatched.push(candidate);
    }
  }

  if (recommended.length && ["REPORTED", "AI_ANALYZED", "PRIORITIZED"].includes(challenge.status)) {
    await db.update(challenges).set({ status: "UNIVERSITY_MATCHED", updatedAt: new Date() }).where(eq(challenges.id, challengeId));
    await logLifecycle(challengeId, "UNIVERSITY_MATCHED", `${recommended.length} university recommendation(s) generated from required expertise.`);
  }
  await Promise.all(newlyMatched.map((candidate) => notify({
    userId: candidate.universityId,
    title: "New AI-recommended civic problem",
    message: `${challenge.complaintCode}: ${challenge.title} matches your university expertise (${candidate.score}%).`,
    type: "UNIVERSITY_MATCH",
    link: "/university/challenges",
  })));
  return recommended;
}

/** Makes legacy reports visible after this workflow is introduced without
 * duplicating records or overwriting accepted/declined decisions. */
export async function ensureUniversityMatchesForOpenChallenges() {
  const rows = await db.select({ id: challenges.id }).from(challenges);
  for (const row of rows) {
    const [existing] = await db.select({ id: challengeMatches.id }).from(challengeMatches).where(eq(challengeMatches.challengeId, row.id)).limit(1);
    if (!existing) await generateMatches(row.id);
  }
}

export async function acceptChallenge(
  challengeId: number,
  universityId: number,
  department?: string,
  teamInput?: Array<{ name?: string; role?: string; email?: string; expertise?: string; phone?: string }>,
) {
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  if (!challenge) throw notFound("Challenge not found");

  const [uni] = await db.select().from(users).where(eq(users.id, universityId)).limit(1);
  const preparedTeam = await db.select({ id: teamMembers.id }).from(teamMembers).where(and(eq(teamMembers.challengeId, challengeId), eq(teamMembers.universityId, universityId), eq(teamMembers.status, "ACTIVE"))).limit(1);
  const suppliedTeam = (teamInput ?? []).filter((m) => m.name || m.role || m.email).length;
  
  const effectiveTeamInput = preparedTeam.length > 0 || suppliedTeam > 0
    ? teamInput
    : [{ name: uni?.fullName ?? "University Coordinator", role: "Project Coordinator", email: uni?.email ?? undefined, expertise: "Institutional Project Lead" }];

  const existingAccept = await db
    .select()
    .from(challengeMatches)
    .where(and(eq(challengeMatches.challengeId, challengeId), eq(challengeMatches.status, "ACCEPTED")));
  if (existingAccept.length > 0) throw conflict("This challenge has already been accepted by a university.");

  const [match] = await db
    .select()
    .from(challengeMatches)
    .where(and(eq(challengeMatches.challengeId, challengeId), eq(challengeMatches.universityId, universityId)))
    .limit(1);

  if (match) {
    await db
      .update(challengeMatches)
      .set({ status: "ACCEPTED", acceptedAt: new Date() })
      .where(eq(challengeMatches.id, match.id));
  } else {
    await db.insert(challengeMatches).values({
      challengeId,
      universityId,
      matchScore: 70,
      reasons: ["Directly accepted by the university"],
      status: "ACCEPTED",
      acceptedAt: new Date(),
    });
  }

  const [exp] = await db.select().from(universitiesExpertise).where(eq(universitiesExpertise.universityId, universityId)).limit(1);
  const [analysis] = await db.select().from(challengeAiAnalysis).where(eq(challengeAiAnalysis.challengeId, challengeId)).limit(1);

  await db.update(challenges).set({ status: "UNIVERSITY_ACCEPTED", updatedAt: new Date() }).where(eq(challenges.id, challengeId));
  await logLifecycle(challengeId, "UNIVERSITY_ACCEPTED", `${uni?.organizationName ?? "University"} accepted the challenge.`, universityId);
  await db.insert(auditLogs).values({ userId: universityId, action: "UNIVERSITY_ACCEPTED", entity: "challenges", entityId: challengeId, detail: "University accepted problem for field verification." });
  
  await notify({
    userId: challenge.citizenId,
    title: "Your challenge has been accepted",
    message: `Your challenge ${challenge.complaintCode} has been accepted by ${uni?.organizationName ?? "a university"}.`,
    type: "CHALLENGE_ACCEPTED",
    link: `/citizen/problems/${challengeId}`,
  });
  await notify({
    userId: universityId,
    title: "Challenge accepted",
    message: `You accepted ${challenge.complaintCode} — "${challenge.title}". Field verification is now enabled.`,
    type: "CHALLENGE_ACCEPTED",
    link: `/challenges/${challengeId}`,
  });

  const project = await createProjectForChallenge({
    challengeId,
    universityId,
    department: department ?? exp?.departments?.[0] ?? undefined,
    requiredTech: analysis?.requiredExpertise ?? [],
    teamMembers: effectiveTeamInput,
  });
  const { teamMembers: managedTeamMembers } = await import("@/db/schema");
  await db.update(managedTeamMembers).set({ projectId: project.id, updatedAt: new Date() }).where(and(eq(managedTeamMembers.challengeId, challengeId), eq(managedTeamMembers.universityId, universityId)));
  
  await db.update(challenges).set({ status: "FIELD_VERIFICATION_PENDING", updatedAt: new Date() }).where(eq(challenges.id, challengeId));
  await logLifecycle(challengeId, "FIELD_VERIFICATION_PENDING", "Awaiting assignment of a field person for physical verification.", universityId);
  return { project };
}

export async function voteChallenge(challengeId: number, citizenId: number) {
  const existing = await db
    .select()
    .from(challengeVotes)
    .where(and(eq(challengeVotes.challengeId, challengeId), eq(challengeVotes.citizenId, citizenId)))
    .limit(1);
  if (existing.length > 0) throw conflict("You have already supported this problem.");
  await db.insert(challengeVotes).values({ challengeId, citizenId });
  const [updated] = await db
    .update(challenges)
    .set({ votes: sql`${challenges.votes} + 1`, updatedAt: new Date() })
    .where(eq(challenges.id, challengeId))
    .returning();
  return updated;
}

/** Full challenge aggregate — one challenge ID connects everything. */
export async function getChallengeDetail(challengeId: number) {
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  if (!challenge) throw notFound("Challenge not found");

  const [citizen] = await db.select().from(users).where(eq(users.id, challenge.citizenId)).limit(1);
  const [analysis] = await db.select().from(challengeAiAnalysis).where(eq(challengeAiAnalysis.challengeId, challengeId)).limit(1);

  const duplicateRows = await db
    .select({ dup: challengeDuplicates, other: challenges })
    .from(challengeDuplicates)
    .innerJoin(challenges, eq(challenges.id, challengeDuplicates.relatedChallengeId))
    .where(eq(challengeDuplicates.challengeId, challengeId));

  const matchRows = await db
    .select({ match: challengeMatches, uni: users })
    .from(challengeMatches)
    .innerJoin(users, eq(users.id, challengeMatches.universityId))
    .where(eq(challengeMatches.challengeId, challengeId))
    .orderBy(desc(challengeMatches.matchScore));

  const registeredMatches = matchRows.length === 0 ? await listRegisteredUniversityMatches(challengeId) : [];

  const events = await db
    .select()
    .from(challengeLifecycleEvents)
    .where(eq(challengeLifecycleEvents.challengeId, challengeId))
    .orderBy(challengeLifecycleEvents.createdAt);

  const [project] = await db.select().from(projects).where(eq(projects.challengeId, challengeId)).limit(1);

  let milestones: (typeof projectMilestones.$inferSelect)[] = [];
  let updates: (typeof projectProgressUpdates.$inferSelect)[] = [];
  let supports: { support: typeof industrySupport.$inferSelect; industry: typeof users.$inferSelect }[] = [];
  if (project) {
    milestones = await db.select().from(projectMilestones).where(eq(projectMilestones.projectId, project.id)).orderBy(projectMilestones.sortOrder);
    updates = await db.select().from(projectProgressUpdates).where(eq(projectProgressUpdates.projectId, project.id)).orderBy(desc(projectProgressUpdates.createdAt));
    supports = await db
      .select({ support: industrySupport, industry: users })
      .from(industrySupport)
      .innerJoin(users, eq(users.id, industrySupport.industryId))
      .where(eq(industrySupport.projectId, project.id));
  }

  const acceptedMatch = matchRows.find((m) => m.match.status === "ACCEPTED");
  const matchesList = matchRows.length > 0
    ? matchRows.map((m) => ({
        id: m.match.id,
        universityId: m.uni.id,
        universityName: m.uni.organizationName ?? m.uni.fullName,
        city: m.uni.city,
        matchScore: m.match.matchScore,
        reasons: m.match.reasons,
        status: m.match.status,
        acceptedAt: m.match.acceptedAt,
      }))
    : registeredMatches.map((m) => ({
        id: m.universityId,
        universityId: m.universityId,
        universityName: m.universityName,
        city: null,
        matchScore: m.score,
        reasons: m.reasons,
        status: "REGISTERED",
        acceptedAt: null,
      }));

  return {
    challenge,
    citizen: citizen ? { id: citizen.id, name: citizen.fullName, city: citizen.city } : null,
    analysis: analysis ?? null,
    duplicates: duplicateRows.map((d) => ({
      id: d.dup.id,
      similarity: d.dup.similarity,
      status: d.dup.status,
      relatedChallengeId: d.other.id,
      complaintCode: d.other.complaintCode,
      title: d.other.title,
    })),
    matches: matchesList,
    acceptedBy: acceptedMatch
      ? { universityId: acceptedMatch.uni.id, name: acceptedMatch.uni.organizationName ?? acceptedMatch.uni.fullName }
      : null,
    lifecycle: events,
    project: project ?? null,
    milestones,
    progressUpdates: updates,
    industrySupport: supports.map((s) => ({
      id: s.support.id,
      industryId: s.industry.id,
      industryName: s.industry.organizationName ?? s.industry.fullName,
      supportType: s.support.supportType,
      description: s.support.description,
      status: s.support.status,
      matchScore: s.support.matchScore,
      reasons: s.support.reasons,
    })),
    field: await (async () => {
      const { fieldDataForChallenge } = await import("@/server/service/fieldService");
      return fieldDataForChallenge(challengeId);
    })(),
  };
}

/** Industry recommendations for a project (technology / domain / support fit). */
export async function recommendIndustries(projectId: number) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw notFound("Project not found");
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, project.challengeId)).limit(1);
  const [analysis] = challenge
    ? await db.select().from(challengeAiAnalysis).where(eq(challengeAiAnalysis.challengeId, challenge.id)).limit(1)
    : [undefined];
  const requiredTech = project.requiredTech?.length ? project.requiredTech : analysis?.requiredExpertise ?? [];

  const inds = await db
    .select({ user: users, exp: industryExpertise })
    .from(users)
    .leftJoin(industryExpertise, eq(industryExpertise.industryId, users.id))
    .where(eq(users.role, "INDUSTRY"));

  return inds
    .map(({ user, exp }) => {
      const { score, reasons } = scoreIndustry(requiredTech, challenge?.category ?? "", {
        industryId: user.id,
        name: user.organizationName ?? user.fullName,
        technologies: exp?.technologies ?? [],
        domains: exp?.domains ?? [],
        supportTypes: exp?.supportTypes ?? [],
        deploymentCapability: exp?.deploymentCapability ?? true,
        city: user.city,
      });
      return { industryId: user.id, name: user.organizationName ?? user.fullName, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
}
