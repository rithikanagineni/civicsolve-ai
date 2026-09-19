import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  challengeLifecycleEvents,
  challenges,
  impactReports,
  industrySupport,
  projectMembers,
  projectMilestones,
  projectProgressUpdates,
  projects,
  users,
} from "@/db/schema";
import { notify } from "@/server/service/notificationService";
import { badRequest, notFound } from "@/server/exception/http";

export const DEFAULT_MILESTONES = [
  { title: "Problem Validation", description: "Field visit and validation of the reported civic problem with the citizen.", percentage: 10 },
  { title: "Requirement Analysis", description: "Stakeholder interviews, constraints, data collection and requirement specification.", percentage: 20 },
  { title: "Solution Design", description: "Engineering design, architecture and feasibility review with faculty mentors.", percentage: 35 },
  { title: "Prototype Development", description: "Build the working prototype with student teams and industry mentors.", percentage: 55 },
  { title: "Testing", description: "Lab and controlled field testing, safety and compliance verification.", percentage: 70 },
  { title: "Field Implementation", description: "On-ground deployment at the reported location with local authorities.", percentage: 90 },
  { title: "Final Validation", description: "Impact measurement and citizen validation of the delivered solution.", percentage: 100 },
];

export async function logLifecycle(challengeId: number, stage: string, note: string, actorId?: number) {
  await db.insert(challengeLifecycleEvents).values({ challengeId, stage, note, actorId: actorId ?? null });
}

export async function createProjectForChallenge(params: {
  challengeId: number;
  universityId: number;
  title?: string;
  description?: string;
  department?: string;
  requiredTech?: string[];
  teamMembers?: Array<{ name?: string; role?: string; email?: string; expertise?: string; phone?: string }>;
}) {
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, params.challengeId)).limit(1);
  if (!challenge) throw notFound("Challenge not found");

  const existing = await db.select().from(projects).where(eq(projects.challengeId, params.challengeId)).limit(1);
  if (existing.length > 0) return existing[0];

  const [uni] = await db.select().from(users).where(eq(users.id, params.universityId)).limit(1);

  const [project] = await db
    .insert(projects)
    .values({
      challengeId: params.challengeId,
      universityId: params.universityId,
      title: params.title ?? `Smart ${challenge.subcategory ?? challenge.category} Initiative`,
      description:
        params.description ??
        `Collaborative project by ${uni?.organizationName ?? uni?.fullName ?? "the university"} to solve challenge ${challenge.complaintCode}: ${challenge.title}.`,
      department: params.department ?? null,
      status: "PROJECT_CREATED",
      progress: 0,
      requiredTech: params.requiredTech ?? [],
    })
    .returning();

  await db.insert(projectMilestones).values(
    DEFAULT_MILESTONES.map((m, i) => ({
      projectId: project.id,
      title: m.title,
      description: m.description,
      percentage: m.percentage,
      sortOrder: i,
      status: i === 0 ? "IN_PROGRESS" : "PENDING",
      dueDate: new Date(Date.now() + (i + 1) * 12 * 24 * 3600 * 1000),
    })),
  );

  await db.insert(projectMembers).values([
    { projectId: project.id, userId: params.universityId, memberRole: "UNIVERSITY_LEAD", memberName: uni?.organizationName ?? uni?.fullName ?? "University lead" },
    { projectId: project.id, userId: challenge.citizenId, memberRole: "CITIZEN_REPORTER", memberName: undefined },
  ]);

  const teamMembers = (params.teamMembers ?? []).filter((member) => member.name || member.role || member.email || member.expertise || member.phone);
  if (teamMembers.length > 0) {
    await db.insert(projectMembers).values(
      teamMembers.map((member) => ({
        projectId: project.id,
        userId: params.universityId,
        memberRole: member.role?.trim() || "TEAM_MEMBER",
        memberName: member.name?.trim() || null,
        memberEmail: member.email?.trim() || null,
        memberExpertise: member.expertise?.trim() || null,
        memberPhone: member.phone?.trim() || null,
      })),
    );
  }

  // Acceptance owns the challenge lifecycle. Do not skip field verification just
  // because the existing project workspace is provisioned at acceptance time.
  if (!["UNIVERSITY_ACCEPTED", "FIELD_VERIFICATION_PENDING"].includes(challenge.status)) {
    await db.update(challenges).set({ status: "PROJECT_CREATED", updatedAt: new Date() }).where(eq(challenges.id, challenge.id));
  }
  await logLifecycle(challenge.id, "PROJECT_CREATED", `Project "${project.title}" created.`, params.universityId);
  await notify({
    userId: challenge.citizenId,
    title: "Project started for your problem",
    message: `Project "${project.title}" has been created for ${challenge.complaintCode}.`,
    type: "PROJECT_CREATED",
    link: `/citizen/problems/${challenge.id}`,
  });
  return project;
}

