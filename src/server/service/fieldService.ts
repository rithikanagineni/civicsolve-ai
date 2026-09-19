import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs, challengeAiAnalysis, challengeMatches, challenges, fieldAssignments, fieldPersons,
  fieldVerificationReports, projects, teamMembers, users,
} from "@/db/schema";
import { badRequest, conflict, forbidden, notFound } from "@/server/exception/http";
import { notify } from "@/server/service/notificationService";
import { logLifecycle } from "@/server/service/projectService";

export const FIELD_SCORE_WEIGHTS = {
  skill: 0.40,
  expertise: 0.20,
  proximity: 0.15,
  availability: 0.10,
  experience: 0.10,
  workload: 0.05,
} as const;

const normalise = (items: string[]) => new Set(items.map((x) => x.trim().toLowerCase()).filter(Boolean));
const asArray = (value: unknown): string[] => (Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : []);
export const haversineKm = (aLat: number, aLon: number, bLat: number, bLon: number) => {
  const r = 6371;
  const radians = (n: number) => (n * Math.PI) / 180;
  const dLat = radians(bLat - aLat), dLon = radians(bLon - aLon);
  const q = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLon / 2) ** 2;
  return Number((2 * r * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q))).toFixed(2));
};

async function audit(userId: number, action: string, entity: string, entityId: number, detail?: string) {
  await db.insert(auditLogs).values({ userId, action, entity, entityId, detail: detail ?? null });
}

async function requireUniversityChallenge(challengeId: number, universityId: number) {
  const [project] = await db.select().from(projects).where(and(eq(projects.challengeId, challengeId), eq(projects.universityId, universityId))).limit(1);
  if (project) return project;
  const [match] = await db.select().from(challengeMatches).where(and(eq(challengeMatches.challengeId, challengeId), eq(challengeMatches.universityId, universityId))).limit(1);
  if (!match) throw forbidden("This challenge is not recommended to your university");
  return null;
}

export async function listTeam(challengeId: number, universityId: number) {
  await requireUniversityChallenge(challengeId, universityId);
  return db.select().from(teamMembers).where(and(eq(teamMembers.challengeId, challengeId), eq(teamMembers.universityId, universityId), eq(teamMembers.status, "ACTIVE"))).orderBy(desc(teamMembers.createdAt));
}

export async function addTeamMember(challengeId: number, universityId: number, actorId: number, input: Record<string, unknown>) {
  const project = await requireUniversityChallenge(challengeId, universityId);
  const fullName = String(input.fullName ?? "").trim();
  const projectRole = String(input.projectRole ?? input.role ?? "").trim();
  if (!fullName || !projectRole) throw badRequest("Full name and role in project are required");
  const [member] = await db.insert(teamMembers).values({
    universityId, challengeId, projectId: project?.id ?? null, fullName, projectRole,
    studentEmployeeId: String(input.studentEmployeeId ?? "").trim() || null,
    email: String(input.email ?? "").trim() || null, mobile: String(input.mobile ?? "").trim() || null,
    department: String(input.department ?? "").trim() || null, skills: asArray(input.skills),
    experience: String(input.experience ?? "").trim() || null, responsibility: String(input.responsibility ?? "").trim() || null,
    photoUrl: String(input.photoUrl ?? "").trim() || null, profileUrl: String(input.profileUrl ?? "").trim() || null,
    availability: String(input.availability ?? "AVAILABLE").toUpperCase(),
  }).returning();
  await logLifecycle(challengeId, "TEAM_MEMBER_ADDED", `${member.fullName} joined the university project team.`, actorId);
  await audit(actorId, "TEAM_MEMBER_ADDED", "team_members", member.id);
  return member;
}

