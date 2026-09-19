import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { addTeamMember, listTeam } from "@/server/service/fieldService";
import { parseId, readJson } from "@/server/dto/validate";
type Ctx = { params: Promise<{ id: string }> };
export async function GET(req: Request, ctx: Ctx) { try { const auth = await requireAuth(req, ["UNIVERSITY"]); const id = parseId((await ctx.params).id); return ok({ team: await listTeam(id, auth.id) }); } catch (e) { return handleError(e); } }
export async function POST(req: Request, ctx: Ctx) { try { const auth = await requireAuth(req, ["UNIVERSITY"]); const id = parseId((await ctx.params).id); return ok({ member: await addTeamMember(id, auth.id, auth.id, await readJson(req)) }, 201); } catch (e) { return handleError(e); } }