export async function recomputeProgress(projectId: number) {
  const milestones = await db
    .select()
    .from(projectMilestones)
    .where(eq(projectMilestones.projectId, projectId))
    .orderBy(asc(projectMilestones.sortOrder));
  const completed = milestones.filter((m) => m.status === "COMPLETED");
  const progress = completed.length ? Math.max(...completed.map((m) => m.percentage)) : 0;
  await db.update(projects).set({ progress }).where(eq(projects.id, projectId));
  return progress;
}

export async function addProgressUpdate(params: {
  projectId: number;
  authorId: number;
  progress: number;
  note: string;
  stage?: string;
}) {
  const [project] = await db.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
  if (!project) throw notFound("Project not found");
  if (params.progress < 0 || params.progress > 100) throw badRequest("Progress must be between 0 and 100");

  const [update] = await db
    .insert(projectProgressUpdates)
    .values({
      projectId: params.projectId,
      authorId: params.authorId,
      progress: params.progress,
      note: params.note,
      stage: params.stage ?? null,
    })
    .returning();

  const status = params.stage ?? (params.progress >= 100 ? "COMPLETED" : project.status);
  await db
    .update(projects)
    .set({ progress: params.progress, status, completedAt: params.progress >= 100 ? new Date() : project.completedAt })
    .where(eq(projects.id, params.projectId));

  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, project.challengeId)).limit(1);
  if (challenge) {
    await db
      .update(challenges)
      .set({ status: params.progress >= 100 ? "COMPLETED" : status, updatedAt: new Date() })
      .where(eq(challenges.id, challenge.id));
    await logLifecycle(challenge.id, status, `Progress update: ${params.progress}% — ${params.note}`, params.authorId);
    await notify({
      userId: challenge.citizenId,
      title: params.progress >= 100 ? "Your problem has been solved" : "Project progress update",
      message:
        params.progress >= 100
          ? `Project "${project.title}" is complete. Please share your feedback.`
          : `Project "${project.title}" is now ${params.progress}% complete. ${params.note}`,
      type: params.progress >= 100 ? "PROJECT_COMPLETED" : "PROGRESS_UPDATE",
      link: params.progress >= 100 ? `/citizen/feedback` : `/citizen/problems/${challenge.id}`,
    });
    if (params.progress >= 100) await completeProject(project.id);
  }
  return update;
}

export async function completeProject(projectId: number) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw notFound("Project not found");
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, project.challengeId)).limit(1);
  if (!challenge) throw notFound("Challenge not found");

  await db
    .update(projectMilestones)
    .set({ status: "COMPLETED", completedAt: new Date() })
    .where(eq(projectMilestones.projectId, projectId));
  await db
    .update(projects)
    .set({ status: "COMPLETED", progress: 100, completedAt: new Date() })
    .where(eq(projects.id, projectId));
  await db.update(challenges).set({ status: "COMPLETED", updatedAt: new Date() }).where(eq(challenges.id, challenge.id));

  const existing = await db.select().from(impactReports).where(eq(impactReports.projectId, projectId)).limit(1);
  if (existing.length === 0) {
    const durationDays = Math.max(
      1,
      Math.round((Date.now() - new Date(project.startedAt).getTime()) / (24 * 3600 * 1000)),
    );
    await db.insert(impactReports).values({
      projectId,
      challengeId: challenge.id,
      solution: project.description,
      peopleBenefited: challenge.peopleAffected,
      durationDays,
      implementationDate: new Date(),
      impactScore: Math.min(100, Math.round(challenge.priorityScore * 0.7 + 30)),
    });
  }
  await logLifecycle(challenge.id, "COMPLETED", "Implementation completed. Awaiting citizen validation.");
  return project;
}

