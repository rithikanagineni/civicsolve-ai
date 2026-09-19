import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { challenges, projects, users } from "@/db/schema";
import { hashPassword } from "@/server/security/auth";
import { runSeed } from "@/server/seed/seedData";

const ADMIN_EMAIL = "rithikanagineni021@gmail.com";
const ADMIN_PASSWORD = "Nagineni@123";

let seeding: Promise<void> | null = null;

async function ensureUserVerificationColumns() {
  const statements = [
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_status" varchar(24) NOT NULL DEFAULT 'PENDING'`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_doc_type" varchar(80)`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_documents" text`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_notes" text`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verified_at" timestamp with time zone`,
  ];

  for (const statement of statements) {
    await db.execute(sql.raw(statement));
  }
}

async function ensureAdminAccount() {
  const [existing] = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);
  if (existing) {
    await db.update(users)
      .set({
        verificationStatus: "VERIFIED",
        verificationDocType: "Admin verification",
        verificationDocuments: existing.verificationDocuments ?? "Admin account seeded by the platform bootstrap.",
      })
      .where(eq(users.email, ADMIN_EMAIL));
    return;
  }

  await db.insert(users).values({
    email: ADMIN_EMAIL,
    passwordHash: await hashPassword(ADMIN_PASSWORD),
    role: "ADMIN",
    fullName: "Platform Administrator",
    organizationName: "CivicSolve AI",
    city: "Hyderabad",
    state: "Telangana",
    language: "en",
    verificationStatus: "VERIFIED",
    verificationDocType: "Admin verification",
    verificationDocuments: "Admin account seeded by the platform bootstrap.",
    bio: "Platform administrator account for CivicSolve AI.",
    isSeed: true,
  });
}

async function ensureDemoUsersVerified() {
  await db.update(users)
    .set({
      verificationStatus: "VERIFIED",
      verificationDocType: sql.raw("COALESCE(verification_doc_type, 'Seed verification')"),
      verificationDocuments: sql.raw("COALESCE(verification_documents, 'Seeded demo account verified by the platform admin.')"),
    })
    .where(sql`role IN ('CITIZEN', 'UNIVERSITY', 'INDUSTRY')`);
}

async function ensureChallengesGeocoded() {
  const { geocodeLocation } = await import("@/server/service/geocodingService");
  const unmapped = await db.select().from(challenges).where(sql`latitude IS NULL OR longitude IS NULL`);
  for (const c of unmapped) {
    if (c.location) {
      const geo = await geocodeLocation(c.location, c.landmark ?? undefined);
      if (geo) {
        await db.update(challenges).set({ latitude: geo.latitude, longitude: geo.longitude }).where(eq(challenges.id, c.id));
      }
    }
  }
}

/**
 * Guarantees demo/seed data exists. If the database was reset (empty users table),
 * the seed runs once so the demo credentials always work.
 */
export async function ensureSeeded() {
  if (seeding) return seeding;
  seeding = (async () => {
    try {
      await ensureUserVerificationColumns();
      await ensureAdminAccount();
      await ensureDemoUsersVerified();
      await ensureChallengesGeocoded();

      const [{ count: userCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
      const [{ count: challengeCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(challenges);
      const [{ count: projectCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(projects);

      if (userCount === 0 || challengeCount === 0 || projectCount === 0) {
        console.log("[CivicSolve] Demo data incomplete — loading seed/demo records…");
        await runSeed(true);
      }
    } catch (error) {
      console.error("[CivicSolve] ensureSeeded failed:", error);
    } finally {
      seeding = null;
    }
  })();
  return seeding;
}
