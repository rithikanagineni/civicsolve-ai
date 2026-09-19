import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, auth.id))
      .orderBy(desc(notifications.createdAt))
      .limit(100);
    return ok({ notifications: rows, unread: rows.filter((r) => !r.isRead).length });
  } catch (error) {
    return handleError(error);
  }
}
