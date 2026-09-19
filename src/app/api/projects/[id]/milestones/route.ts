import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { projectMilestones, projects } from "@/db/schema";
import { forbidden, handleError, notFound, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { optionalString, parseId, readJson, requireString, toInt } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    await requireAuth(req);
    const id = parseId((await ctx.params).id);
    const rows = await db.select().from(projectMilestones).where(eq(projectMilestones.projectId, id)).orderBy(asc(projectMilestones.sortOrder));
    return ok({ milestones: rows });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth(req, ["UNIVERSITY", "ADMIN"]);
    const id = parseId((await ctx.params).id);
    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!project) throw notFound("Project not found");
    if (auth.role !== "ADMIN" && project.universityId !== auth.id) throw forbidden("Only the owning university can add milestones");

    const body = await readJson(req);
    const [{ maxOrder }] = await db
      .select({ maxOrder: sql<number>`coalesce(max(${projectMilestones.sortOrder}), -1)` })
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, id));

    const [row] = await db
      .insert(projectMilestones)
      .values({
        projectId: id,
        title: requireString(body.title, "Milestone title", { min: 3, max: 160 }),
        description: optionalString(body.description, 1000) ?? "Milestone added by the university team.",
        percentage: toInt(body.percentage, 50, 0, 100),
        status: (optionalString(body.status, 20) ?? "PENDING").toUpperCase(),
        sortOrder: Number(maxOrder) + 1,
        dueDate: body.dueDate ? new Date(String(body.dueDate)) : null,
      })
      .returning();
    return ok({ milestone: row }, 201);
  } catch (error) {
    return handleError(error);
  }
}
