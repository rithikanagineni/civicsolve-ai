import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { startVisit } from "@/server/service/fieldService";
import { parseId } from "@/server/dto/validate";
type Ctx = { params: Promise<{ id: string }> };
export async function POST(req: Request, ctx: Ctx) { try { const auth = await requireAuth(req, ["FIELD_PERSON"]); return ok({ assignment: await startVisit(parseId((await ctx.params).id), auth.id) }); } catch (e) { return handleError(e); } }
