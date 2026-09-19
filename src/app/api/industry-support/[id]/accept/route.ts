import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { acceptIndustrySupport } from "@/server/service/projectService";
import { parseId } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth(req, ["INDUSTRY"]);
    const id = parseId((await ctx.params).id);
    return ok({ support: await acceptIndustrySupport(id, auth.id) });
  } catch (error) {
    return handleError(error);
  }
}