export async function updateTeamMember(id: number, universityId: number, actorId: number, input: Record<string, unknown>) {
  const [existing] = await db.select().from(teamMembers).where(and(eq(teamMembers.id, id), eq(teamMembers.universityId, universityId))).limit(1);
  if (!existing) throw notFound("Team member not found");
  const [member] = await db.update(teamMembers).set({
    fullName: String(input.fullName ?? existing.fullName).trim(), projectRole: String(input.projectRole ?? input.role ?? existing.projectRole).trim(),
    studentEmployeeId: input.studentEmployeeId === undefined ? existing.studentEmployeeId : String(input.studentEmployeeId || "").trim() || null,
    email: input.email === undefined ? existing.email : String(input.email || "").trim() || null,
    mobile: input.mobile === undefined ? existing.mobile : String(input.mobile || "").trim() || null,
    department: input.department === undefined ? existing.department : String(input.department || "").trim() || null,
    skills: input.skills === undefined ? existing.skills : asArray(input.skills),
    experience: input.experience === undefined ? existing.experience : String(input.experience || "").trim() || null,
    responsibility: input.responsibility === undefined ? existing.responsibility : String(input.responsibility || "").trim() || null,
    photoUrl: input.photoUrl === undefined ? existing.photoUrl : String(input.photoUrl || "").trim() || null,
    profileUrl: input.profileUrl === undefined ? existing.profileUrl : String(input.profileUrl || "").trim() || null,
    availability: input.availability === undefined ? existing.availability : String(input.availability).toUpperCase(), updatedAt: new Date(),
  }).where(eq(teamMembers.id, id)).returning();
  await logLifecycle(existing.challengeId, "TEAM_MEMBER_UPDATED", `${member.fullName}'s team profile was updated.`, actorId);
  await audit(actorId, "TEAM_MEMBER_UPDATED", "team_members", id);
  return member;
}

export async function deactivateTeamMember(id: number, universityId: number, actorId: number) {
  const [member] = await db.select().from(teamMembers).where(and(eq(teamMembers.id, id), eq(teamMembers.universityId, universityId))).limit(1);
  if (!member) throw notFound("Team member not found");
  await db.update(teamMembers).set({ status: "INACTIVE", updatedAt: new Date() }).where(eq(teamMembers.id, id));
  await logLifecycle(member.challengeId, "TEAM_MEMBER_REMOVED", `${member.fullName} was deactivated from the project team.`, actorId);
  await audit(actorId, "TEAM_MEMBER_REMOVED", "team_members", id);
}

export async function listFieldPersons(universityId: number) {
  return db.select().from(fieldPersons).where(and(eq(fieldPersons.universityId, universityId), eq(fieldPersons.status, "ACTIVE"))).orderBy(desc(fieldPersons.createdAt));
}

export async function addFieldPerson(universityId: number, actorId: number, input: Record<string, unknown>) {
  const fullName = String(input.fullName ?? "").trim();
  if (!fullName) throw badRequest("Full name is required");
  const email = String(input.email ?? "").trim().toLowerCase();
  const [linkedUser] = email ? await db.select().from(users).where(eq(users.email, email)).limit(1) : [];
  if (linkedUser && linkedUser.role !== "FIELD_PERSON") throw badRequest("A linked account must have the FIELD_PERSON role");
  const [person] = await db.insert(fieldPersons).values({
    universityId, userId: linkedUser?.id ?? (typeof input.userId === "number" ? input.userId : null), fullName,
    photoUrl: String(input.photoUrl ?? "").trim() || null, mobile: String(input.mobile ?? "").trim() || null, email: email || null,
    role: String(input.role ?? "Field Engineer").trim() || "Field Engineer", employeeId: String(input.employeeId ?? "").trim() || null,
    skills: asArray(input.skills), expertise: asArray(input.expertise), department: String(input.department ?? "").trim() || null,
    organization: String(input.organization ?? "").trim() || null, experienceYears: Math.max(0, Number(input.experienceYears) || 0),
    registeredLocation: String(input.registeredLocation ?? "").trim() || null,
    latitude: Number.isFinite(Number(input.latitude)) ? Number(input.latitude) : null, longitude: Number.isFinite(Number(input.longitude)) ? Number(input.longitude) : null,
    serviceRadiusKm: Math.max(0, Number(input.serviceRadiusKm) || 25), languages: asArray(input.languages),
    availabilityStatus: String(input.availabilityStatus ?? "AVAILABLE").toUpperCase(),
  }).returning();
  await audit(actorId, "FIELD_PERSON_ADDED", "field_persons", person.id);
  return person;
}

