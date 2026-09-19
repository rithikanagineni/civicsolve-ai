import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { detectDuplicates, generateMatches, runAnalysis } from "@/server/service/challengeService";
import { parseId } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    await requireAuth(req);
    const id = parseId((await ctx.params).id);
    const analysis = await runAnalysis(id);
    const duplicates = await detectDuplicates(id);
    const matches = await generateMatches(id);
    return ok({ analysis, duplicates, matches });
  } catch (error) {
    return handleError(error);
  }
}
