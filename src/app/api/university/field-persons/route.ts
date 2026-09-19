import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { addFieldPerson, listFieldPersons } from "@/server/service/fieldService";
import { readJson } from "@/server/dto/validate";
export async function GET(req: Request) { try { const auth = await requireAuth(req, ["UNIVERSITY"]); return ok({ fieldPersons: await listFieldPersons(auth.id) }); } catch (e) { return handleError(e); } }
export async function POST(req: Request) { try { const auth = await requireAuth(req, ["UNIVERSITY"]); return ok({ fieldPerson: await addFieldPerson(auth.id, auth.id, await readJson(req)) }, 201); } catch (e) { return handleError(e); } }