export async function updateFieldPerson(id: number, universityId: number, actorId: number, input: Record<string, unknown>) {
  const [old] = await db.select().from(fieldPersons).where(and(eq(fieldPersons.id, id), eq(fieldPersons.universityId, universityId))).limit(1);
  if (!old) throw notFound("Field person not found");
  const pick = (k: string, fallback: string | null) => input[k] === undefined ? fallback : String(input[k] || "").trim() || null;
  const [person] = await db.update(fieldPersons).set({
    fullName: input.fullName === undefined ? old.fullName : String(input.fullName).trim(), photoUrl: pick("photoUrl", old.photoUrl), mobile: pick("mobile", old.mobile), email: pick("email", old.email),
    role: pick("role", old.role), employeeId: pick("employeeId", old.employeeId),
    skills: input.skills === undefined ? old.skills : asArray(input.skills), expertise: input.expertise === undefined ? old.expertise : asArray(input.expertise), department: pick("department", old.department), organization: pick("organization", old.organization),
    experienceYears: input.experienceYears === undefined ? old.experienceYears : Math.max(0, Number(input.experienceYears) || 0), registeredLocation: pick("registeredLocation", old.registeredLocation),
    latitude: input.latitude === undefined ? old.latitude : (Number.isFinite(Number(input.latitude)) ? Number(input.latitude) : null), longitude: input.longitude === undefined ? old.longitude : (Number.isFinite(Number(input.longitude)) ? Number(input.longitude) : null),
    serviceRadiusKm: input.serviceRadiusKm === undefined ? old.serviceRadiusKm : Math.max(0, Number(input.serviceRadiusKm) || 0), languages: input.languages === undefined ? old.languages : asArray(input.languages),
    availabilityStatus: input.availabilityStatus === undefined ? old.availabilityStatus : String(input.availabilityStatus).toUpperCase(), updatedAt: new Date(),
  }).where(eq(fieldPersons.id, id)).returning();
  await audit(actorId, "FIELD_PERSON_UPDATED", "field_persons", id);
  return person;
}

export async function deleteFieldPerson(id: number, universityId: number, actorId: number) {
  const [person] = await db.select().from(fieldPersons).where(and(eq(fieldPersons.id, id), eq(fieldPersons.universityId, universityId))).limit(1);
  if (!person) throw notFound("Field person not found");
  await db.update(fieldPersons).set({ status: "INACTIVE", updatedAt: new Date() }).where(eq(fieldPersons.id, id));
  await audit(actorId, "FIELD_PERSON_DELETED", "field_persons", id, `Deactivated ${person.fullName}`);
}

export async function setFieldPersonStatus(id: number, universityId: number, actorId: number, status: string) {
  const [person] = await db.update(fieldPersons).set({ availabilityStatus: status, updatedAt: new Date() }).where(and(eq(fieldPersons.id, id), eq(fieldPersons.universityId, universityId))).returning();
  if (!person) throw notFound("Field person not found");
  await audit(actorId, "FIELD_PERSON_UPDATED", "field_persons", id, `Availability: ${status}`);
  return person;
}