export async function requestIndustrySupport(params: {
  projectId: number;
  industryId: number;
  supportType: string;
  description: string;
  requestedBy: "UNIVERSITY" | "INDUSTRY";
  matchScore?: number;
  reasons?: string[];
}) {
  const [project] = await db.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
  if (!project) throw notFound("Project not found");

  const [row] = await db
    .insert(industrySupport)
    .values({
      projectId: params.projectId,
      industryId: params.industryId,
      supportType: params.supportType,
      description: params.description,
      requestedBy: params.requestedBy,
      status: params.requestedBy === "INDUSTRY" ? "ACTIVE" : "REQUESTED",
      matchScore: params.matchScore ?? 0,
      reasons: params.reasons ?? [],
      acceptedAt: params.requestedBy === "INDUSTRY" ? new Date() : null,
    })
    .returning();

  if (params.requestedBy === "INDUSTRY") {
    await db.insert(projectMembers).values({
      projectId: params.projectId,
      userId: params.industryId,
      memberRole: "INDUSTRY_PARTNER",
    });
    await db.update(projects).set({ status: "INDUSTRY_SUPPORT" }).where(eq(projects.id, params.projectId));
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, project.challengeId)).limit(1);
    const [ind] = await db.select().from(users).where(eq(users.id, params.industryId)).limit(1);
    if (challenge) {
      await db.update(challenges).set({ status: "INDUSTRY_SUPPORT", updatedAt: new Date() }).where(eq(challenges.id, challenge.id));
      await logLifecycle(challenge.id, "INDUSTRY_SUPPORT", `${ind?.organizationName ?? "Industry partner"} joined with ${params.supportType} support.`, params.industryId);
      await notify({
        userId: challenge.citizenId,
        title: "Industry partner joined",
        message: `${ind?.organizationName ?? "An industry partner"} is now supporting the project for ${challenge.complaintCode}.`,
        type: "INDUSTRY_JOINED",
        link: `/citizen/problems/${challenge.id}`,
      });
    }
    await notify({
      userId: project.universityId,
      title: "Industry support received",
      message: `${ind?.organizationName ?? "An industry partner"} is supporting "${project.title}" with ${params.supportType}.`,
      type: "INDUSTRY_SUPPORT",
      link: `/university/projects`,
    });
  } else {
    await notify({
      userId: params.industryId,
      title: "New support request",
      message: `Support requested for "${project.title}": ${params.supportType}.`,
      type: "SUPPORT_REQUEST",
      link: `/industry/support`,
    });
  }
  return row;
}

export async function acceptIndustrySupport(supportId: number, industryId: number) {
  const [row] = await db
    .select()
    .from(industrySupport)
    .where(and(eq(industrySupport.id, supportId), eq(industrySupport.industryId, industryId)))
    .limit(1);
  if (!row) throw notFound("Support request not found");
  const [updated] = await db
    .update(industrySupport)
    .set({ status: "ACTIVE", acceptedAt: new Date() })
    .where(eq(industrySupport.id, supportId))
    .returning();
  await db.insert(projectMembers).values({ projectId: row.projectId, userId: industryId, memberRole: "INDUSTRY_PARTNER" });
  await db.update(projects).set({ status: "INDUSTRY_SUPPORT" }).where(eq(projects.id, row.projectId));
  const [project] = await db.select().from(projects).where(eq(projects.id, row.projectId)).limit(1);
  if (project) {
    await notify({
      userId: project.universityId,
      title: "Industry accepted your request",
      message: `Support request for "${project.title}" was accepted.`,
      type: "INDUSTRY_SUPPORT",
      link: "/university/projects",
    });
  }
  return updated;
}
