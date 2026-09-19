import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  challenges,
  citizenSatisfaction,
  impactReports,
  industrySupport,
  projectMembers,
  projectMessages,
  projectMilestones,
  projectProgressUpdates,
  projects,
  users,
} from "@/db/schema";
import { handleError, notFound, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { recommendIndustries } from "@/server/service/challengeService";
import { parseId } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    await requireAuth(req);
    const id = parseId((await ctx.params).id);
    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!project) throw notFound("Project not found");

    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, project.challengeId)).limit(1);
    const [uni] = await db.select().from(users).where(eq(users.id, project.universityId)).limit(1);
    const milestones = await db.select().from(projectMilestones).where(eq(projectMilestones.projectId, id)).orderBy(asc(projectMilestones.sortOrder));
    const updates = await db.select().from(projectProgressUpdates).where(eq(projectProgressUpdates.projectId, id)).orderBy(desc(projectProgressUpdates.createdAt));

    const safeMembers = await db
      .select({ m: projectMembers, u: users })
      .from(projectMembers)
      .leftJoin(users, eq(users.id, projectMembers.userId))
      .where(eq(projectMembers.projectId, id));
    const supports = await db
      .select({ s: industrySupport, ind: users })
      .from(industrySupport)
      .innerJoin(users, eq(users.id, industrySupport.industryId))
      .where(eq(industrySupport.projectId, id));
    const members = safeMembers;
    const messages = await db
      .select({ msg: projectMessages, u: users })
      .from(projectMessages)
      .innerJoin(users, eq(users.id, projectMessages.senderId))
      .where(eq(projectMessages.projectId, id))
      .orderBy(asc(projectMessages.createdAt));
    const [impact] = await db.select().from(impactReports).where(eq(impactReports.projectId, id)).limit(1);
    const [feedback] = challenge
      ? await db.select().from(citizenSatisfaction).where(eq(citizenSatisfaction.challengeId, challenge.id)).limit(1)
      : [undefined];

    return ok({
      project: {
        ...project,
        universityName: uni?.organizationName ?? uni?.fullName ?? null,
        complaintCode: challenge?.complaintCode ?? null,
        challengeTitle: challenge?.title ?? null,
      },
      challenge: challenge ?? null,
      milestones,
      progressUpdates: updates,
      industrySupport: supports.map((s) => ({
        ...s.s,
        industryName: s.ind.organizationName ?? s.ind.fullName,
      })),
      members: members.map((m) => ({
        id: m.m.id,
        name: m.m.memberName ?? m.u?.organizationName ?? m.u?.fullName ?? "Project member",
        role: m.m.memberRole,
      })),
      messages: messages.map((m) => ({
        id: m.msg.id,
        body: m.msg.body,
        createdAt: m.msg.createdAt,
        senderId: m.u.id,
        senderName: m.u.organizationName ?? m.u.fullName,
        senderRole: m.u.role,
      })),
      impactReport: impact ?? null,
      feedback: feedback ?? null,
      recommendedIndustries: await recommendIndustries(id),
    });
  } catch (error) {
    return handleError(error);
  }
}
