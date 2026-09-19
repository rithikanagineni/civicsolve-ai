import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ivrSessions, users } from "@/db/schema";
import { badRequest, handleError, notFound, ok } from "@/server/exception/http";
import { createChallenge } from "@/server/service/challengeService";
import { hashPassword } from "@/server/security/auth";
import { optionalString, parseId, readJson } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

const CATEGORY_OPTIONS = [
  { key: "1", value: "Water", label: "Water supply" },
  { key: "2", value: "Roads", label: "Roads" },
  { key: "3", value: "Electricity", label: "Electricity" },
  { key: "4", value: "Waste Management", label: "Garbage / Waste" },
  { key: "5", value: "Other", label: "Other" },
];

async function ivrGatewayCitizen(phone: string) {
  const [existing] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (existing) return existing;
  const email = `ivr-${phone.replace(/\D/g, "")}@civicsolve.local`;
  const [byEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (byEmail) return byEmail;
  const [created] = await db
    .insert(users)
    .values({
      email,
      passwordHash: await hashPassword(`ivr-${phone}-${Date.now()}`),
      role: "CITIZEN",
      fullName: `IVR Caller ${phone.slice(-4)}`,
      phone,
      language: "en",
      bio: "Account auto-created through the IVR gateway.",
    })
    .returning();
  return created;
}

/** Advances the IVR call flow: LANGUAGE -> CATEGORY -> DESCRIPTION -> CONFIRM -> complaint code. */
export async function PUT(req: Request, ctx: Ctx) {
  try {
    const id = parseId((await ctx.params).id);
    const [session] = await db.select().from(ivrSessions).where(eq(ivrSessions.id, id)).limit(1);
    if (!session) throw notFound("IVR session not found");
    const body = await readJson(req);

    if (session.step === "LANGUAGE") {
      const language = optionalString(body.language, 12);
      if (!language) throw badRequest("Select a language option");
      const [row] = await db.update(ivrSessions).set({ language, step: "CATEGORY" }).where(eq(ivrSessions.id, id)).returning();
      return ok({
        session: row,
        prompt: "Select the problem category. Water 1, Roads 2, Electricity 3, Garbage 4, Other 5.",
        options: CATEGORY_OPTIONS,
      });
    }

    if (session.step === "CATEGORY") {
      const category = optionalString(body.category, 60);
      if (!category) throw badRequest("Select a category option");
      const [row] = await db.update(ivrSessions).set({ category, step: "DESCRIPTION" }).where(eq(ivrSessions.id, id)).returning();
      return ok({ session: row, prompt: "Describe your problem after the beep. Press # when finished.", options: [] });
    }

    if (session.step === "DESCRIPTION") {
      const transcript = optionalString(body.transcript, 2000);
      if (!transcript || transcript.length < 10) throw badRequest("Please describe the problem in a little more detail");
      const [row] = await db.update(ivrSessions).set({ transcript, step: "CONFIRM" }).where(eq(ivrSessions.id, id)).returning();
      return ok({ session: row, prompt: "Press 1 to confirm and register your complaint, press 2 to re-record.", options: [] });
    }

    if (session.step === "CONFIRM") {
      if (body.confirm === false) {
        const [row] = await db.update(ivrSessions).set({ step: "DESCRIPTION" }).where(eq(ivrSessions.id, id)).returning();
        return ok({ session: row, prompt: "Please describe your problem again after the beep.", options: [] });
      }
      const citizen = await ivrGatewayCitizen(session.phone);
      const transcript = session.transcript ?? "Problem reported via IVR call.";
      const { challenge } = await createChallenge(citizen.id, {
        title: `${session.category ?? "Civic"} issue reported via IVR (${session.phone.slice(-4)})`,
        description: transcript,
        category: session.category ?? "Other",
        location: optionalString(body.location, 200) ?? "Reported by phone — location to be verified",
        severity: "HIGH",
        durationDays: 14,
        peopleAffected: 200,
        language: session.language ?? "en",
        inputMethod: "IVR",
        originalLanguage: session.language ?? "en",
        originalText: transcript,
      });
      const [row] = await db
        .update(ivrSessions)
        .set({ step: "COMPLETED", status: "COMPLETED", complaintCode: challenge.complaintCode, challengeId: challenge.id })
        .where(eq(ivrSessions.id, id))
        .returning();
      return ok({
        session: row,
        prompt: `Your complaint has been registered. Your complaint code is ${challenge.complaintCode}. Thank you for calling CivicSolve.`,
        complaintCode: challenge.complaintCode,
        challengeId: challenge.id,
        options: [],
      });
    }

    return ok({ session, prompt: "This call has already been completed.", options: [] });
  } catch (error) {
    return handleError(error);
  }
}
