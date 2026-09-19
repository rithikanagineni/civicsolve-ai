import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { voteChallenge } from "@/server/service/challengeService";
import { parseId } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth(req, ["CITIZEN", "ADMIN"]);
    const id = parseId((await ctx.params).id);
    const challenge = await voteChallenge(id, auth.id);
    return ok({ challenge });
  } catch (error) {
    return handleError(error);
  }
}
