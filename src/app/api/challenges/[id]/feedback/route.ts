import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { challenges, citizenSatisfaction, impactReports, projects } from "@/db/schema";
import { badRequest, forbidden, handleError, notFound, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { notify } from "@/server/service/notificationService";
import { logLifecycle } from "@/server/service/projectService";
import { optionalString, parseId, readJson, toInt } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    await requireAuth(req);
    const id = parseId((await ctx.params).id);
    const rows = await db
      .select()
      .from(citizenSatisfaction)
      .where(eq(citizenSatisfaction.challengeId, id))
      .orderBy(desc(citizenSatisfaction.createdAt));
    return ok({ feedback: rows });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth(req, ["CITIZEN", "ADMIN"]);
    const id = parseId((await ctx.params).id);
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id)).limit(1);
    if (!challenge) throw notFound("Challenge not found");
    if (auth.role !== "ADMIN" && challenge.citizenId !== auth.id) throw forbidden("Only the reporting citizen can validate this problem");

    const body = await readJson(req);
    const rating = toInt(body.rating, 0, 0, 5);
    if (rating < 1) throw badRequest("Please provide a rating between 1 and 5");

    const [project] = await db.select().from(projects).where(eq(projects.challengeId, id)).limit(1);
    const [row] = await db
      .insert(citizenSatisfaction)
      .values({
        challengeId: id,
        projectId: project?.id ?? null,
        citizenId: challenge.citizenId,
        rating,
        comment: optionalString(body.comment, 1000) ?? null,
        resolved: body.resolved !== false,
        suggestion: optionalString(body.suggestion, 1000) ?? null,
      })
      .returning();

    await db.update(challenges).set({ status: "CITIZEN_VALIDATION", updatedAt: new Date() }).where(eq(challenges.id, id));
    await logLifecycle(id, "CITIZEN_VALIDATION", `Citizen validation submitted: ${rating}/5, resolved=${body.resolved !== false}.`, auth.id);

    if (project) {
      const [report] = await db.select().from(impactReports).where(eq(impactReports.projectId, project.id)).limit(1);
      if (report) {
        await db
          .update(impactReports)
          .set({ satisfaction: rating, impactScore: Math.min(100, Math.round(report.impactScore * 0.7 + rating * 6)) })
          .where(eq(impactReports.id, report.id));
      }
      await notify({
        userId: project.universityId,
        title: "Citizen validation received",
        message: `Citizen rated the solution for ${challenge.complaintCode}: ${rating}/5.`,
        type: "FEEDBACK",
        link: "/university/projects",
      });
    }
    return ok({ feedback: row }, 201);
  } catch (error) {
    return handleError(error);
  }
}
