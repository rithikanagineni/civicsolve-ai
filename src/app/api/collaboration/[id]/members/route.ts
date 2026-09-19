import { eq } from "drizzle-orm";
import { db } from "@/db";
import { collaborationGroupMembers, collaborationGroups } from "@/db/schema";
import { forbidden, handleError, notFound, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { parseId, readJson, requireString, optionalString } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth(req, ["UNIVERSITY", "ADMIN"]);
    const groupId = parseId((await ctx.params).id);
    const [group] = await db.select().from(collaborationGroups).where(eq(collaborationGroups.id, groupId)).limit(1);
    if (!group) throw notFound("Collaboration group not found");
    if (auth.role !== "ADMIN" && group.universityId !== auth.id) throw forbidden("Not your collaboration group");

    const body = await readJson(req);
    const name = requireString(body.name, "Member name", { min: 2, max: 120 });
    const role = requireString(body.role, "Member role", { min: 2, max: 80 });
    const email = optionalString(body.email, 180) ?? null;
    const expertise = optionalString(body.expertise, 180) ?? null;
    const kind = optionalString(body.kind, 30) ?? "STUDENT";

    const [member] = await db.insert(collaborationGroupMembers).values({
      groupId,
      name,
      role,
      email,
      expertise,
      kind,
    }).returning();

    return ok({ member }, 201);
  } catch (error) {
    return handleError(error);
  }
}
