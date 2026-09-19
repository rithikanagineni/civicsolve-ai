import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { challenges, industrySupport, projectMessages, projects, users } from "@/db/schema";
import { forbidden, handleError, notFound, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { parseId, readJson, requireString } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

async function assertParticipant(projectId: number, userId: number, role: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw notFound("Project not found");
  if (role === "ADMIN") return project;
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, project.challengeId)).limit(1);
  if (project.universityId === userId || challenge?.citizenId === userId) return project;
  const supports = await db.select().from(industrySupport).where(eq(industrySupport.projectId, projectId));
  if (supports.some((s) => s.industryId === userId)) return project;
  throw forbidden("You are not a participant of this project");
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth(req);
    const id = parseId((await ctx.params).id);
    await assertParticipant(id, auth.id, auth.role);
    const rows = await db
      .select({ m: projectMessages, u: users })
      .from(projectMessages)
      .innerJoin(users, eq(users.id, projectMessages.senderId))
      .where(eq(projectMessages.projectId, id))
      .orderBy(asc(projectMessages.createdAt));
    return ok({
      messages: rows.map((r) => ({
        id: r.m.id,
        body: r.m.body,
        createdAt: r.m.createdAt,
        senderId: r.u.id,
        senderName: r.u.organizationName ?? r.u.fullName,
        senderRole: r.u.role,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth(req);
    const id = parseId((await ctx.params).id);
    await assertParticipant(id, auth.id, auth.role);
    const body = await readJson(req);
    const [row] = await db
      .insert(projectMessages)
      .values({ projectId: id, senderId: auth.id, body: requireString(body.body, "Message", { min: 1, max: 1000 }) })
      .returning();
    return ok({ message: row }, 201);
  } catch (error) {
    return handleError(error);
  }
}
