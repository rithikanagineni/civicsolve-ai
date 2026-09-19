import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { detectDuplicates } from "@/server/service/challengeService";
import { parseId } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    await requireAuth(req);
    const id = parseId((await ctx.params).id);
    return ok({ duplicates: await detectDuplicates(id) });
  } catch (error) {
    return handleError(error);
  }
}
