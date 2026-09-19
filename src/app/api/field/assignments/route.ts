import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { myAssignments } from "@/server/service/fieldService";
export async function GET(req: Request) { try { const auth = await requireAuth(req, ["FIELD_PERSON"]); return ok({ assignments: await myAssignments(auth.id) }); } catch (e) { return handleError(e); } }
