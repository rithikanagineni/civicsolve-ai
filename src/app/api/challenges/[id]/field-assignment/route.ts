import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { fieldAssignments, fieldPersons } from "@/db/schema";
import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { parseId } from "@/server/dto/validate";
type Ctx = { params: Promise<{ id: string }> };
export async function GET(req: Request, ctx: Ctx) { try { const auth = await requireAuth(req, ["UNIVERSITY", "ADMIN"]); const id = parseId((await ctx.params).id); const rows = await db.select({ assignment: fieldAssignments, person: fieldPersons }).from(fieldAssignments).innerJoin(fieldPersons, eq(fieldPersons.id, fieldAssignments.fieldPersonId)).where(auth.role === "ADMIN" ? eq(fieldAssignments.challengeId, id) : and(eq(fieldAssignments.challengeId, id), eq(fieldAssignments.universityId, auth.id))).orderBy(desc(fieldAssignments.assignedAt)); return ok({ assignments: rows }); } catch (e) { return handleError(e); } }
