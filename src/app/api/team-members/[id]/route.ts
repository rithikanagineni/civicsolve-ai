import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { deactivateTeamMember, updateTeamMember } from "@/server/service/fieldService";
import { parseId, readJson } from "@/server/dto/validate";
type Ctx = { params: Promise<{ id: string }> };
export async function PUT(req: Request, ctx: Ctx) { try { const auth = await requireAuth(req, ["UNIVERSITY"]); return ok({ member: await updateTeamMember(parseId((await ctx.params).id), auth.id, auth.id, await readJson(req)) }); } catch (e) { return handleError(e); } }
export async function DELETE(req: Request, ctx: Ctx) { try { const auth = await requireAuth(req, ["UNIVERSITY"]); await deactivateTeamMember(parseId((await ctx.params).id), auth.id, auth.id); return ok({ removed: true }); } catch (e) { return handleError(e); } }
