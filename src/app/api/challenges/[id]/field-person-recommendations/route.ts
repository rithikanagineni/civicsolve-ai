import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { fieldRecommendations } from "@/server/service/fieldService";
import { parseId } from "@/server/dto/validate";
type Ctx = { params: Promise<{ id: string }> };
export async function GET(req: Request, ctx: Ctx) { try { const auth = await requireAuth(req, ["UNIVERSITY"]); return ok({ recommendations: await fieldRecommendations(parseId((await ctx.params).id), auth.id), weights: { skillMatch: 0.4, expertiseMatch: 0.2, proximity: 0.2, availability: 0.1, workload: 0.1 } }); } catch (e) { return handleError(e); } }