export async function fieldRecommendations(challengeId: number, universityId: number) {
  await requireUniversityChallenge(challengeId, universityId);
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  const [analysis] = await db.select().from(challengeAiAnalysis).where(eq(challengeAiAnalysis.challengeId, challengeId)).limit(1);
  if (!challenge) throw notFound("Challenge not found");
  const people = await listFieldPersons(universityId);
  const assignments = await db.select().from(fieldAssignments).where(inArray(fieldAssignments.fieldPersonId, people.map((p) => p.id).length ? people.map((p) => p.id) : [-1]));
  const required = normalise(analysis?.requiredExpertise ?? []);

  return people.map((person) => {
    const personSkillsList = [...(person.skills ?? []), ...(person.expertise ?? [])];
    const personSkillsNorm = normalise(personSkillsList);
    
    // Fuzzy/token match between required expertise and person skills
    let matchedSkillsCount = 0;
    const matchedSkillNames: string[] = [];
    for (const req of required) {
      const found = personSkillsList.some((s) => {
        const lowerS = s.toLowerCase();
        return lowerS.includes(req) || req.includes(lowerS);
      });
      if (found) {
        matchedSkillsCount++;
        matchedSkillNames.push(req);
      }
    }

    const overlap = required.size > 0 ? Math.min(1, matchedSkillsCount / required.size) : 0.6;
    const expertise = matchedSkillsCount >= 2 ? 1.0 : matchedSkillsCount === 1 ? 0.75 : 0.25;

    const distance = challenge.latitude !== null && challenge.longitude !== null && person.latitude !== null && person.longitude !== null
      ? haversineKm(challenge.latitude, challenge.longitude, person.latitude, person.longitude)
      : null;

    const proximity = distance === null
      ? 0.40
      : Math.max(0, 1 - distance / Math.max(person.serviceRadiusKm || 25, 1));

    const availability = person.availabilityStatus === "AVAILABLE"
      ? 1.0
      : person.availabilityStatus === "BUSY"
      ? 0.4
      : person.availabilityStatus === "ASSIGNED"
      ? 0.35
      : 0.1;

    const experience = Math.min(1, Math.max(0, person.experienceYears / 4.5));

    const active = assignments.filter((a) =>
      a.fieldPersonId === person.id && ["FIELD_PERSON_ASSIGNED", "VISIT_ACCEPTED", "FIELD_VERIFICATION_IN_PROGRESS"].includes(a.status)
    ).length;

    const workload = Math.max(0, 1 - active / 3);

    const score = Math.round(
      100 * (
        overlap * FIELD_SCORE_WEIGHTS.skill +
        expertise * FIELD_SCORE_WEIGHTS.expertise +
        proximity * FIELD_SCORE_WEIGHTS.proximity +
        availability * FIELD_SCORE_WEIGHTS.availability +
        experience * FIELD_SCORE_WEIGHTS.experience +
        workload * FIELD_SCORE_WEIGHTS.workload
      )
    );

    const reasons: string[] = [];
    if (overlap >= 0.6 || matchedSkillsCount > 0) reasons.push("Strong skill match");
    if (expertise >= 0.7) reasons.push("Relevant expertise");
    if (distance !== null && distance <= 15) reasons.push(distance <= 5 ? "Nearby" : `${distance} km from location`);
    else if (distance !== null) reasons.push(`${distance} km away`);
    if (person.availabilityStatus === "AVAILABLE") reasons.push("Currently available");
    else reasons.push(`Status: ${person.availabilityStatus}`);
    if (person.experienceYears > 0) reasons.push("Relevant experience");
    if (active === 0) reasons.push("Low workload");
    else reasons.push(`${active} active assignment${active === 1 ? "" : "s"}`);

    return {
      ...person,
      distanceKm: distance,
      score,
      workload: active,
      reasons,
    };
  }).sort((a, b) => b.score - a.score);
}

