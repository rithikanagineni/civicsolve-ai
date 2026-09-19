import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { submitFieldReport } from "@/server/service/fieldService";
import { parseId, readJson } from "@/server/dto/validate";
type Ctx = { params: Promise<{ id: string }> };
export async function POST(req: Request, ctx: Ctx) { try { const auth = await requireAuth(req, ["FIELD_PERSON"]); return ok({ report: await submitFieldReport(parseId((await ctx.params).id), auth.id, await readJson(req)) }, 201); } catch (e) { return handleError(e); } }
