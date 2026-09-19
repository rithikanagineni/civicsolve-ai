import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { listChallengeSummaries } from "@/server/service/challengeQueries";
import { createChallenge } from "@/server/service/challengeService";
import { optionalString, readJson, requireString, toInt, toStringArray } from "@/server/dto/validate";
import { CATEGORIES } from "@/server/ai/analysisEngine";
import { badRequest } from "@/server/exception/http";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    const url = new URL(req.url);
    const data = await listChallengeSummaries({
      status: url.searchParams.get("status") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
      priorityLevel: url.searchParams.get("priority") ?? undefined,
      citizenId: auth.role === "CITIZEN" ? auth.id : undefined,
    });
    return ok({ challenges: data });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req, ["CITIZEN", "ADMIN"]);
    const body = await readJson(req);
    const category = requireString(body.category, "Category");
    if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) throw badRequest("Unknown category");

    const result = await createChallenge(auth.id, {
      title: requireString(body.title, "Title", { min: 5, max: 220 }),
      description: requireString(body.description, "Description", { min: 15, max: 4000 }),
      category,
      subcategory: optionalString(body.subcategory, 80),
      location: requireString(body.location, "Location", { min: 3, max: 200 }),
      landmark: optionalString(body.landmark, 200),
      severity: optionalString(body.severity, 20) ?? "MEDIUM",
      durationDays: toInt(body.durationDays, 7, 0, 3650),
      peopleAffected: toInt(body.peopleAffected, 50, 1, 10_000_000),
      imageUrl: optionalString(body.imageUrl, 500),
      language: optionalString(body.language, 12) ?? auth.language,
      inputMethod: optionalString(body.inputMethod, 12) ?? "TEXT",
      originalLanguage: optionalString(body.originalLanguage, 12),
      originalText: optionalString(body.originalText, 4000),
      address: optionalString(body.address, 500),
      latitude: Number.isFinite(Number(body.latitude)) ? Number(body.latitude) : undefined,
      longitude: Number.isFinite(Number(body.longitude)) ? Number(body.longitude) : undefined,
      locationDescription: optionalString(body.locationDescription, 1000),
      attachmentUrls: { images: toStringArray(body.images), videos: toStringArray(body.videos), documents: toStringArray(body.documents) },
    });
    return ok(result, 201);
  } catch (error) {
    return handleError(error);
  }
}