export async function assignFieldPerson(challengeId: number, universityId: number, actorId: number, fieldPersonId: number, expectedVisitAt?: string) {
  await requireUniversityChallenge(challengeId, universityId);
  const [person] = await db.select().from(fieldPersons).where(and(eq(fieldPersons.id, fieldPersonId), eq(fieldPersons.universityId, universityId), eq(fieldPersons.status, "ACTIVE"))).limit(1);
  if (!person) throw notFound("Field person not found");
  const existing = await db.select().from(fieldAssignments).where(and(eq(fieldAssignments.challengeId, challengeId), inArray(fieldAssignments.status, ["FIELD_PERSON_ASSIGNED", "VISIT_ACCEPTED", "FIELD_VERIFICATION_IN_PROGRESS"]))).limit(1);
  if (existing.length) throw conflict("This challenge already has an active field assignment");
  const recommendation = (await fieldRecommendations(challengeId, universityId)).find((item) => item.id === fieldPersonId);
  
  const [assignment] = await db.insert(fieldAssignments).values({
    challengeId,
    fieldPersonId,
    universityId,
    assignedBy: actorId,
    expectedVisitAt: expectedVisitAt ? new Date(expectedVisitAt) : null,
    distanceKm: recommendation?.distanceKm ?? null,
    recommendationScore: recommendation?.score ?? 0,
    recommendationReasons: recommendation?.reasons ?? [],
    status: "FIELD_PERSON_ASSIGNED",
  }).returning();

  await db.update(fieldPersons).set({ availabilityStatus: "ASSIGNED", updatedAt: new Date() }).where(eq(fieldPersons.id, fieldPersonId));
  await db.update(challenges).set({ status: "FIELD_PERSON_ASSIGNED", updatedAt: new Date() }).where(eq(challenges.id, challengeId));
  await logLifecycle(challengeId, "FIELD_PERSON_ASSIGNED", `${person.fullName} was assigned for field verification.`, actorId);
  await audit(actorId, "FIELD_PERSON_ASSIGNED", "field_assignments", assignment.id);
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  if (person.userId) await notify({ userId: person.userId, title: "New Field Verification Assigned", message: `You have been assigned to verify ${challenge?.complaintCode ?? "a problem"}: "${challenge?.title}".`, type: "FIELD_ASSIGNMENT", link: "/field/assignments" });
  if (challenge) await notify({ userId: challenge.citizenId, title: "Field Person Assigned", message: `Field engineer ${person.fullName} has been assigned to physically verify your reported problem.`, type: "FIELD_ASSIGNMENT", link: `/citizen/problems/${challengeId}` });
  return assignment;
}

