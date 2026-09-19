import { eq } from "drizzle-orm";
import { db } from "@/db";
import { challenges, projectMilestones, projects } from "@/db/schema";
import { forbidden, handleError, notFound, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { notify } from "@/server/service/notificationService";
import { logLifecycle, recomputeProgress } from "@/server/service/projectService";
import { optionalString, parseId, readJson, toInt } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth(req, ["UNIVERSITY", "INDUSTRY", "ADMIN"]);
    const id = parseId((await ctx.params).id);
    const [milestone] = await db.select().from(projectMilestones).where(eq(projectMilestones.id, id)).limit(1);
    if (!milestone) throw notFound("Milestone not found");
    const [project] = await db.select().from(projects).where(eq(projects.id, milestone.projectId)).limit(1);
    if (!project) throw notFound("Project not found");
    if (auth.role === "UNIVERSITY" && project.universityId !== auth.id) throw forbidden("Not your project");

    const body = await readJson(req);
    const status = (optionalString(body.status, 20) ?? milestone.status).toUpperCase();
    const documentUrl = optionalString(body.documentUrl, 500) ?? optionalString(body.documentName, 500) ?? milestone.documentUrl ?? null;
    if (status === "COMPLETED" && !documentUrl) {
      throw forbidden("Upload a project report or document before marking this milestone complete.");
    }
    const [updated] = await db
      .update(projectMilestones)
      .set({
        title: optionalString(body.title, 160) ?? milestone.title,
        description: optionalString(body.description, 1000) ?? milestone.description,
        percentage: toInt(body.percentage, milestone.percentage, 0, 100),
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
        documentUrl,
      })
      .where(eq(projectMilestones.id, id))
      .returning();

    const progress = await recomputeProgress(project.id);
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, project.challengeId)).limit(1);
    if (challenge && status === "COMPLETED") {
      await logLifecycle(challenge.id, "DEVELOPMENT", `Milestone completed: ${updated.title} (${progress}% overall).`, auth.id);
      await notify({
        userId: challenge.citizenId,
        title: "Milestone completed",
        message: `"${updated.title}" completed for ${challenge.complaintCode}. Project is ${progress}% done.`,
        type: "MILESTONE",
        link: `/citizen/problems/${challenge.id}`,
      });
    }
    return ok({ milestone: updated, progress });
  } catch (error) {
    return handleError(error);
  }
}
