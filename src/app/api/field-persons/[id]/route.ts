import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { updateFieldPerson } from "@/server/service/fieldService";
import { parseId, readJson } from "@/server/dto/validate";
type Ctx = { params: Promise<{ id: string }> };
export async function PUT(req: Request, ctx: Ctx) { try { const auth = await requireAuth(req, ["UNIVERSITY"]); return ok({ fieldPerson: await updateFieldPerson(parseId((await ctx.params).id), auth.id, auth.id, await readJson(req)) }); } catch (e) { return handleError(e); } }
