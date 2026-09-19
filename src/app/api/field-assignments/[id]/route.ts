import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { getAssignmentDetail } from "@/server/service/fieldService";
import { parseId } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth(req);
    const id = parseId((await ctx.params).id);
    const data = await getAssignmentDetail(id, auth.id, auth.role);
    return ok(data);
  } catch (e) {
    return handleError(e);
  }
}
