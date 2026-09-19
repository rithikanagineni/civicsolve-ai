import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { listChallengeSummaries } from "@/server/service/challengeQueries";

/** Ownership enforced in the backend: WHERE citizen_id = authenticated user id. */
export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req, ["CITIZEN", "ADMIN"]);
    const challenges = await listChallengeSummaries({ citizenId: auth.id });
    return ok({ challenges });
  } catch (error) {
    return handleError(error);
  }
}
