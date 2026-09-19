import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { setFieldPersonStatus } from "@/server/service/fieldService";
import { parseId, readJson, requireString } from "@/server/dto/validate";
type Ctx = { params: Promise<{ id: string }> };
export async function PATCH(req: Request, ctx: Ctx) { try { const auth = await requireAuth(req, ["UNIVERSITY"]); const body = await readJson(req); const status = requireString(body.status, "Availability status", { max: 24 }).toUpperCase(); if (!["AVAILABLE", "ASSIGNED", "ON_FIELD_VISIT", "UNAVAILABLE"].includes(status)) throw new Error("Invalid availability status"); return ok({ fieldPerson: await setFieldPersonStatus(parseId((await ctx.params).id), auth.id, auth.id, status) }); } catch (e) { return handleError(e); } }
