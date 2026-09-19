import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { deleteFieldPerson, updateFieldPerson } from "@/server/service/fieldService";
import { parseId, readJson } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth(req, ["UNIVERSITY"]);
    const id = parseId((await ctx.params).id);
    const body = await readJson(req);
    const updated = await updateFieldPerson(id, auth.id, auth.id, body);
    return ok({ fieldPerson: updated });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth(req, ["UNIVERSITY"]);
    const id = parseId((await ctx.params).id);
    await deleteFieldPerson(id, auth.id, auth.id);
    return ok({ success: true, message: "Field person removed" });
  } catch (e) {
    return handleError(e);
  }
}
