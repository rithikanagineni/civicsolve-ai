import { eq } from "drizzle-orm";
import { db } from "@/db";
import { industrySupport, projects } from "@/db/schema";
import { forbidden, handleError, notFound, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { addProgressUpdate } from "@/server/service/projectService";
import { optionalString, parseId, readJson, requireString, toInt } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth(req, ["UNIVERSITY", "INDUSTRY", "ADMIN"]);
    const id = parseId((await ctx.params).id);
    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!project) throw notFound("Project not found");
    if (auth.role === "UNIVERSITY" && project.universityId !== auth.id) throw forbidden("Not your project");
    if (auth.role === "INDUSTRY") {
      const supports = await db.select().from(industrySupport).where(eq(industrySupport.projectId, id));
      if (!supports.some((s) => s.industryId === auth.id)) throw forbidden("You are not supporting this project");
    }

    const body = await readJson(req);
    const update = await addProgressUpdate({
      projectId: id,
      authorId: auth.id,
      progress: toInt(body.progress, project.progress, 0, 100),
      note: requireString(body.note, "Progress note", { min: 3, max: 1000 }),
      stage: optionalString(body.stage, 32),
    });
    return ok({ update }, 201);
  } catch (error) {
    return handleError(error);
  }
}
