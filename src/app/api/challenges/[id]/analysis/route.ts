import { eq } from "drizzle-orm";
import { db } from "@/db";
import { challengeAiAnalysis } from "@/db/schema";
import { handleError, notFound, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { parseId } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    await requireAuth(req);
    const id = parseId((await ctx.params).id);
    const [analysis] = await db.select().from(challengeAiAnalysis).where(eq(challengeAiAnalysis.challengeId, id)).limit(1);
    if (!analysis) throw notFound("AI analysis not available yet for this challenge");
    return ok({ analysis });
  } catch (error) {
    return handleError(error);
  }
}
