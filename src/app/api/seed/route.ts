import { handleError, ok } from "@/server/exception/http";
import { runSeed } from "@/server/seed/seedData";

/** Idempotent demo/seed data loader. POST /api/seed (add ?force=true to re-run). */
export async function POST(req: Request) {
  try {
    const force = new URL(req.url).searchParams.get("force") === "true";
    return ok(await runSeed(force));
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(req: Request) {
  return POST(req);
}
