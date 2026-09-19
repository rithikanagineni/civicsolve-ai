import { eq } from "drizzle-orm";
import { db } from "@/db";
import { industrySupport, projects, users } from "@/db/schema";
import { forbidden, handleError, notFound, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { requestIndustrySupport } from "@/server/service/projectService";
import { recommendIndustries } from "@/server/service/challengeService";
import { optionalString, parseId, readJson, requireString, toInt } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    await requireAuth(req);
    const id = parseId((await ctx.params).id);
    const rows = await db
      .select({ s: industrySupport, ind: users })
      .from(industrySupport)
      .innerJoin(users, eq(users.id, industrySupport.industryId))
      .where(eq(industrySupport.projectId, id));
    return ok({
      support: rows.map((r) => ({ ...r.s, industryName: r.ind.organizationName ?? r.ind.fullName })),
      recommendedIndustries: await recommendIndustries(id),
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * UNIVERSITY -> requests support from an industry (industryId in body).
 * INDUSTRY   -> directly offers support for the project.
 */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth(req, ["UNIVERSITY", "INDUSTRY", "ADMIN"]);
    const id = parseId((await ctx.params).id);
    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!project) throw notFound("Project not found");

    const body = await readJson(req);
    const supportType = requireString(body.supportType, "Support type", { min: 2, max: 40 });
    const description = optionalString(body.description, 1000) ?? `${supportType} support for ${project.title}.`;

    if (auth.role === "INDUSTRY") {
      const recs = await recommendIndustries(id);
      const mine = recs.find((r) => r.industryId === auth.id);
      const row = await requestIndustrySupport({
        projectId: id,
        industryId: auth.id,
        supportType,
        description,
        requestedBy: "INDUSTRY",
        matchScore: mine?.score ?? 0,
        reasons: mine?.reasons ?? [],
      });
      return ok({ support: row }, 201);
    }

    if (auth.role === "UNIVERSITY" && project.universityId !== auth.id) throw forbidden("Not your project");
    const industryId = toInt(body.industryId, 0, 0);
    if (!industryId) throw forbidden("Select an industry partner to request support from");
    const row = await requestIndustrySupport({
      projectId: id,
      industryId,
      supportType,
      description,
      requestedBy: "UNIVERSITY",
    });
    return ok({ support: row }, 201);
  } catch (error) {
    return handleError(error);
  }
}
