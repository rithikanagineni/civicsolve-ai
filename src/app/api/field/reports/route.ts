import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { myReports } from "@/server/service/fieldService";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req, ["FIELD_PERSON"]);
    const reports = await myReports(auth.id);
    return ok({ reports });
  } catch (e) {
    return handleError(e);
  }
}
