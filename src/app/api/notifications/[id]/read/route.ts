import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { handleError, notFound, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { parseId } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth(req);
    const id = parseId((await ctx.params).id);
    const [row] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, auth.id)))
      .returning();
    if (!row) throw notFound("Notification not found");
    return ok({ notification: row });
  } catch (error) {
    return handleError(error);
  }
}