export async function myAssignments(userId: number) {
  // Allow matching either directly by fieldPersons.userId or through matching user email
  const [currentUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const rows = await db
    .select({ assignment: fieldAssignments, challenge: challenges, university: users, person: fieldPersons })
    .from(fieldAssignments)
    .innerJoin(fieldPersons, eq(fieldPersons.id, fieldAssignments.fieldPersonId))
    .innerJoin(challenges, eq(challenges.id, fieldAssignments.challengeId))
    .innerJoin(users, eq(users.id, fieldAssignments.universityId))
    .where(
      currentUser?.email
        ? sql`(${fieldPersons.userId} = ${userId} OR lower(${fieldPersons.email}) = lower(${currentUser.email}))`
        : eq(fieldPersons.userId, userId)
    )
    .orderBy(desc(fieldAssignments.assignedAt));
  return rows;
}

export async function myReports(userId: number) {
  const [currentUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const rows = await db
    .select({
      report: fieldVerificationReports,
      assignment: fieldAssignments,
      challenge: challenges,
      university: users,
    })
    .from(fieldVerificationReports)
    .innerJoin(fieldAssignments, eq(fieldAssignments.id, fieldVerificationReports.assignmentId))
    .innerJoin(fieldPersons, eq(fieldPersons.id, fieldVerificationReports.fieldPersonId))
    .innerJoin(challenges, eq(challenges.id, fieldVerificationReports.challengeId))
    .innerJoin(users, eq(users.id, fieldAssignments.universityId))
    .where(
      currentUser?.email
        ? sql`(${fieldPersons.userId} = ${userId} OR lower(${fieldPersons.email}) = lower(${currentUser.email}))`
        : eq(fieldPersons.userId, userId)
    )
    .orderBy(desc(fieldVerificationReports.submittedAt));
  return rows;
}

async function ownAssignment(assignmentId: number, userId: number) {
  const [currentUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const [row] = await db
    .select({ assignment: fieldAssignments, person: fieldPersons })
    .from(fieldAssignments)
    .innerJoin(fieldPersons, eq(fieldPersons.id, fieldAssignments.fieldPersonId))
    .where(
      and(
        eq(fieldAssignments.id, assignmentId),
        currentUser?.email
          ? sql`(${fieldPersons.userId} = ${userId} OR lower(${fieldPersons.email}) = lower(${currentUser.email}))`
          : eq(fieldPersons.userId, userId)
      )
    )
    .limit(1);
  if (!row) throw forbidden("You can only access your own field assignments");
  return row;
}

export async function acceptVisit(assignmentId: number, userId: number) {
  const { assignment, person } = await ownAssignment(assignmentId, userId);
  if (assignment.status !== "FIELD_PERSON_ASSIGNED") {
    throw conflict("This field visit cannot be accepted in its current state");
  }
  const [updated] = await db
    .update(fieldAssignments)
    .set({ status: "VISIT_ACCEPTED", updatedAt: new Date() })
    .where(eq(fieldAssignments.id, assignmentId))
    .returning();

  await logLifecycle(assignment.challengeId, "VISIT_ACCEPTED", `${person.fullName} accepted the field verification visit.`, userId);
  await audit(userId, "VISIT_ACCEPTED", "field_assignments", assignmentId);

  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, assignment.challengeId)).limit(1);
  await notify({
    userId: assignment.universityId,
    title: "Field Visit Accepted",
    message: `${person.fullName} accepted the verification visit for ${challenge?.complaintCode ?? "the problem"}.`,
    type: "FIELD_ASSIGNMENT",
    link: `/challenges/${assignment.challengeId}`,
  });
  return updated;
}

export async function startVisit(assignmentId: number, userId: number) {
  const { assignment, person } = await ownAssignment(assignmentId, userId);
  if (!["FIELD_PERSON_ASSIGNED", "VISIT_ACCEPTED"].includes(assignment.status)) {
    throw conflict("This field visit cannot be started in its current state");
  }
  const [updated] = await db
    .update(fieldAssignments)
    .set({ status: "FIELD_VERIFICATION_IN_PROGRESS", startedAt: new Date(), updatedAt: new Date() })
    .where(eq(fieldAssignments.id, assignmentId))
    .returning();

  await db.update(fieldPersons).set({ availabilityStatus: "ON_FIELD_VISIT", updatedAt: new Date() }).where(eq(fieldPersons.id, person.id));
  await db.update(challenges).set({ status: "FIELD_VERIFICATION_IN_PROGRESS", updatedAt: new Date() }).where(eq(challenges.id, assignment.challengeId));
  await logLifecycle(assignment.challengeId, "FIELD_VISIT_STARTED", `${person.fullName} started the physical field verification visit.`, userId);
  await audit(userId, "FIELD_VISIT_STARTED", "field_assignments", assignmentId);
  return updated;
}

export async function submitFieldReport(assignmentId: number, userId: number, input: Record<string, unknown>) {
  const { assignment, person } = await ownAssignment(assignmentId, userId);
  if (!["FIELD_PERSON_ASSIGNED", "VISIT_ACCEPTED", "FIELD_VERIFICATION_IN_PROGRESS"].includes(assignment.status)) {
    throw conflict("A report has already been submitted for this assignment");
  }
  const observations = String(input.observations ?? "").trim();
  const canResolveDirectly = input.canResolveDirectly === true || String(input.canResolveDirectly).toUpperCase() === "YES";
  if (!observations) throw badRequest("Detailed observations are required");
  if (canResolveDirectly && !String(input.solutionPerformed ?? "").trim()) throw badRequest("Describe the solution performed");
  if (!canResolveDirectly && !String(input.universitySupportReason ?? input.recommendedAction ?? "").trim()) {
    throw badRequest("Explain why university intervention is required");
  }

  const locationConfirmed = input.locationConfirmed !== false && String(input.locationConfirmed).toUpperCase() !== "NO";

  const [report] = await db.insert(fieldVerificationReports).values({
    assignmentId,
    challengeId: assignment.challengeId,
    fieldPersonId: person.id,
    verified: input.verified === true || String(input.verified).toUpperCase() === "YES",
    problemExists: String(input.problemExists ?? "YES").toUpperCase(),
    currentSituation: String(input.currentSituation ?? "").trim() || null,
    observations,
    severity: String(input.severity ?? "").toUpperCase() || null,
    affectedPeople: Number.isFinite(Number(input.affectedPeople)) ? Number(input.affectedPeople) : null,
    locationConfirmed,
    requiredResources: String(input.requiredResources ?? "").trim() || null,
    recommendedSolution: String(input.recommendedSolution ?? "").trim() || null,
    recommendedAction: String(input.recommendedAction ?? input.universitySupportReason ?? "").trim() || null,
    canResolveDirectly,
    solutionPerformed: String(input.solutionPerformed ?? "").trim() || null,
    materialsUsed: String(input.materialsUsed ?? "").trim() || null,
    universitySupportReason: String(input.universitySupportReason ?? input.recommendedAction ?? "").trim() || null,
    photos: asArray(input.photos),
    videos: asArray(input.videos),
    documents: asArray(input.documents),
    latitude: Number.isFinite(Number(input.latitude)) ? Number(input.latitude) : null,
    longitude: Number.isFinite(Number(input.longitude)) ? Number(input.longitude) : null,
  }).returning();

  const nextStatus = canResolveDirectly ? "CITIZEN_VALIDATION" : "FIELD_REPORT_SUBMITTED";
  await db.update(fieldAssignments).set({
    status: canResolveDirectly ? "FIELD_RESOLVED" : "FIELD_REPORT_SUBMITTED",
    completedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(fieldAssignments.id, assignmentId));

  await db.update(fieldPersons).set({ availabilityStatus: "AVAILABLE", updatedAt: new Date() }).where(eq(fieldPersons.id, person.id));
  await db.update(challenges).set({ status: nextStatus, updatedAt: new Date() }).where(eq(challenges.id, assignment.challengeId));

  const stage = canResolveDirectly ? "FIELD_PROBLEM_RESOLVED" : "FIELD_REPORT_SUBMITTED";
  await logLifecycle(
    assignment.challengeId,
    stage,
    canResolveDirectly
      ? `Field resolution completed: ${report.solutionPerformed}`
      : `Field verification completed; university action is required: ${report.recommendedAction || report.universitySupportReason || "Technical support needed"}`,
    userId,
  );
  await audit(userId, stage, "field_verification_reports", report.id);

  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, assignment.challengeId)).limit(1);
  if (challenge) {
    await notify({
      userId: challenge.citizenId,
      title: canResolveDirectly ? "Please validate the field resolution" : "Field verification completed",
      message: canResolveDirectly
        ? "The field team marked the issue as resolved. Please validate the solution."
        : "Field verification is complete and the university will review the findings to continue solution development.",
      type: canResolveDirectly ? "CITIZEN_VALIDATION" : "FIELD_REPORT",
      link: `/citizen/problems/${challenge.id}`,
    });
  }
  await notify({
    userId: assignment.universityId,
    title: canResolveDirectly ? "Field resolution completed" : "University action required",
    message: `${person.fullName} submitted a field verification report for ${challenge?.complaintCode ?? "the problem"}.`,
    type: "FIELD_REPORT",
    link: `/challenges/${assignment.challengeId}`,
  });
  return report;
}

