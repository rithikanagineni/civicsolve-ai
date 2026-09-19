import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { assignFieldPerson, fieldDataForChallenge } from "@/server/service/fieldService";
import { parseId, readJson } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    await requireAuth(req);
    const id = parseId((await ctx.params).id);
    const data = await fieldDataForChallenge(id);
    return ok(data);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth(req, ["UNIVERSITY"]);
    const body = await readJson(req);
    const assignment = await assignFieldPerson(
      parseId((await ctx.params).id),
      auth.id,
      auth.id,
      parseId(String(body.fieldPersonId), "fieldPersonId"),
      typeof body.expectedVisitAt === "string" ? body.expectedVisitAt : undefined,
    );
    return ok({ assignment }, 201);
  } catch (e) {
    return handleError(e);
  }
}

