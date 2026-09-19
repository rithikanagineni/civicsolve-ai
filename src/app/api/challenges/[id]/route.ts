import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { challengeMatches, challenges, fieldAssignments, fieldPersons, industrySupport, projects } from "@/db/schema";
import { forbidden, handleError, notFound, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { getChallengeDetail } from "@/server/service/challengeService";
import { optionalString, parseId, readJson, toInt } from "@/server/dto/validate";
import { geocodeLocation, normalizeCoordinates } from "@/server/service/geocodingService";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth(req);
    const id = parseId((await ctx.params).id);
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id)).limit(1);
    if (!challenge) throw notFound("Challenge not found");
    if (auth.role === "CITIZEN" && challenge.citizenId !== auth.id) throw forbidden("You can only view your own problem reports");
    if (auth.role === "UNIVERSITY") {
      const [access] = await db.select({ id: challengeMatches.id }).from(challengeMatches).where(and(eq(challengeMatches.challengeId, id), eq(challengeMatches.universityId, auth.id))).limit(1);
      if (!access) throw forbidden("This challenge is not recommended to your university");
    }
    if (auth.role === "INDUSTRY") {
      const [access] = await db.select({ id: industrySupport.id }).from(industrySupport).innerJoin(projects, eq(projects.id, industrySupport.projectId)).where(and(eq(projects.challengeId, id), eq(industrySupport.industryId, auth.id))).limit(1);
      if (!access) throw forbidden("This project is not available to your organization");
    }
    if (auth.role === "FIELD_PERSON") {
      const [access] = await db.select({ id: fieldAssignments.id }).from(fieldAssignments).innerJoin(fieldPersons, eq(fieldPersons.id, fieldAssignments.fieldPersonId)).where(and(eq(fieldAssignments.challengeId, id), eq(fieldPersons.userId, auth.id))).limit(1);
      if (!access) throw forbidden("You can only view problems assigned to you");
    }
    return ok(await getChallengeDetail(id));
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth(req);
    const id = parseId((await ctx.params).id);
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id)).limit(1);
    if (!challenge) throw notFound("Challenge not found");
    if (auth.role !== "ADMIN" && challenge.citizenId !== auth.id) throw forbidden("You can only edit your own problem reports");

    const body = await readJson(req);
    const newLocation = optionalString(body.location, 200) ?? challenge.location;
    const newLandmark = optionalString(body.landmark, 200) ?? challenge.landmark;

    let newLatitude = challenge.latitude;
    let newLongitude = challenge.longitude;

    if (body.latitude !== undefined || body.longitude !== undefined) {
      const explicit = normalizeCoordinates(body.latitude, body.longitude);
      newLatitude = explicit?.latitude ?? null;
      newLongitude = explicit?.longitude ?? null;
    } else if (body.location && body.location !== challenge.location) {
      const geo = await geocodeLocation(newLocation, newLandmark ?? undefined);
      newLatitude = geo?.latitude ?? null;
      newLongitude = geo?.longitude ?? null;
    }

    const [updated] = await db
      .update(challenges)
      .set({
        title: optionalString(body.title, 220) ?? challenge.title,
        description: optionalString(body.description, 4000) ?? challenge.description,
        location: newLocation,
        landmark: newLandmark,
        latitude: newLatitude,
        longitude: newLongitude,
        severity: (optionalString(body.severity, 20) ?? challenge.severity).toUpperCase(),
        peopleAffected: toInt(body.peopleAffected, challenge.peopleAffected, 1, 10_000_000),
        durationDays: toInt(body.durationDays, challenge.durationDays, 0, 3650),
        status: auth.role === "ADMIN" ? optionalString(body.status, 32) ?? challenge.status : challenge.status,
        updatedAt: new Date(),
      })
      .where(eq(challenges.id, id))
      .returning();
    return ok({ challenge: updated });
  } catch (error) {
    return handleError(error);
  }
}
