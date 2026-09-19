import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, industryExpertise, universitiesExpertise, users } from "@/db/schema";
import { conflict, handleError, ok } from "@/server/exception/http";
import { hashPassword, signToken, type Role } from "@/server/security/auth";
import { optionalString, readJson, requireEmail, requireString, toInt, toStringArray } from "@/server/dto/validate";

const ROLES: Role[] = ["CITIZEN", "UNIVERSITY", "INDUSTRY", "FIELD_PERSON"];

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const email = requireEmail(body.email);
    const password = requireString(body.password, "Password", { min: 6, max: 72 });
    const fullName = requireString(body.fullName, "Full name", { min: 2, max: 160 });
    const role = (String(body.role ?? "CITIZEN").toUpperCase() as Role) || "CITIZEN";
    if (role === "ADMIN") throw conflict("Admin accounts are reserved for the platform administrator and cannot be self-registered.");
    if (!ROLES.includes(role)) throw conflict("Invalid role selected");

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) throw conflict("An account with this email already exists");

    const verificationDocumentsRaw = requireString(body.verificationDocuments ?? body.verificationDoc ?? "", "Verification documents", { min: 2, max: 500000 });
    if (verificationDocumentsRaw.startsWith("data:") && verificationDocumentsRaw.length > 400000) {
      throw conflict("Verification document is too large for serverless deployment. Please upload a smaller file under 400 KB.");
    }
    const verificationDocuments = verificationDocumentsRaw;
    const verificationDocType =
      role === "CITIZEN"
        ? "Aadhar / Ration Card verification"
        : role === "UNIVERSITY"
          ? "University ID + registration and affiliation documents"
          : role === "INDUSTRY"
            ? "Industry registration / GST / incorporation documents"
            : role === "FIELD_PERSON"
              ? "Field person identity / organization authorization document"
            : "Admin verification";

    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash: await hashPassword(password),
        role,
        fullName,
        organizationName: optionalString(body.organizationName, 180) ?? (role === "CITIZEN" ? null : fullName),
        phone: optionalString(body.phone, 24),
        language: optionalString(body.language, 12) ?? "en",
        city: optionalString(body.city, 120),
        state: optionalString(body.state, 120),
        bio: optionalString(body.bio, 500),
        verificationStatus: "PENDING",
        verificationDocType,
        verificationDocuments,
      })
      .returning();

    if (role === "UNIVERSITY") {
      await db.insert(universitiesExpertise).values({
        universityId: user.id,
        departments: toStringArray(body.departments),
        skills: toStringArray(body.skills),
        researchAreas: toStringArray(body.researchAreas),
        facultyExpertise: toStringArray(body.facultyExpertise),
        studentTeams: toInt(body.studentTeams, 2, 0, 500),
        previousProjects: toInt(body.previousProjects, 0, 0, 500),
      });
    }
    if (role === "INDUSTRY") {
      await db.insert(industryExpertise).values({
        industryId: user.id,
        technologies: toStringArray(body.technologies),
        domains: toStringArray(body.domains),
        supportTypes: toStringArray(body.supportTypes).length ? toStringArray(body.supportTypes) : ["Mentorship", "Technology"],
        deploymentCapability: body.deploymentCapability !== false,
      });
    }

    await db.insert(auditLogs).values({ userId: user.id, action: "REGISTER", entity: "users", entityId: user.id });
    const token = await signToken({ sub: user.id, role, email });
    return ok(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          organizationName: user.organizationName,
          language: user.language,
        },
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
