import { desc } from "drizzle-orm";
import { db } from "@/db";
import { ivrSessions } from "@/db/schema";
import { handleError, ok } from "@/server/exception/http";
import { readJson, requireString } from "@/server/dto/validate";

/** IVR prototype — simulated telephony workflow (dial *#437). */
export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const phone = requireString(body.phone, "Phone number", { min: 6, max: 24 });
    const sessionCode = `IVR-${Date.now().toString(36).toUpperCase()}`;
    const [row] = await db.insert(ivrSessions).values({ sessionCode, phone, step: "LANGUAGE" }).returning();
    return ok(
      {
        session: row,
        prompt: "Welcome to CivicSolve. For Telugu press 1, Hindi press 2, English press 3, Tamil press 4.",
        options: [
          { key: "1", value: "te", label: "తెలుగు (Telugu)" },
          { key: "2", value: "hi", label: "हिन्दी (Hindi)" },
          { key: "3", value: "en", label: "English" },
          { key: "4", value: "ta", label: "தமிழ் (Tamil)" },
        ],
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function GET() {
  try {
    const rows = await db.select().from(ivrSessions).orderBy(desc(ivrSessions.createdAt)).limit(20);
    return ok({ sessions: rows });
  } catch (error) {
    return handleError(error);
  }
}