export async function getAssignmentDetail(assignmentId: number, userId: number, role: string) {
  const [currentUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const [row] = await db
    .select({ assignment: fieldAssignments, challenge: challenges, university: users, person: fieldPersons })
    .from(fieldAssignments)
    .innerJoin(fieldPersons, eq(fieldPersons.id, fieldAssignments.fieldPersonId))
    .innerJoin(challenges, eq(challenges.id, fieldAssignments.challengeId))
    .innerJoin(users, eq(users.id, fieldAssignments.universityId))
    .where(eq(fieldAssignments.id, assignmentId))
    .limit(1);

  if (!row) throw notFound("Assignment not found");

  if (role === "FIELD_PERSON") {
    const matchesUser = row.person.userId === userId || (currentUser?.email && row.person.email?.toLowerCase() === currentUser.email.toLowerCase());
    if (!matchesUser) throw forbidden("You can only access your own field assignments");
  } else if (role === "UNIVERSITY") {
    if (row.assignment.universityId !== userId) throw forbidden("You can only access assignments for your university");
  } else if (role === "CITIZEN") {
    if (row.challenge.citizenId !== userId) throw forbidden("You can only access assignments for your reported problems");
  }

  const reports = await db
    .select()
    .from(fieldVerificationReports)
    .where(eq(fieldVerificationReports.assignmentId, assignmentId))
    .orderBy(desc(fieldVerificationReports.submittedAt));

  return { ...row, reports };
}

export async function fieldDataForChallenge(challengeId: number) {
  const assignments = await db
    .select({ assignment: fieldAssignments, person: fieldPersons })
    .from(fieldAssignments)
    .innerJoin(fieldPersons, eq(fieldPersons.id, fieldAssignments.fieldPersonId))
    .where(eq(fieldAssignments.challengeId, challengeId))
    .orderBy(desc(fieldAssignments.assignedAt));

  const reports = await db
    .select()
    .from(fieldVerificationReports)
    .where(eq(fieldVerificationReports.challengeId, challengeId))
    .orderBy(desc(fieldVerificationReports.submittedAt));

  return { assignments, reports };
}

export async function getFieldProfile(userId: number) {
  const [currentUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!currentUser) throw notFound("User not found");
  const [person] = await db
    .select()
    .from(fieldPersons)
    .where(
      currentUser.email
        ? sql`(${fieldPersons.userId} = ${userId} OR lower(${fieldPersons.email}) = lower(${currentUser.email}))`
        : eq(fieldPersons.userId, userId)
    )
    .limit(1);

  return {
    user: {
      id: currentUser.id,
      email: currentUser.email,
      fullName: currentUser.fullName,
      role: currentUser.role,
      phone: currentUser.phone,
      language: currentUser.language,
      city: currentUser.city,
      state: currentUser.state,
    },
    person: person ?? null,
  };
}

export async function updateFieldProfile(userId: number, input: Record<string, unknown>) {
  const [currentUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!currentUser) throw notFound("User not found");
  const [existing] = await db
    .select()
    .from(fieldPersons)
    .where(
      currentUser.email
        ? sql`(${fieldPersons.userId} = ${userId} OR lower(${fieldPersons.email}) = lower(${currentUser.email}))`
        : eq(fieldPersons.userId, userId)
    )
    .limit(1);

  if (!existing) {
    throw notFound("Field person profile not found for this account");
  }

  const pick = (k: string, fallback: string | null) => (input[k] === undefined ? fallback : String(input[k] || "").trim() || null);
  const [person] = await db
    .update(fieldPersons)
    .set({
      fullName: input.fullName === undefined ? existing.fullName : String(input.fullName).trim(),
      mobile: pick("mobile", existing.mobile),
      email: pick("email", existing.email),
      skills: input.skills === undefined ? existing.skills : asArray(input.skills),
      expertise: input.expertise === undefined ? existing.expertise : asArray(input.expertise),
      department: pick("department", existing.department),
      organization: pick("organization", existing.organization),
      experienceYears: input.experienceYears === undefined ? existing.experienceYears : Math.max(0, Number(input.experienceYears) || 0),
      registeredLocation: pick("registeredLocation", existing.registeredLocation),
      latitude: input.latitude === undefined ? existing.latitude : Number.isFinite(Number(input.latitude)) ? Number(input.latitude) : null,
      longitude: input.longitude === undefined ? existing.longitude : Number.isFinite(Number(input.longitude)) ? Number(input.longitude) : null,
      serviceRadiusKm: input.serviceRadiusKm === undefined ? existing.serviceRadiusKm : Math.max(0, Number(input.serviceRadiusKm) || 25),
      languages: input.languages === undefined ? existing.languages : asArray(input.languages),
      availabilityStatus: input.availabilityStatus === undefined ? existing.availabilityStatus : String(input.availabilityStatus).toUpperCase(),
      updatedAt: new Date(),
    })
    .where(eq(fieldPersons.id, existing.id))
    .returning();

  return person;
}
