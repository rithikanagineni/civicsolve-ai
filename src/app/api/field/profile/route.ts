import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { getFieldProfile, updateFieldProfile } from "@/server/service/fieldService";
import { readJson } from "@/server/dto/validate";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req, ["FIELD_PERSON"]);
    const profile = await getFieldProfile(auth.id);
    return ok(profile);
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAuth(req, ["FIELD_PERSON"]);
    const body = await readJson(req);
    const updated = await updateFieldProfile(auth.id, body);
    return ok({ person: updated });
  } catch (e) {
    return handleError(e);
  }
}
