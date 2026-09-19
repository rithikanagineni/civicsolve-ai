import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { acceptVisit } from "@/server/service/fieldService";
import { parseId } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth(req, ["FIELD_PERSON"]);
    const id = parseId((await ctx.params).id);
    const assignment = await acceptVisit(id, auth.id);
    return ok({ assignment });
  } catch (e) {
    return handleError(e);
  }
}
